import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { Course, Unit, Lesson, Quiz } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import QuizView from '../components/QuizView';
import NavPanel from '../components/NavPanel';
import { 
  getLesson, 
  getQuiz, 
  getUser, 
  updateUserProgress,
  getCourse,
  getUnitsForCourse 
} from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';

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

export default function LessonView() {
  const { courseId, unitId, lessonId } = useParams();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lesson, setLesson] = useState<ExtendedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string>("");
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string } | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: { completed: boolean } }>({});
  const [navOpen, setNavOpen] = useState(false);

  // Load course and units data
  useEffect(() => {
    async function loadCourseData() {
      if (!courseId || !currentUser) return;

      try {
        const [courseData, unitsData] = await Promise.all([
          getCourse(courseId),
          getUnitsForCourse(courseId)
        ]);

        if (courseData) {
          setCourse(courseData);
          setUnits(unitsData);
        }
      } catch (err) {
        console.error('Error loading course data:', err);
      }
    }

    loadCourseData();
  }, [courseId, currentUser]);

  // Load lesson data and user progress
  useEffect(() => {
    async function loadData() {
      if (!lessonId || !currentUser || !courseId) return;

      try {
        setLoading(true);
        const [lessonData, userData] = await Promise.all([
          getLesson(lessonId),
          getUser(currentUser.uid)
        ]);

        if (lessonData) {
          setLesson(lessonData);
          // Set progress for all lessons in the course
          if (userData?.progress?.[courseId]) {
            setProgress(userData.progress[courseId]);
            // Check if current lesson is completed
            setIsCompleted(!!userData.progress[courseId][lessonId]?.completed);
          }
        }
      } catch (err) {
        console.error('Error loading lesson:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [lessonId, courseId, currentUser]);

  // Load quiz if lesson has quizId
  useEffect(() => {
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
                    return numA - numB;
                  })
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
  }, [lesson?.quizId]);

  const handleSaveNote = async () => {
    if (lesson && note.trim() && courseId && currentUser) {
      try {
        await updateUserProgress(currentUser.uid, courseId, lesson.id);
        setIsCompleted(true);
        // Clear the note after saving
        setNote("");
      } catch (err) {
        console.error('Error saving note:', err);
      }
    }
  };

  const handleQuizSubmit = async (answers: { [key: string]: string }) => {
    if (lesson && courseId && currentUser) {
      try {
        await updateUserProgress(currentUser.uid, courseId, lesson.id);
        setIsCompleted(true);
        setQuizAnswers(answers);
        setQuizOpen(false);
      } catch (err) {
        console.error('Error submitting quiz:', err);
      }
    }
  };

  if (loading || !course) {
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

  if (!lesson) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography color="text.secondary">
          Lesson not found
        </Typography>
      </Box>
    );
  }

  const videoId = lesson['video-url'] ? getYouTubeVideoId(lesson['video-url']) : null;
  const encodedContent = lesson.content ? encodeMarkdownUrls(lesson.content) : '';
  const encodedMeditation = lesson.meditation ? encodeMarkdownUrls(lesson.meditation) : '';

  return (
    <Box sx={{ display: 'flex' }}>
      <NavPanel
        course={course}
        units={units}
        progress={progress}
        selectedUnitId={unitId}
        selectedLessonId={lessonId}
        isOpen={navOpen}
        onToggle={() => setNavOpen(!navOpen)}
      />
      
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
    </Box>
  );
} 