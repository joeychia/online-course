import { useParams, useNavigate } from 'react-router-dom';
import { TOOLBAR_HEIGHT } from '../components/NavPanel';
import { 
  Box, 
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Card,
  CircularProgress,
  Button,
  Paper,
} from '@mui/material';
import { getLesson, getCourse, getUnitsIdNameForCourse, getLessonsIdNameForUnit, getUser, updateUserProgress } from '../services/dataService';
import { analyticsService } from '../services/analyticsService';
import NavPanel from '../components/NavPanel';
import LessonView from './LessonView';
import { useState, useEffect } from 'react';
import { Lesson, Course, UserProgress } from '../types';
import { useAuth } from '../contexts/AuthContext';
import CourseProgress from '../components/CourseProgress';
import { firestoreService } from '../services/firestoreService';

export default function CourseView() {
  const { courseId = '', unitId = '', lessonId = '' } = useParams<{ 
    courseId: string;
    unitId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Array<{ id: string; name: string }>>([]);
  const [unitLessons, setUnitLessons] = useState<{ [key: string]: Array<{ id: string; name: string }> }>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(window.innerWidth >= 600);
  const [userProgress, setUserProgress] = useState<{ [key: string]: UserProgress }>({});
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

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
          setUnits(unitsData);
          
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
  }, [unitId, unitLessons]);

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
    return <Typography>Course not found</Typography>;
  }

  const handleSelectLesson = (unitId: string, lessonId: string) => {
    console.log('Navigating to unit:', unitId, 'lesson:', lessonId);
    navigate(`/${courseId}/${unitId}/${lessonId}`);
  };

  const handleLessonComplete = async (completedLessonId: string) => {
    if (!currentUser || !course || !currentLesson) return;

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
  };

  const handleRegisterCourse = async () => {
    if (!currentUser || !courseId || !course) return;
    
    try {
      await firestoreService.registerCourse(currentUser.uid, courseId);
      setIsRegistered(true);

      // Track course registration
      analyticsService.trackCourseRegistration({
        courseId: course.id,
        courseName: course.name
      });
    } catch (err) {
      console.error('Error registering for course:', err);
    }
  };

  const handleDropCourse = async () => {
    if (!currentUser || !courseId || !course) return;
    
    if (window.confirm('Are you sure you want to drop this course? Your progress will be saved but you will need to register again to continue.')) {
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
      courseId={courseId}
      lesson={currentLesson}
      onComplete={handleLessonComplete}
      isCompleted={userProgress[currentLesson.id]?.completed}
    />
  ) : (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {course.name}
        </Typography>
        <Typography variant="body1" paragraph>
          {course.description}
        </Typography>

        {isRegistered ? (
          <CourseProgress progress={userProgress} courseId={courseId} />
        ) : (
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Register for This Course
              </Typography>
              <Typography color="text.secondary" paragraph>
                Register to track your progress and access all course materials.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRegisterCourse}
                sx={{ mt: 2 }}
              >
                Register Now
              </Button>
            </Box>
          </Paper>
        )}

        <List>
          {units.map((unit) => {
            const lessons = unitLessons[unit.id] || [];
            
            return (
              <Card key={unit.id} sx={{ mb: 2 }}>
                <ListItemButton onClick={() => {
                  const firstLesson = lessons[0];
                  if (firstLesson) {
                    handleSelectLesson(unit.id, firstLesson.id);
                  }
                }}>
                  <ListItemText
                    primary={unit.name}
                  />
                </ListItemButton>
              </Card>
            );
          })}
        </List>
      </Box>

      {isRegistered && (
        <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button
            variant="text"
            color="inherit"
            onClick={handleDropCourse}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                color: 'error.main',
              }
            }}
          >
            Drop Course
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      overflow: 'hidden' // Prevent body scroll
    }}>
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
          m: { xs: 2, sm: 3 },
          width: '100%',
          height: `calc(100vh - ${TOOLBAR_HEIGHT}px)`,
          overflow: 'auto',
          ml: { xs: 0 },
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
  );
} 