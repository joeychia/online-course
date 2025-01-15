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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Lesson, Quiz } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import QuizView from '../components/QuizView';
import { getQuiz } from '../services/dataService';

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
  lesson: ExtendedLesson | null;
  onComplete?: (lessonId: string) => void;
  isCompleted?: boolean;
}

function getYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
}

export default function LessonView({ 
  lesson, 
  onComplete,
  isCompleted 
}: LessonViewProps) {
  const [note, setNote] = useState<string>("");
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string } | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  // Reset note and quiz answers when lesson changes
  useEffect(() => {
    setNote("");
    setQuizAnswers(null);
    setQuizOpen(false);
    
    // Load quiz if lesson has a quizId
    async function loadQuiz() {
      if (lesson?.quizId) {
        try {
          const quizData = await getQuiz(lesson.quizId);
          if (quizData) {
            const sortedQuiz = {
              id: quizData.id,
              questions: Object.fromEntries(
                Object.entries(quizData.questions)
                  .sort(([keyA], [keyB]) => {
                    const numA = parseInt(keyA.replace(/\D/g, ''), 10);
                    const numB = parseInt(keyB.replace(/\D/g, ''), 10);
                    return numA - numB; // Sort numerically
                  })
                  .map(([key, value]) => [key, value])
              ),
            };
            setQuiz(sortedQuiz);
          } else {
            setQuiz(null);
          }
        } catch (err) {
          console.error('Error loading quiz:', err);
        }
      } else {
        setQuiz(null);
      }
    }
    
    loadQuiz();
  }, [lesson?.id, lesson?.quizId]);

  const handleSaveNote = () => {
    if (lesson && note.trim()) {
      // Here you would typically save the note to your backend
      console.log('Saving note:', { lessonId: lesson.id, note });
      onComplete?.(lesson.id);
      // Clear the note after saving
      setNote("");
    }
  };

  const handleQuizSubmit = (answers: { [key: string]: string }) => {
    if (lesson) {
      console.log('Submitting quiz answers:', { lessonId: lesson.id, answers });
      setQuizAnswers(answers);
      setQuizOpen(false);
      onComplete?.(lesson.id);
    }
  };

  if (!lesson) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography color="text.secondary">
          Select a lesson to view its content
        </Typography>
      </Box>
    );
  }

  const videoId = lesson['video-url'] ? getYouTubeVideoId(lesson['video-url']) : null;

  // Encode URLs in content and meditation before rendering
  const encodedContent = lesson.content ? encodeMarkdownUrls(lesson.content) : '';
  const encodedMeditation = lesson.meditation ? encodeMarkdownUrls(lesson.meditation) : '';

  return (
    <Box sx={{ height: '100%', p: 3 }}>
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
            {quiz && !quizAnswers && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              本週測驗
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setQuizOpen(true)}
            >
              開始測驗
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
          {quiz && <QuizView quiz={quiz} onSubmit={handleQuizSubmit} />}
        </DialogContent>
      </Dialog>
      
      {/* Notes Section */}
      {!quizAnswers && (
        <Paper sx={{ p: 3, mb: 4, bgcolor: 'grey.50' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Personal Notes
              <Typography variant="body2" color="text.secondary">
                You must write a note to complete this lesson
              </Typography>
            </Typography>
            <Button 
              onClick={handleSaveNote}
              variant="contained"
              color="primary"
              disabled={!note.trim()}
            >
              Save Notes & Complete Lesson
            </Button>
          </Stack>
          <RichTextEditor
            value={note}
            onChange={setNote}
            placeholder="Write your notes here..."
          />
        </Paper>
      )}
    </Box>
  );
} 