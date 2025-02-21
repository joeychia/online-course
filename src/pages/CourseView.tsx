import { useParams, useNavigate } from 'react-router-dom';
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
import { getLesson, getCourse, getUnitsIdNameForCourse, getLessonsIdNameForUnit, getUser, updateUserProgress } from '../services/dataService';
import { analyticsService } from '../services/analyticsService';
import NavPanel from '../components/NavPanel';
import { useState, useEffect } from 'react';
import { Lesson, Course, UserProgress, Unit } from '../types';
import { useAuth } from '../hooks/useAuth';
import CourseProgress from '../components/CourseProgress';
import { firestoreService } from '../services/firestoreService';
import { useTranslation } from '../hooks/useTranslation';
import LessonView from './LessonView';



export default function CourseView() {
  const { courseId = '', unitId = '', lessonId = '' } = useParams<{ 
    courseId: string;
    unitId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitLessons, setUnitLessons] = useState<{ [key: string]: Array<{ id: string; name: string }> }>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [userProgress, setUserProgress] = useState<{ [key: string]: UserProgress }>({});
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
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

      try {
        const [courseData, unitsData, userData] = await Promise.all([
          getCourse(courseId),
          getUnitsIdNameForCourse(courseId),
          currentUser ? getUser(currentUser.uid) : null
        ]);

        if (courseData) {
          setCourse(courseData);
          setUnits(unitsData as Unit[]);
          
          if (userData) {
            setUserProgress(userData.progress[courseId] || {});
            setIsRegistered(!!userData.registeredCourses?.[courseId]);
          }
        }
      } catch (err) {
        console.error('Error loading course data:', err);
      }
    }
    loadCourseData();
  }, [courseId, currentUser]);

  // Load lessons for expanded units
  useEffect(() => {
    async function loadUnitLessons(unitId: string) {
      if (!unitLessons[unitId]) {
        try {
          const lessons = await getLessonsIdNameForUnit(unitId);
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
          const lesson = await getLesson(lessonId);
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
    await updateUserProgress(currentUser.uid, courseId, completedLessonId, true, completedAt, lessonName);

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
      enableNote={course.settings.enableNote}
    />
  ) : (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {course.name}
        </Typography>

        {isRegistered ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ flex: 1 }}>
              <CourseProgress 
                progress={userProgress} 
                courseId={courseId}
                units={units}
                unitLessons={unitLessons}
              />
            </Box>
            <Box sx={{ mt: 'auto', m:1, textAlign: 'left' }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDropCourse}
              >
                {t('dropCourse')}
              </Button>
            </Box>
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
  );

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
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: '100%',
            height: `calc(100vh - ${TOOLBAR_HEIGHT+30}px)`,
            overflow: 'auto',
            mt: `${TOOLBAR_HEIGHT}px`,
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