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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import { getNotesForUserCourse, getAllCourses } from '../services/dataService';
import { convertChinese } from '../utils/chineseConverter';
import { useNavigate, useParams } from 'react-router-dom';
import { Course } from '../types';
import MarkdownViewer from '../components/MarkdownViewer';

interface Note {
  text: string;
  lessonName: string;
  unitName: string;
  updatedAt: string;
}

export default function Notebook() {
  const { courseId = '' } = useParams<{ courseId: string; }>();
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  
  // State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Get current course name
  const currentCourseName = courseId && courses.find(course => course.id === courseId)?.name;

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

  async function loadNotes() {
    if (!currentUser) return;

    try {
      let userNotes;
        userNotes = await getNotesForUserCourse(currentUser.uid, courseId);
      setNotes(userNotes);
      setError(null);
    } catch (err) {
      setError(t('failedToLoadNotes'));
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotes();
  }, [courseId, currentUser]);

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
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          {t('noNotesFound')}
        </Typography>
      </Container>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h2" gutterBottom>
        {courseId && courses.find(course => course.id === courseId) ? convertChinese(courses.find(course => course.id === courseId)!.name, language) : t('myNotes')}
      </Typography>
          <Grid container spacing={3}>
            {notes.map((note, index) => {
              const hue = Math.random() * 360;
              const pastelColor = (theme: { palette: { mode: string; }; }) => theme.palette.mode === 'dark'
                ? `hsl(${hue}, 30%, 25%)` // Darker, more muted colors for dark mode
                : `hsl(${hue}, 70%, 90%)`; // Light pastel colors for light mode
              const plainTextPreview = getPlainTextPreview(note.text);

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      backgroundColor: pastelColor,
                      color: theme => theme.palette.text.primary,
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
                  <Box sx={{
                    '& .toastui-editor-contents': {
                      fontSize: 'var(--font-size-body)',
                    },
                  }}>
                    <MarkdownViewer content={convertChinese(selectedNote.text, language)} />
                  </Box>
                </DialogContent>
              </>
            )}
          </Dialog>
    </Container>);
}