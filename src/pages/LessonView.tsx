import { useState, useEffect } from 'react';
import { Viewer } from '@toast-ui/react-editor';
import type { HTMLConvertorMap, MdNode } from '@toast-ui/editor';
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
  CircularProgress
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
  getNotesForLesson,
  getQuizHistoryForUserLesson,
  getLesson,
} from '../services/dataService';
import { useAuth } from '../contexts/useAuth';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslation } from '../hooks/useTranslation';
import { useParams } from 'react-router-dom';
import { getYouTubeVideoId } from '../utils/urlUtils';
import { convertChinese } from '../utils/chineseConverter';

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

interface LinkNode extends MdNode {
  destination: string;
  title?: string;
}

interface OpenTagToken {
  type: 'openTag';
  tagName: string;
  attributes?: Record<string, string>;
}

interface CloseTagToken {
  type: 'closeTag';
  tagName: string;
}

const linkRenderer: HTMLConvertorMap = {
  link: (node: MdNode): OpenTagToken | CloseTagToken => {
    const linkNode = node as LinkNode;
    if ('entering' in node && node.entering) {
      return {
        type: 'openTag',
        tagName: 'a',
        attributes: {
          href: linkNode.destination,
          title: linkNode.title || '',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      };
    }
    return { type: 'closeTag', tagName: 'a' };
  }
};

interface LessonViewProps {
  courseId: string;
  lesson: Lesson;
  onComplete: (lessonId: string) => Promise<void>;
  isCompleted: boolean;
  onSaveNote: (lessonId: string, note: string) => Promise<void>;
}

const LessonView: React.FC<LessonViewProps> = ({ 
  courseId,
  lesson: initialLesson,
  onComplete,
  isCompleted,
  onSaveNote
}) => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<ExtendedLesson>({ ...initialLesson, courseId });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  const [note, setNote] = useState(lesson?.userNote || '');
  const [noteLastUpdated, setNoteLastUpdated] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizHistory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    if (initialLesson) {
      setLesson({ ...initialLesson, courseId });
      return;
    }
    
    const fetchLesson = async () => {
      try {
        if (!lessonId) return;
        const lessonData = await getLesson(lessonId);
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
        const unit = await getUnit(lesson.unitId);
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
            getQuiz(lesson.quizId),
            getQuizHistoryForUserLesson(currentUser.uid, lesson.id)
          ]);

          if (quizData) {
            setQuiz(quizData);
          } else {
            setQuiz(null);
          }

          setQuizHistory(historyData);
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
        const existingNote = await getNotesForLesson(currentUser.uid, lesson.id);
        if (existingNote) {
          setNote(existingNote.text);
          setNoteLastUpdated(existingNote.updatedAt);
        }
      } catch (err) {
        console.error('Error loading note:', err);
      }
    }
    void loadNote();
  }, [lesson?.id, currentUser, lesson]);

  const handleSaveNote = async (): Promise<void> => {
    if (!currentUser || !lesson) return;
    
    try {
      setIsSaving(true);
      await onSaveNote(lesson.id, note);
      setNoteSaved(true);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuizSubmit = async (answers: Record<string, string>) => {
    if (!lesson || !currentUser || !quiz) return;

    try {
      const unit = await getUnit(lesson.unitId);
      if (unit) {
        // Calculate score
        let correct = 0;
        Object.entries(answers).forEach(([questionIndex, answerId]) => {
          const question = quiz.questions[parseInt(questionIndex, 10)];
          if (question?.options && question.options[parseInt(answerId, 10)]?.isCorrect) {
            correct++;
          }
        });

        const total = quiz.questions.length;
        const score = (correct / total) * 100;

        void analyticsService.trackQuizComplete({
          courseId: lesson.courseId,
          courseName: unit.courseId,
          unitId: unit.id,
          unitName: unit.name,
          lessonId: lesson.id,
          lessonName: lesson.name,
          score,
        });

        await onComplete(lesson.id);
        setQuizOpen(false);
      }
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
    <Box sx={{ flex: 1, height: '100%', p: 3 }}>
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
                <Typography variant="body2" color="text.secondary">
                  {t('previousScore', {
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
                setQuizOpen(true);
              }}
            >
              {t(quizHistory ? 'retakeQuiz' : 'startQuiz')}
            </Button>
          </Stack>
        </Paper>
      )}
      {/* Bible Reading Content */}
      <Box sx={{ 
        mb: 4,
        '& .toastui-editor-contents': {
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-body)',
        },
        '& .toastui-editor-contents p': {
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-body)',
        },
        '& .toastui-editor-contents h1': {
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-h1)',
        },
        '& .toastui-editor-contents h2': {
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-h2)',
        },
        '& .toastui-editor-contents h3': {
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-h3)',
        },
        '& .toastui-editor-contents h4': {
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-h4)',
        },
        '& .toastui-editor-contents h5': {
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-h5)',
        },
        '& .toastui-editor-contents h6': {
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-h6)',
        },
        '& .toastui-editor-contents a': {
          color: theme => theme.palette.primary.main,
        },
        '& .toastui-editor-contents blockquote': {
          borderLeft: theme => `4px solid ${theme.palette.divider}`,
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-body)',
        },

        '& .toastui-editor-contents pre': {
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          fontSize: 'var(--font-size-body)',
        },
        '& .toastui-editor-contents table': {
          borderColor: theme => theme.palette.divider,
          color: theme => theme.palette.text.secondary,
          fontSize: 'var(--font-size-body)',
        },
        '& .toastui-editor-contents th, & .toastui-editor-contents td': {
          borderColor: theme => theme.palette.divider,
        },
        '& .toastui-editor-contents ul, & .toastui-editor-contents ol': {
          fontSize: 'var(--font-size-body)',
        },
        '& .toastui-editor-contents li': {
          fontSize: 'var(--font-size-body)',
        },
      }}>
        <Viewer 
          key={`${lesson.id}-${language}`}
          initialValue={convertChinese(encodedContent, language)}
          customHTMLRenderer={linkRenderer}
        />
      </Box>

      {/* Quiz Modal */}
      <Dialog 
        open={quizOpen} 
        onClose={() => setQuizOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, pr: 6, position: 'relative' }}>
        {t('weeklyQuiz')}
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
            courseId={lesson.courseId}
            lessonId={lesson.id}
            onClose={() => setQuizOpen(false)}
          />}
        </DialogContent>
      </Dialog>
      
      {/* Notes Section */}
        <Paper sx={{ 
          p: 3, 
          mb: 4, 
          bgcolor: theme => theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              {t('personalNotes')}
              {(noteSaved || noteLastUpdated) && (
                <Typography 
                  component="span" 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  {t('lastUpdate', { date: noteSaved ? new Date().toLocaleString(language === 'zh-TW' ? 'zh-TW' : 'zh-CN') : new Date(noteLastUpdated!).toLocaleString(language === 'zh-TW' ? 'zh-TW' : 'zh-CN') })}
                </Typography>
              )}
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
                {isSaving ? t('saving') : t('saveAndComplete')}
              </Button>
            </Stack>
          </Stack>
          <RichTextEditor
            value={note}
            onChange={setNote}
            placeholder={t('writeNotesHere')}
          />
          {!note && (
            <Typography color="warning.main" sx={{ mt: 2 }}>
              {t('mustWriteNote')}
            </Typography>
          )}
        </Paper>
    </Box>
  );
}

export default LessonView;