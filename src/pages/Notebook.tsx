import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { getNotesForUserCourse, getAllCourses } from '../services/dataService';
import { convertChinese } from '../utils/chineseConverter';
import { useNavigate, useParams } from 'react-router-dom';
import { Course } from '../types';
import MarkdownViewer from '../components/MarkdownViewer';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import QuizView from '../components/QuizView';
import { firestoreService } from '../services/firestoreService';
import type { Quiz } from '../types';

interface Note {
  text: string;
  lessonName: string;
  unitName: string;
  updatedAt: string;
  weekGroup?: string; // Added for weekly grouping
  isQuiz?: boolean;
  quizId?: string;
  quizHistory?: {
    answers: { [key: string]: string };
    score: number;
    correct: number;
    total: number;
  };
}

export default function Notebook() {
  const { courseId = '' } = useParams<{ courseId: string; }>();
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Enhanced state management
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [groupedNotes, setGroupedNotes] = useState<{ [key: string]: Note[] }>({});
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  
  useEffect(() => {
    async function loadQuizData() {
      if (selectedNote?.quizId) {
        try {
          const quizData = await firestoreService.getQuizById(selectedNote.quizId);
          setQuiz(quizData);
        } catch (err) {
          console.error('Error loading quiz:', err);
        }
      }
    }
    void loadQuizData();
  }, [selectedNote]);

  useEffect(() => {
    async function loadCourses() {
      try {
        const coursesData = await getAllCourses();
        setCourses(coursesData);
      } catch (err) {
        console.error('Error loading courses:', err);
      }
    }
    void loadCourses();
  }, []);

  useEffect(() => {
    async function loadNotes() {
      if (!currentUser) return;

      try {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        // Get notes and quiz history
        const [userNotes, quizHistories] = await Promise.all([
          getNotesForUserCourse(currentUser.uid, courseId, startOfMonth, endOfMonth),
          firestoreService.getQuizHistoryForUserCourse(currentUser.uid, courseId, startOfMonth, endOfMonth)
        ]);
        // Convert quiz histories to note format
        const quizNotes = quizHistories.map(history => ({
          text: `分数: ${history.correct}/${history.total}`,
          lessonName: '结果',
          unitName: '测验',
          updatedAt: history.completedAt,
          isQuiz: true,
          quizId: history.quizId,
          quizHistory: {
            answers: history.answers,
            score: history.score,
            correct: history.correct,
            total: history.total
          }
        }));

        // Combine notes and quiz histories
        let combinedNotes = [...userNotes, ...quizNotes];
      

        // Group notes by week
        const grouped = combinedNotes.reduce((acc: { [key: string]: Note[] }, note) => {
          const noteDate = new Date(note.updatedAt);
          const weekStart = new Date(noteDate);
          weekStart.setDate(noteDate.getDate() - noteDate.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          
          if (!acc[weekKey]) {
            acc[weekKey] = [];
          }
          acc[weekKey].push(note);
          return acc;
        }, {});

        setGroupedNotes(grouped);
        setNotes(userNotes);
        setError(null);
      } catch (err) {
        setError(t('failedToLoadNotes'));
        console.error('Error loading notes:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadNotes();
  }, [courseId, currentUser, currentMonth]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const isNextMonthDisabled = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(currentMonth.getMonth() + 1);
    const today = new Date();
    // Compare year and month only
    return nextMonth.getFullYear() > today.getFullYear() ||
      (nextMonth.getFullYear() === today.getFullYear() && 
       nextMonth.getMonth() > today.getMonth());
  };

  const handleNextMonth = () => {
    if (!isNextMonthDisabled()) {
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(currentMonth.getMonth() + 1);
      setCurrentMonth(nextMonth);
    }
  };

  const getPlainTextPreview = (markdown: string) => {
    // Remove markdown syntax and get first line
    return markdown
      .replace(/[\*\_\#\`\[\]\(\)\{\}\|\>\~\^]/g, '')
      .split('\n')[0]
      .trim()
      .substring(0, 100);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">{t('pleaseSignIn')}</Alert>
      </Container>
    );
  }

  if (!courseId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('selectCourse')}
        </Typography>
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} md={4} key={course.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                  },
                }}
                onClick={() => navigate(`/notebook/${course.id}`)}
              >
                <CardContent>
                  <Typography variant="h6" component="h2">
                    {convertChinese(course.name, language)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }
  if (notes.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            {courseId && courses.find(course => course.id === courseId) ? 
              convertChinese(courses.find(course => course.id === courseId)!.name, language) : 
              t('myNotes')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={handlePreviousMonth} 
              disabled={loading}
              data-testid="prev-month-button"
              sx={{
                '&.Mui-disabled': {
                  opacity: 0.5,
                  color: 'text.disabled'
                }
              }}
            >
              <ArrowBackIos />
            </IconButton>
            <Typography variant="h6">
              {currentMonth.toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'zh-CN', { year: 'numeric', month: 'long' })}
            </Typography>
            <IconButton 
              onClick={handleNextMonth} 
              disabled={loading || isNextMonthDisabled()} 
              data-testid="next-month-button"
              sx={{
                '&.Mui-disabled': {
                  opacity: 0.5,
                  color: 'text.disabled'
                }
              }}
            >
              <ArrowForwardIos />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          {t('noNotesFound')}
        </Typography>
      </Container>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {courseId && courses.find(course => course.id === courseId) ? 
            convertChinese(courses.find(course => course.id === courseId)!.name, language) : 
            t('myNotes')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={handlePreviousMonth} 
            disabled={loading} 
            aria-label="previous month"
            sx={{
              '&.Mui-disabled': {
                opacity: 0.5,
                color: 'text.disabled'
              }
            }}
          >
            <ArrowBackIos />
          </IconButton>
          <Typography variant="h6">
            {currentMonth.toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'zh-CN', { year: 'numeric', month: 'long' })}
          </Typography>
          <IconButton 
            onClick={handleNextMonth} 
            disabled={loading || isNextMonthDisabled()} 
            aria-label="next month"
            sx={{
              '&.Mui-disabled': {
                opacity: 0.5,
                color: 'text.disabled'
              }
            }}
          >
            <ArrowForwardIos />
          </IconButton>
        </Box>
      </Box>

      {Object.entries(groupedNotes)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([weekStart, weekNotes]) => (
          <Box key={weekStart} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {new Date(weekStart).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'zh-CN', 
                { month: 'long', day: 'numeric' })} - 
              {new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6))
                .toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'zh-CN', { month: 'long', day: 'numeric' })}
            </Typography>
            <Grid container spacing={3}>
              {weekNotes.map((note, index) => {
                const getCardStyle = (theme: { palette: { mode: string; }; }) => {
                  if (note.isQuiz) {
                    // Exam paper style for quiz notes
                    return {
                      backgroundColor: theme.palette.mode === 'dark' ? '#2c2c2c' : '#fff9f0',
                      backgroundImage: theme.palette.mode === 'dark'
                        ? 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)'
                        : 'linear-gradient(rgba(66, 66, 66, 0.1) 1px, transparent 1px)',
                      backgroundSize: '100% 25px',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '2px 2px 5px rgba(0,0,0,0.3)'
                        : '2px 2px 5px rgba(0,0,0,0.1)',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        borderStyle: 'solid',
                        borderWidth: '0 20px 20px 0',
                        borderColor: theme.palette.mode === 'dark'
                          ? '#3d3d3d transparent transparent transparent'
                          : '#f0e6d6 transparent transparent transparent',
                        transition: 'all 0.2s ease'
                      }
                    };
                  } else {
                    const hue = Math.random() * 360;
                    return {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? `hsl(${hue}, 30%, 25%)`
                        : `hsl(${hue}, 70%, 90%)`
                    };
                  }
                };
                const plainTextPreview = getPlainTextPreview(note.text);

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                    <Card
                      sx={{
                        height: '100%',
                        ...getCardStyle(theme),
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3,
                        },
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onClick={() => setSelectedNote(note)}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom noWrap>
                          {convertChinese(note.unitName, language)} / {convertChinese(note.lessonName, language)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            mb: 1
                          }}
                        >
                          {plainTextPreview}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(note.updatedAt).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'zh-CN')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}

          <Dialog
            open={Boolean(selectedNote)}
            onClose={() => setSelectedNote(null)}
            maxWidth="md"
            fullWidth
          >
            {selectedNote && (
              <>
                <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
                  {convertChinese(selectedNote.unitName, language)} / {convertChinese(selectedNote.lessonName, language)}
                  <IconButton
                    onClick={() => setSelectedNote(null)}
                    aria-label="close"
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                  {selectedNote.isQuiz && selectedNote.quizHistory ? (
                    quiz && <QuizView
                      quiz={quiz}
                      onSubmit={() => {}}
                      onClose={() => setSelectedNote(null)}
                      readOnlyAnswers={selectedNote.quizHistory.answers}
                    />
                  ) : (
                    <Box sx={{
                      '& .toastui-editor-contents': {
                        fontSize: 'var(--font-size-body)',
                      },
                    }}>
                      <MarkdownViewer content={convertChinese(selectedNote.text, language)} />
                    </Box>
                  )}
                </DialogContent>
              </>
            )}
          </Dialog>
    </Container>);
}