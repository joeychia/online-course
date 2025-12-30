import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography,
  Button,
  Paper,
  CircularProgress,
  Container
} from '@mui/material';
import { firestoreService } from '../services/firestoreService';
import { useTranslation } from '../hooks/useTranslation';
import { calculateStudyDay, extractLessonSnippets, getLessonIdForDay } from '../utils/courseUtils';
import { Course, Lesson } from '../types';

export default function CoursePreview() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [todayLesson, setTodayLesson] = useState<Lesson | null>(null);
  const [studyDay, setStudyDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourseData() {
      if (!courseId) return;
      setLoading(true);

      try {
        const courseData = await firestoreService.getCourseById(courseId);
        
        if (courseData) {
          setCourse(courseData);

          // Handle study schedule
          if (courseData.settings?.startDate) {
            const day = calculateStudyDay(courseData.settings.startDate);
            setStudyDay(day);
            if (day >= 0) {
              const lessonId = getLessonIdForDay(day, courseId);
              try {
                const lesson = await firestoreService.getLessonById(lessonId);
                setTodayLesson(lesson);
              } catch (e) {
                console.error('Failed to load today\'s lesson:', e);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading course data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!course || studyDay === null || studyDay < 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">{t('noLessonToday')}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', py: 2 }}>
      <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h5" gutterBottom>
          {t('welcomeTo')} {course.name}
        </Typography>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
          {t('planDay', { 
            day: studyDay, 
            date: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月${new Date().getDate()}日` 
          })}
        </Typography>
        
        {todayLesson ? (
          <Box sx={{ mt: 2, mb: 2 }}>
            {(() => {
              const snippets = extractLessonSnippets(todayLesson);
              return (
                <>
                  {snippets.reading && (
                    <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 1 }}>
                      * {t('reading')}: {snippets.reading}
                    </Typography>
                  )}
                  {snippets.meditation && (
                    <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 2 }}>
                      * {t('meditation')}: {snippets.meditation}
                    </Typography>
                  )}
                </>
              );
            })()}
            <Button 
              variant="contained" 
              sx={{ 
                mt: 2,
                bgcolor: 'background.paper',
                color: 'primary.main',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: 'grey.100',
                }
              }}
              onClick={() => navigate(`/${courseId}/${todayLesson.unitId}/${todayLesson.id}`)}
            >
              {t('enterLesson')}
            </Button>
          </Box>
        ) : (
          <Typography variant="body1" sx={{ fontStyle: 'italic', mt: 1 }}>
            {t('noLessonToday')}
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
