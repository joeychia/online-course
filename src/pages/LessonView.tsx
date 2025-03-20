import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  CircularProgress,
  DialogActions
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Lesson, Quiz, QuizHistory } from '../types';
import { analyticsService } from '../services/analyticsService';
import RichTextEditor from '../components/RichTextEditor';
import QuizView from '../components/QuizView';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../hooks/useAuth';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from '../hooks/useTranslation';
import { useParams } from 'react-router-dom';
import { getYouTubeVideoId } from '../utils/urlUtils';
import { convertChinese } from '../utils/chineseConverter';
import MarkdownViewer from '../components/MarkdownViewer';

// Function to encode URLs in markdown content
function encodeMarkdownUrls(content: string): string {
  // First encode URLs in markdown links
  let processedContent = content.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match: string, text: string, url: string): string => {
      // Only encode if URL contains unencoded spaces
      if (url.includes(' ') && !url.includes('%20')) {
        const encodedUrl = url.replace(/ /g, '%20');
        return `[${text}](${encodedUrl})`;
      }
      return match;
    }
  );

  // Transform markdown tables to have empty headers
  processedContent = processedContent.replace(
    /(\|[^\n]+\|)\n\|[\s-|]+\|(\n\|[^\n]+\|)\n\|[\s-|]+\|/g,
    (_: string, firstRow: string, secondRow: string): string => {
      return '| | | | |\n|---|---|---|---|\n' + firstRow + secondRow;
    }
  );

  return processedContent;
}

// Update Lesson type to include video fields
interface ExtendedLesson extends Omit<Lesson, 'video-url' | 'video-title'> {
  'video-url'?: string;
  'video-title'?: string;
  userNote?: string;
  courseId: string;
}



interface LessonViewProps {
  courseId: string;
  lesson: Lesson;
  onComplete: (lessonId: string) => Promise<void>;
  isCompleted: boolean;
  enableNote?: boolean;
}

