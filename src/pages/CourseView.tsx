import { useParams, useNavigate } from 'react-router-dom';
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
import { getLesson, getCourse, getUnitsForCourse, getLessonsForUnit, getUser, updateUserProgress } from '../services/dataService';
import NavPanel from '../components/NavPanel';
import LessonView from './LessonView';
import { useState, useEffect } from 'react';
import { Lesson, Course, Unit, UserProgress } from '../types';
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<{ [key: string]: boolean }>({});
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitLessons, setUnitLessons] = useState<{ [key: string]: Lesson[] }>({});
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [isRegistered, setIsRegistered] = useState(false);

  // Load course and units data
  useEffect(() => {
    async function loadCourseData() {
      if (!courseId || !currentUser) return;
      
      setLoading(true);
      try {
        const [courseData, unitsData, userData] = await Promise.all([
          getCourse(courseId),
          getUnitsForCourse(courseId),
          getUser(currentUser.uid)
        ]);
        setCourse(courseData);
        setUnits(unitsData);
        setUserProgress(userData?.progress?.[courseId] || {});
        setIsRegistered(!!userData?.registeredCourses?.[courseId]);
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
          const lessons = await getLessonsForUnit(unitId);
          setUnitLessons(prev => ({ ...prev, [unitId]: lessons }));
        } catch (err) {
          console.error(`Error loading lessons for unit ${unitId}:`, err);
        }
      }
    }

    units.forEach(unit => {
      if (expandedUnits[unit.id]) {
        loadUnitLessons(unit.id);
      }
    });
  }, [units, expandedUnits]);

  // Load selected lesson
  useEffect(() => {
    async function loadLesson() {
      if (lessonId) {
        setLoading(true);
        try {
          const lesson = await getLesson(lessonId);
          setSelectedLesson(lesson);
        } catch (err) {
          console.error('Error loading lesson:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setSelectedLesson(null);
      }
    }
    loadLesson();
  }, [lessonId]);

  if (!course) {
    return <Typography>Course not found</Typography>;
  }

  // Initialize first unit as expanded if expandedUnits is empty
  if (Object.keys(expandedUnits).length === 0 && units.length > 0) {
    setExpandedUnits({ [units[0].id]: true });
  }

  const handleSelectLesson = (unitId: string, lessonId: string) => {
    console.log('Navigating to unit:', unitId, 'lesson:', lessonId);
    navigate(`/${courseId}/${unitId}/${lessonId}`);
  };

  const handleLessonComplete = async (completedLessonId: string) => {
    if (!currentUser) return;
    const completedAt = new Date().toISOString();
    const lessonName = selectedLesson?.name || '';

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
    if (!currentUser || !courseId) return;
    
    try {
      await firestoreService.registerCourse(currentUser.uid, courseId);
      setIsRegistered(true);
    } catch (err) {
      console.error('Error registering for course:', err);
    }
  };

  const handleDropCourse = async () => {
    if (!currentUser || !courseId) return;
    
    if (window.confirm('Are you sure you want to drop this course? Your progress will be saved but you will need to register again to continue.')) {
      try {
        await firestoreService.dropCourse(currentUser.uid, courseId);
        setIsRegistered(false);
      } catch (err) {
        console.error('Error dropping course:', err);
      }
    }
  };

  const mainContent = loading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  ) : selectedLesson ? (
    <LessonView
      courseId={courseId}
      lesson={selectedLesson}
      onComplete={handleLessonComplete}
      isCompleted={userProgress[selectedLesson.id]?.completed}
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
    <Box sx={{ display: 'flex' }}>
      <NavPanel
        course={course}
        units={units}
        progress={userProgress}
        selectedUnitId={unitId}
        selectedLessonId={lessonId}
        onSelectLesson={handleSelectLesson}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 350px)` },
          maxWidth: 'lg'
        }}
      >
        {mainContent}
      </Box>
    </Box>
  );
} 