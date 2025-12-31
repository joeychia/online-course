import { useParams, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { TOOLBAR_HEIGHT } from '../components/NavPanel';
import { 
  Box, 
  Typography,
  CircularProgress,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SegmentIcon from '@mui/icons-material/Segment';
import { analyticsService } from '../services/analyticsService';
import NavPanel from '../components/NavPanel';
import { useState, useEffect } from 'react';
import { Lesson, Course, UserProgress, CourseUnit } from '../types';
import { useAuth } from '../hooks/useAuth';
import CourseProgress from '../components/CourseProgress';
import { firestoreService } from '../services/firestoreService';
import { useTranslation } from '../hooks/useTranslation';
import LessonView from './LessonView';
import { calculateStudyDay, extractLessonSnippets, getLessonIdForDay } from '../utils/courseUtils';
import MarkdownViewer from '../components/MarkdownViewer';



export default function CourseView() {
  const { courseId = '', unitId, lessonId } = useParams<{ 
    courseId: string;
    unitId?: string;
    lessonId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  
  const isFocusMode = new URLSearchParams(location.search).get('focus') === 'true';

  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [unitLessons, setUnitLessons] = useState<{ [key: string]: Array<{ id: string; name: string }> }>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(window.innerWidth >= 600 && !isFocusMode);
  const [userProgress, setUserProgress] = useState<{ [key: string]: UserProgress }>({});
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [todayLesson, setTodayLesson] = useState<Lesson | null>(null);
  const [studyDay, setStudyDay] = useState<number | null>(null);

  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  // Toggle drawer handler
  const handleDrawerToggle = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Listen for drawer toggle events from Layout
  useEffect(() => {
    const handleToggleDrawer = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsDrawerOpen(customEvent.detail);
    };

    window.addEventListener('toggleDrawer', handleToggleDrawer);
    return () => {
      window.removeEventListener('toggleDrawer', handleToggleDrawer);
    };
  }, []);

  // Load course data
  useEffect(() => {
    async function loadCourseData() {
      if (!courseId) return;
      setLoading(true);

      try {
        const [courseData, unitsData, userData] = await Promise.all([
          firestoreService.getCourseById(courseId),
          firestoreService.getUnitsIdNameForCourse(courseId),
          currentUser ? firestoreService.getUserById(currentUser.uid) : null
        ]);

        if (courseData) {
          setCourse(courseData);
          setUnits(unitsData);

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
          
          if (userData) {
            setUserProgress(userData.progress[courseId] || {});
            const isUserRegistered = !!userData.registeredCourses?.[courseId];
            setIsRegistered(isUserRegistered);

            // Auto-register if course is public and user is not registered
            if (courseData.isPublic && !isUserRegistered && currentUser) {
              try {
                await firestoreService.registerCourse(currentUser.uid, courseId);
                setIsRegistered(true);
              } catch (error) {
                console.error('Failed to auto-register:', error);
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
  }, [courseId, currentUser]);

  // Load lessons for expanded units
  useEffect(() => {
    async function loadUnitLessons(unitId: string) {
      if (!unitLessons[unitId]) {
        try {
          const unit = await firestoreService.getUnitById(unitId);
          const lessons = unit ? unit.lessons : [];
          setUnitLessons(prev => ({ ...prev, [unitId]: lessons }));
        } catch (err) {
          console.error(`Error loading lessons for unit ${unitId}:`, err);
        }
      }
    }

    if (unitId) {
      loadUnitLessons(unitId);
    } 
  }, [unitId]);

  // Load selected lesson
  useEffect(() => {
    async function loadLesson() {
      if (lessonId) {
        setLoading(true);
        try {
          const lesson = await firestoreService.getLessonById(lessonId);
          setCurrentLesson(lesson);
        } catch (err) {
          console.error('Error loading lesson:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentLesson(null);
      }
    }
    loadLesson();
  }, [lessonId]);

  // Track page view
  useEffect(() => {
    analyticsService.trackPageView(window.location.pathname);
  }, [courseId, unitId, lessonId]);

  // Track course view
  useEffect(() => {
    if (course) {
      analyticsService.trackCourseView({
        courseId: course.id,
        courseName: course.name
      });
    }
  }, [course]);

  // Track user identity
  useEffect(() => {
    if (currentUser) {
      analyticsService.identifyUser(currentUser.uid, {
        email: currentUser.email
      });
    }
  }, [currentUser]);

  if (!course) {
    return <Typography sx={{ mt: 2 }}>{t('courseNotFound')}</Typography>;
  }

  const handleSelectLesson = (unitId: string, lessonId: string) => {
    navigate(`/${courseId}/${unitId}/${lessonId}`);
  };

  const handleLessonComplete = async (completedLessonId: string) => {
    if (!currentUser || !course || !currentLesson) {
      return;
    }

    const completedAt = new Date().toISOString();
    const lessonName = currentLesson.name;

    // Track lesson completion
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      analyticsService.trackLessonComplete({
        courseId: course.id,
        courseName: course.name,
        unitId: unit.id,
        unitName: unit.name,
        lessonId: completedLessonId,
        lessonName
      });
    }

    // save progress to firestore
    await firestoreService.updateUserProgress(currentUser.uid, courseId, completedLessonId, true, completedAt, lessonName);

    // Update local progress state
    setUserProgress(prev => ({
      ...prev,
      [completedLessonId]: {
        completed: true,
        completedAt,
        lessonName
      }
    }));

    setCompletedLessons(prev => [...prev, completedLessonId]);
    setShowCompletionDialog(true);
  };

  const handleDropCourse = async () => {
    if (!currentUser || !courseId || !course) return;
    
    if (window.confirm(t('dropCourseConfirm'))) {
      try {
        await firestoreService.dropCourse(currentUser.uid, courseId);
        setIsRegistered(false);

        // Track course drop
        analyticsService.trackCourseDropped({
          courseId: course.id,
          courseName: course.name
        });
      } catch (err) {
        console.error('Error dropping course:', err);
      }
    }
  };

  const mainContent = loading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  ) : currentLesson ? (
    <LessonView
      key={`${currentLesson.id}-${language}`}
      courseId={courseId}
      lesson={currentLesson}
      onComplete={handleLessonComplete}
      isCompleted={completedLessons.includes(currentLesson.id)}
      enableNote={!!(course.settings.enableNote && currentLesson.disableNote !== true)}
    />
  ) : course ? (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {course.name}
        </Typography>

        {studyDay !== null && studyDay >= 0 && (
          <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
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
                      bgcolor: 'grey.100', // Slightly darker white for hover
                    }
                  }}
                  onClick={() => handleSelectLesson(todayLesson.unitId, todayLesson.id)}
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
        )}

        {course.description && (
          <Box sx={{ mb: 4 }}>
            <MarkdownViewer content={course.description} />
          </Box>
        )}

        {isRegistered || (course && course.isPublic) ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ flex: 1 }}>
              <CourseProgress 
                progress={userProgress} 
                courseId={courseId}
                units={units}
                unitLessons={unitLessons}
              />
              {isRegistered && (
                <Box sx={{ mt: 'auto', m:1, textAlign: 'left' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate(`/quiz/${courseId}`)}
                  >
                    {t('seeQuizResults')}
                  </Button>
                </Box>
              )}
            </Box>
            {isRegistered ? (
              <Box sx={{ mt: 'auto', m:1, textAlign: 'left' }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDropCourse}
                >
                  {t('dropCourse')}
                </Button>
              </Box>
            ) : (
              <Box sx={{ mt: 'auto', m:1, textAlign: 'left', p: 2, bgcolor: 'action.hover', display: 'flex', justifyContent: 'center' }}>
                 <Button 
                  component={RouterLink} 
                  to="/login" 
                  state={{ from: { pathname: location.pathname } }}
                  sx={{ textTransform: 'none' }}
                 >
                   {t('loginToTrackProgress')}
                 </Button>
              </Box>
            )}
          </Box>
        ) : (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom color="error.contrastText">
                {t('accessDenied')}
              </Typography>
              <Typography color="error.contrastText" paragraph>
                {t('pleaseRegisterFromHome')}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/')}
                sx={{ mt: 2 }}
              >
                {t('goToHome')}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  ) : null;

  return (
    <>
      <Box sx={{ 
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        width: '100%',
        top: 0,
        left: 0
      }}>
        {!isFocusMode && (
          <Button
            onClick={handleDrawerToggle}
            sx={{
              position: 'fixed',
              left: { xs: 16, sm: 12 },
              top: TOOLBAR_HEIGHT + 16,
              zIndex: theme => theme.zIndex.drawer - 1,
              minWidth: 'unset',
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: theme => `${theme.palette.background.paper}99`, // 99 makes it 60% transparent
              boxShadow: 2,
              transition: 'background-color 0.2s ease',
              '&:hover': {
                backgroundColor: 'background.paper' // Solid background on hover
              }
            }}
          >
            <SegmentIcon />
          </Button>
        )}
        {!isFocusMode && (
          <NavPanel
            course={course}
            units={units}
            progress={userProgress}
            selectedUnitId={unitId}
            selectedLessonId={lessonId}
            onSelectLesson={handleSelectLesson}
            isOpen={isDrawerOpen}
            onToggle={handleDrawerToggle}
          />
        )}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: '100%',
            height: isFocusMode ? '100vh' : `calc(100vh - ${TOOLBAR_HEIGHT+30}px)`,
            overflow: 'auto',
            mt: isFocusMode ? 0 : `${TOOLBAR_HEIGHT}px`,
            '& > *': {
              maxWidth: 'lg',
              mx: 'auto'
            },
            transition: theme => theme.transitions.create('margin', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          {mainContent}
        </Box>
      </Box>

      <Dialog
        open={showCompletionDialog}
        onClose={() => setShowCompletionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('congratulationsTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('congratulationsMessage')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowCompletionDialog(false);
              navigate(`/${courseId}`);
            }}
          >
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