const LessonView: React.FC<LessonViewProps> = ({ 
  courseId,
  lesson: initialLesson,
  onComplete,
  isCompleted,
  enableNote = true,
}) => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<ExtendedLesson>({ ...initialLesson, courseId });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  const [note, setNote] = useState(lesson?.userNote || '');
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizReminderOpen, setQuizReminderOpen] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizHistory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    if (initialLesson) {
      setLesson({ ...initialLesson, courseId });
      return;
    }
    
    const fetchLesson = async () => {
      try {
        if (!lessonId) return;
        const lessonData = await firestoreService.getLessonById(lessonId);
        if (!lessonData) {
          setError('Lesson not found');
          return;
        }
        setLesson({ ...lessonData, courseId });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, initialLesson]);

  useEffect(() => {
    async function trackView() {
      if (lesson?.unitId) {
        const unit = await firestoreService.getUnitById(lesson.unitId);
        if (unit) {
          void analyticsService.trackLessonView({
            courseId: lesson.courseId,
            courseName: unit.courseId,
            unitId: unit.id,
            unitName: unit.name,
            lessonId: lesson.id,
            lessonName: lesson.name,
          });
        }
      }
    }
    if (lesson) {
      void trackView();
    }
  }, [lesson]);

  // Load quiz and quiz history if lesson has quizId
  useEffect(() => {
    async function loadQuizData(): Promise<void> {
      if (lesson?.quizId && currentUser) {
        try {
          const [quizData, historyData] = await Promise.all([
            firestoreService.getQuizById(lesson.quizId),
            firestoreService.getQuizHistoryForUserLesson(currentUser.uid, lesson.id)
          ]);

          if (quizData) {
            setQuiz(quizData);
          } else {
            setQuiz(null);
          }
          if (historyData) {
            setQuizHistory(historyData);
            setQuizComplete(true);
          }
        } catch (err) {
          console.error('Error loading quiz data:', err);
        }
      } else {
        setQuiz(null);
        setQuizHistory(null);
      }
      setLoading(false);
    }
    
    void loadQuizData();
  }, [lesson?.quizId, currentUser, lesson?.id]);

  // Load existing note when component mounts
  useEffect(() => {
    async function loadNote(): Promise<void> {
      if (!currentUser || !lesson) return;
      try {
        const existingNote = await firestoreService.getNoteForLesson(currentUser.uid, lesson.id);
        if (existingNote) {
          setNote(existingNote.text);
        }
      } catch (err) {
        console.error('Error loading note:', err);
      }
    }
    if (enableNote) {
      void loadNote();
    }
  }, [lesson?.id, currentUser, lesson]);

  const handleSaveNote = async (): Promise<void> => {
    if (!currentUser || !lesson) return;
    
    try {
      setIsSaving(true);
      const unit = await firestoreService.getUnitById(lesson.unitId);
      await firestoreService.saveNote(currentUser.uid, lesson.id, lesson.courseId, note, lesson.name, unit!.name);
      setNoteSaved(true);

      // If there's no quiz, complete the lesson
      if (!quiz) {
        await onComplete(lesson.id);
      } else if (quizComplete) {
        await onComplete(lesson.id);
      } else {
        // If quiz hasn't completed, show a reminder dialog
        setQuizReminderOpen(true);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      alert(t('saveNoteError', { message: err instanceof Error ? err.message : 'Unknown error occurred' }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuizClose = () => {
    if (quizComplete) {
      void onComplete(lesson.id);
    }
    setQuizOpen(false);
  };

  const handleQuizSubmit = async (answers: Record<string, string>) => {
    if (!lesson || !currentUser || !quiz) return;

    try {
        // Calculate score
        let correct = 0;
        Object.entries(answers).forEach(([questionIndex, answerId]) => {
          const question = quiz.questions[parseInt(questionIndex, 10)];
          if (question?.options && question.options[parseInt(answerId, 10)]?.isCorrect) {
            correct++;
          }
        });

        const total = quiz.questions.filter((question) => question.type === "single_choice").length;
        const score = (correct / total) * 100;

        void analyticsService.trackQuizComplete({
          courseId: lesson.courseId,
          lessonId: lesson.id,
          lessonName: lesson.name,
          score
        });

        // Get unit name for quiz history title
        const unit = await firestoreService.getUnitById(lesson.unitId);
        const unitName = unit ? unit.name : '';

        // Update quiz history state with the new submission
        const newQuizHistory = {
          quizId: quiz.id,
          userId: currentUser.uid,
          courseId: lesson.courseId,
          unitId: lesson.unitId,
          lessonId: lesson.id,
          answers,
          correct,
          total,
          score: (correct / total) * 100,
          completedAt: new Date().toISOString(),
          title: unitName
        };
        setQuizHistory({
          ...newQuizHistory,
        });
        await firestoreService.createQuizHistory(currentUser.uid, lesson.id, newQuizHistory);
        setQuizComplete(true);
    } catch (err) {
      console.error('Error submitting quiz:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !lesson) {
    return (
      <Box p={2}>
        <Typography color="error">{error || 'Lesson not found'}</Typography>
      </Box>
    );
  }

  const videoId = lesson['video-url'] ? getYouTubeVideoId(lesson['video-url']) : null;
  const encodedContent = lesson.content ? encodeMarkdownUrls(lesson.content) : '';

  return (
    <Box sx={{ flex: 1, height: 'auto', px: 0 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4" component="h1">
            {convertChinese(lesson.name, language)}
          </Typography>
          {isCompleted && (
            <Tooltip title="Lesson completed">
              <CheckCircleIcon color="success" />
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Video Section */}
      {lesson['video-url'] && videoId && (
        <>
          <Typography variant="h6" gutterBottom>
            {convertChinese(lesson['video-title'] || '', language)}
          </Typography>
            <Box 
              sx={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%', // 16:9 aspect ratio
                mb: 4,
              }}
            >
              <Box
                component="iframe"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={lesson['video-title']}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0,
                }}
              />
            </Box>
        </>
      )}
      {/* Lesson Content */}
      <Box sx={{ mb: 4 }}>
        <MarkdownViewer content={convertChinese(encodedContent, language)} />
      </Box>
            {/* Quiz Section */}
            {quiz && (
        <Paper sx={{ 
          p: 3, 
          mb: 4, 
          bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5">
                {t('weeklyQuiz')}
              </Typography>
              {quizHistory && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    cursor: 'pointer',
                      textDecoration: 'underline',
                      color: 'primary.main'
                  }}
                  onClick={() => {
                    setQuizOpen(true);
                  }}
                >
                  {quizHistory.total ===0 ? t('previousTest', {date: new Date(quizHistory.completedAt).toLocaleDateString('zh-TW')})  : t('previousScore', {
                    score: quizHistory.correct,
                    total: quizHistory.total,
                    date: new Date(quizHistory.completedAt).toLocaleDateString('zh-TW')
                  })}
                </Typography>
              )}
            </Box>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                // Reset quiz state and clear previous answers before opening
                setQuizComplete(false);
                setQuizHistory(null);
                setQuizOpen(true);
              }}
            >
              {t(quizHistory ? 'retakeQuiz' : 'startQuiz')}
            </Button>
          </Stack>
        </Paper>
      )}


      {/* Quiz Reminder Dialog */}
      <Dialog
        open={quizReminderOpen}
        onClose={() => setQuizReminderOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('quizReminder')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('completeQuizReminder')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuizReminderOpen(false)}>
            {t('ok')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quiz Modal */}
      <Dialog 
        open={quizOpen} 
        onClose={handleQuizClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, pr: 6, position: 'relative' }}>
        {t('weeklyQuiz')}
          <IconButton
            onClick={handleQuizClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{p:1}}>
          {quiz && <QuizView 
            quiz={quiz} 
            onSubmit={handleQuizSubmit}
            onClose={handleQuizClose}
            readOnlyAnswers={quizHistory?.answers}
          />}
        </DialogContent>
      </Dialog>
      
      {/* Notes Section or Completion Button */}
      {enableNote && !quiz ? (
        <Paper sx={{ 
          p: 3, 
          mb: 4, 
          bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
        }}>
          {!note && (
            <Typography color="warning.main" sx={{ mb: 2 }}>
              {t('mustWriteNote')}
            </Typography>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
              {t('personalNotes')}
            </Typography>
              <Button
                variant="contained"
                onClick={handleSaveNote}
                disabled={isSaving || note === ''}
                startIcon={
                  isSaving ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : noteSaved ? (
                    <CheckCircleIcon sx={{ color: 'white' }} />
                  ) : (
                    <SaveIcon sx={{ color: 'white' }} />
                  )
                }
              >
                {isSaving ? t('saving') : t('saveAndComplete')}
              </Button>
          </Stack>
          <RichTextEditor
            value={note}
            onChange={setNote}
            placeholder={t('writeNotesHere')}
            enableMarkdown={false}
          />
        </Paper>
      ) : (!quiz && 
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => onComplete(lesson.id)}
            startIcon={<CheckCircleIcon />}
            disabled={isCompleted}
          >
            {isCompleted ? t('lessonCompleted') : t('markAsComplete')}
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default LessonView;
