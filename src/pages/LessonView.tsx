import { useState, useEffect } from 'react';
import { Viewer } from '@toast-ui/react-editor';
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Lesson, Quiz, QuizHistory } from '../types';
import { analyticsService } from '../services/analyticsService';
import RichTextEditor from '../components/RichTextEditor';
import QuizView from '../components/QuizView';
import { 
  getQuiz, 
  getUnit,
  updateUserProgress,
  saveNote,
  getNotesForLesson,
  getQuizHistoryForUserLesson,
} from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import SaveIcon from '@mui/icons-material/Save';

// Function to encode URLs in markdown content
function encodeMarkdownUrls(content: string): string {
  // First encode URLs in markdown links
  let processedContent = content.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => {
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
    /(\|[^\n]+\|)\n\|[\s\-\|]+\|(\n\|[^\n]+\|)\n\|[\s\-\|]+\|/g,
    (_, firstRow, secondRow) => {
      return '| | | | |\n|---|---|---|---|\n' + firstRow + secondRow;
    }
  );

  return processedContent;
}

// Update Lesson type to include video and meditation fields
interface ExtendedLesson extends Omit<Lesson, 'video-url' | 'video-title' | 'meditation'> {
  'video-url'?: string;
  'video-title'?: string;
  meditation?: string;
}

interface LessonViewProps {
  courseId: string;
  lesson: ExtendedLesson;
  onComplete?: (lessonId: string) => void;
  isCompleted?: boolean;
}

function getYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
}

