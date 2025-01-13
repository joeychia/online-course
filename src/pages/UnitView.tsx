import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid,
  Card,
  CardContent,
  CardActionArea,
  LinearProgress,
  Stack,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import { Lesson } from '../types';
import { 
  getMockCourse, 
  getMockUnit, 
  getMockLessonsForUnit,
  getMockUser,
  getMockUnitsForCourse
} from '../data/mockDataLoader';
import LessonView from './LessonView';
import NavPanel from '../components/NavPanel';

interface LessonCardProps {
  lesson: Lesson;
  isAccessible: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

const LessonCard = ({ lesson, isAccessible, isCompleted, onClick }: LessonCardProps) => {
  return (
    <Card>
      <CardActionArea 
        onClick={onClick}
        disabled={!isAccessible}
        sx={{ height: '100%', opacity: isAccessible ? 1 : 0.7 }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
              Lesson {lesson.orderIndex}
            </Typography>
            {isCompleted ? (
              <CheckCircleIcon color="success" />
            ) : !isAccessible ? (
              <LockIcon color="disabled" />
            ) : null}
          </Stack>
          <Typography variant="h5" component="div" gutterBottom>
            {lesson.name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const TOOLBAR_HEIGHT = 64; // Standard MUI toolbar height

export default function UnitView() {
  const { courseId = '', lessonId = '' } = useParams<{ 
    courseId: string; 
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  const course = getMockCourse(courseId);
  const currentUser = getMockUser('system');
  const userProgress = currentUser?.progress[courseId] || {};

  // Find the unit based on the lesson ID
  const findUnitForLesson = (lessonId: string) => {
    const units = getMockUnitsForCourse(courseId);
    for (const unit of units) {
      const lessons = getMockLessonsForUnit(unit.id);
      if (lessons.some(l => l.id === lessonId)) {
        return unit;
      }
    }
    return null;
  };

  const unit = lessonId ? findUnitForLesson(lessonId) : null;

  useEffect(() => {
    if (lessonId) {
      const units = getMockUnitsForCourse(courseId);
      for (const unit of units) {
        const lessons = getMockLessonsForUnit(unit.id);
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
          setSelectedLesson(lesson);
          break;
        }
      }
    }
  }, [lessonId, courseId]);

  if (!course || (lessonId && !unit)) {
    return <Typography>Course or lesson not found</Typography>;
  }

  const units = getMockUnitsForCourse(course.id);
  const unitLessons = unit ? getMockLessonsForUnit(unit.id) : [];
  const currentIndex = selectedLesson ? unitLessons.findIndex(l => l.id === selectedLesson.id) : -1;
  const hasNext = currentIndex < unitLessons.length - 1;
  const hasPrevious = currentIndex > 0;

  const isLessonAccessible = (lesson: Lesson) => {
    if (lesson.orderIndex === 1) return true;
    const previousLesson = unitLessons.find(l => l.orderIndex === lesson.orderIndex - 1);
    return previousLesson ? userProgress[previousLesson.id]?.completed : false;
  };

  const handleNext = () => {
    if (hasNext && currentIndex >= 0) {
      const nextLesson = unitLessons[currentIndex + 1];
      setSelectedLesson(nextLesson);
      navigate(`/${courseId}/${nextLesson.id}`);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious && currentIndex >= 0) {
      const prevLesson = unitLessons[currentIndex - 1];
      setSelectedLesson(prevLesson);
      navigate(`/${courseId}/${prevLesson.id}`);
    }
  };

  const handleComplete = (lessonId: string) => {
    // In a real app, this would update the backend
    console.log('Completing lesson:', lessonId);
  };

  const handleSelectLesson = (unitId: string, lessonId: string) => {
    navigate(`/${courseId}/${lessonId}`);
    setIsDrawerOpen(false);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleNavCollapse = (collapsed: boolean) => {
    setIsNavCollapsed(collapsed);
  };

  // Calculate progress
  const completedCount = unitLessons.filter(lesson => userProgress[lesson.id]?.completed).length;
  const progressPercentage = (completedCount / unitLessons.length) * 100;

  const mainContent = selectedLesson ? (
    <LessonView
      lesson={selectedLesson}
      onNext={handleNext}
      onPrevious={handlePrevious}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
      onComplete={handleComplete}
      isCompleted={selectedLesson ? userProgress[selectedLesson.id]?.completed : false}
    />
  ) : (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {unit?.name}
        </Typography>
        <Typography variant="body1" paragraph>
          {unit?.description}
        </Typography>
        <Box sx={{ mt: 2, mb: 3 }}>
          <LinearProgress variant="determinate" value={progressPercentage} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {completedCount} of {unitLessons.length} lessons completed ({Math.round(progressPercentage)}%)
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {unitLessons.map((lesson) => {
          const isAccessible = isLessonAccessible(lesson);
          const isCompleted = userProgress[lesson.id]?.completed;

          return (
            <Grid item key={lesson.id} xs={12} sm={6} md={4}>
              <LessonCard
                lesson={lesson}
                isAccessible={isAccessible}
                isCompleted={isCompleted}
                onClick={() => handleSelectLesson(unit?.id, lesson.id)}
              />
            </Grid>
          );
        })}
      </Grid>
    </>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <NavPanel
        course={course}
        units={units}
        progress={userProgress}
        selectedUnitId={unit?.id}
        selectedLessonId={lessonId}
        onSelectLesson={handleSelectLesson}
        isOpen={isDrawerOpen}
        onToggle={toggleDrawer}
        onCollapse={handleNavCollapse}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            sm: isNavCollapsed ? 
              '100%' : 
              `calc(100% - 350px)` 
          },
          height: `calc(100vh - ${TOOLBAR_HEIGHT}px)`,
          overflow: 'auto',
          transition: theme => theme.transitions.create(['width', 'margin-left'], {
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