export default function LessonView({ courseId, lesson, onComplete, isCompleted: initialIsCompleted = false }: LessonViewProps) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string>("");
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string } | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizHistory | null>(null);
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [isSaving, setIsSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);

  // Track lesson view
  useEffect(() => {
    async function trackView() {
      if (lesson.unitId) {
        const unit = await getUnit(lesson.unitId);
        if (unit) {
          analyticsService.trackLessonView({
            courseId,
            courseName: unit.courseId, // We might want to fetch course name if needed
            unitId: unit.id,
            unitName: unit.name,
            lessonId: lesson.id,
            lessonName: lesson.name
          });
        }
      }
    }
    trackView();
  }, [lesson.id, courseId]);

  // Load quiz and quiz history if lesson has quizId
  useEffect(() => {
    async function loadQuizData() {
      if (lesson?.quizId && currentUser) {
        try {
          const [quizData, historyData] = await Promise.all([
            getQuiz(lesson.quizId),
            getQuizHistoryForUserLesson(currentUser.uid, lesson.id)
          ]);

          if (quizData) {
            setQuiz(quizData);
          } else {
            setQuiz(null);
          }

          setQuizHistory(historyData);
          if (historyData) {
            setQuizAnswers(historyData.answers);
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
    
    loadQuizData();
  }, [lesson?.quizId, currentUser, lesson?.id]);

  // Load existing note when component mounts
  useEffect(() => {
    async function loadNote() {
      if (!currentUser || !lesson) return;
      try {
        const existingNote = await getNotesForLesson(currentUser.uid, lesson.id);
        if (existingNote) {
          setNote(existingNote.text);
        }
      } catch (err) {
        console.error('Error loading note:', err);
      }
    }
    loadNote();
  }, [lesson?.id, currentUser]);

  const handleSaveNote = async () => {
    if (!currentUser) return;
    
    try {
      setIsSaving(true);
      await saveNote(currentUser.uid, lesson.id, note);
      setIsCompleted(true);
      onComplete?.(lesson.id);
      setNoteSaved(true);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuizSubmit = async (answers: { [key: string]: string }) => {
    if (!quiz || !currentUser) return;

    const endTime = new Date();
    const timeSpent = quizStartTime ? (endTime.getTime() - quizStartTime.getTime()) / 1000 : 0;

    // Calculate score
    let correct = 0;
    Object.entries(answers).forEach(([questionIndex, answerId]) => {
      const question = quiz.questions[parseInt(questionIndex)];
      if (question?.options && question.options[parseInt(answerId)]?.isCorrect) {
        correct++;
      }
    });

    const total = quiz.questions.length;
    const score = (correct / total) * 100;

    // Track quiz completion
    const unit = await getUnit(lesson.unitId);
    if (unit) {
      analyticsService.trackQuizComplete({
        courseId,
        courseName: unit.courseId, // We might want to fetch course name if needed
        unitId: unit.id,
        unitName: unit.name,
        lessonId: lesson.id,
        lessonName: lesson.name,
        score,
        timeSpent
      });
    }

    if (lesson && courseId && currentUser) {
      try {
        await updateUserProgress(currentUser.uid, courseId, lesson.id);
        setIsCompleted(true);
        onComplete?.(lesson.id);
        setQuizAnswers(answers);
        // Update quiz history state after submission
        const newHistory = await getQuizHistoryForUserLesson(currentUser.uid, lesson.id);
        setQuizHistory(newHistory);
      } catch (err) {
        console.error('Error submitting quiz:', err);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  const videoId = lesson['video-url'] ? getYouTubeVideoId(lesson['video-url']) : null;
  const encodedContent = lesson.content ? encodeMarkdownUrls(lesson.content) : '';
  const encodedMeditation = lesson.meditation ? encodeMarkdownUrls(lesson.meditation) : '';

  return (
    <Box sx={{ flex: 1, height: '100%', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h4" component="h1">
            {lesson.name}
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
          {lesson['video-title']}
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
            {/* Quiz Section */}
            {quiz && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5">
                本週測驗
              </Typography>
              {quizHistory && (
                <Typography variant="body2" color="text.secondary">
                  Previous Score: {quizHistory.correct}/{quizHistory.total} on {new Date(quizHistory.completedAt).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => {
                setQuizStartTime(new Date());
                setQuizOpen(true);
              }}
            >
              {quizHistory || quizAnswers ? '重新测验' : '開始測驗'}
            </Button>
          </Stack>
        </Paper>
      )}
      {/* Bible Reading Content */}
      <Box sx={{ mb: 4 }}>
        <Viewer 
          key={lesson.id}
          initialValue={encodedContent}
          customHTMLRenderer={{
            link: (node: any, { entering }: any) => {
              if (entering) {
                const { destination, title } = node;
                return {
                  type: 'openTag',
                  tagName: 'a',
                  attributes: {
                    href: destination,
                    title: title || '',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  },
                };
              } else {
                return { type: 'closeTag', tagName: 'a' };
              }
            },
          }}
        />
      </Box>

      {/* Meditation Section */}
      {lesson.meditation && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
          <Viewer initialValue={encodedMeditation} customHTMLRenderer={{
            link: (node: any, { entering }: any) => {
              if (entering) {
                const { destination, title } = node;
                return {
                  type: 'openTag',
                  tagName: 'a',
                  attributes: {
                    href: destination,
                    title: title || '',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  },
                };
              } else {
                return { type: 'closeTag', tagName: 'a' };
              }
            },
          }}/>
        </Paper>
      )}

      {/* Quiz Modal */}
      <Dialog 
        open={quizOpen} 
        onClose={() => setQuizOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, pr: 6, position: 'relative' }}>
          本週測驗
          <IconButton
            onClick={() => setQuizOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {quiz && <QuizView 
            quiz={quiz} 
            onSubmit={handleQuizSubmit}
            courseId={courseId}
            lessonId={lesson.id}
            onClose={() => setQuizOpen(false)}
          />}
        </DialogContent>
      </Dialog>
      
      {/* Notes Section */}
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Personal Notes
              <Typography variant="body2" color="text.secondary">
                You must write a note to complete this lesson
              </Typography>
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveNote}
                disabled={isSaving}
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
                {isSaving ? 'Saving...' : 'Save Note & Complete Lesson'}
              </Button>
            </Stack>
          </Stack>
          <RichTextEditor
            value={note}
            onChange={setNote}
            placeholder="Write your notes here..."
          />
        </Paper>
    </Box>
  );
} 