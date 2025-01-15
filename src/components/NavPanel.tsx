import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  LinearProgress,
  Stack,
  IconButton,
  Drawer,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { styled } from '@mui/material/styles';
import { Course, Unit, Lesson } from '../types';
import { getLessonsForUnit } from '../services/dataService';

const StyledListItem = styled(ListItemButton)(({ theme }) => ({
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.light,
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
    }
  },
  '&.Mui-disabled': {
    opacity: 0.7,
    cursor: 'not-allowed'
  }
}));

const StyledUnitListItem = styled(ListItemButton)(({ theme }) => ({
  '&.Mui-selected': {
    backgroundColor: theme.palette.grey[200],
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    }
  }
}));

const DRAWER_WIDTH = 350;
const TOOLBAR_HEIGHT = 64; // Standard MUI toolbar height

interface NavPanelProps {
  course: Course;
  units: Unit[];
  progress: { [key: string]: { completed: boolean } };
  selectedUnitId?: string;
  selectedLessonId?: string;
  onSelectLesson?: (unitId: string, lessonId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onCollapse?: (collapsed: boolean) => void;
}

export default function NavPanel({ 
  course, 
  units, 
  progress, 
  selectedUnitId,
  selectedLessonId,
  onSelectLesson,
  isOpen,
  onToggle,
  onCollapse
}: NavPanelProps) {
  const navigate = useNavigate();
  const [expandedUnits, setExpandedUnits] = useState<{ [key: string]: boolean }>(
    units.reduce((acc, unit) => ({ 
      ...acc, 
      [unit.id]: unit.id === selectedUnitId || !selectedUnitId
    }), {})
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unitLessons, setUnitLessons] = useState<{ [key: string]: Lesson[] }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Load lessons for each unit
  useEffect(() => {
    async function loadLessons(unit: Unit) {
      if (!unitLessons[unit.id] && !loading[unit.id]) {
        try {
          setLoading(prev => ({ ...prev, [unit.id]: true }));
          const lessons = await getLessonsForUnit(unit.id);
          setUnitLessons(prev => ({ ...prev, [unit.id]: lessons }));
        } catch (err) {
          console.error(`Error loading lessons for unit ${unit.id}:`, err);
        } finally {
          setLoading(prev => ({ ...prev, [unit.id]: false }));
        }
      }
    }

    units.forEach(unit => {
      if (expandedUnits[unit.id]) {
        loadLessons(unit);
      }
    });
  }, [units, expandedUnits, loading]); // Removed unitLessons from dependencies

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const isLessonAccessible = (lesson: Lesson, allLessons: Lesson[]) => {
    // return true; // for debuggging
    // If course has unlockLessonIndex, only that lesson is accessible in each unit
    if (course.settings?.unlockLessonIndex !== undefined) {
      if(lesson.orderIndex === course.settings.unlockLessonIndex) {
        return true;
      }
    }

    // Otherwise use the default progression logic:
    // First lesson of each unit is always accessible
    if (lesson.orderIndex === 1) return true;

    // Other lessons require previous lesson to be completed
    const previousLesson = allLessons.find(l => l.orderIndex === lesson.orderIndex - 1);
    console.log(`Previous lesson ${previousLesson?.name} is completed: ${progress[previousLesson?.id||'']?.completed}`);
    const isAccessible = previousLesson ? progress[previousLesson.id]?.completed : false;
    return isAccessible;
  };

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  const handleLessonSelect = (unitId: string, lessonId: string) => {
    if (onSelectLesson) {
      onSelectLesson(unitId, lessonId);
    } else {
      console.log('navigating to unit', unitId, 'lesson', lessonId);
      navigate(`/${course.id}/${unitId}/${lessonId}`);
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, overflow: 'hidden' }}>
          <IconButton onClick={onToggle} sx={{ display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          {!isCollapsed && (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography variant="h6" component="h1" noWrap>{course.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} noWrap>
                {course.description}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {units.map((unit) => {
          const lessons = unitLessons[unit.id] || [];
          const completedCount = lessons.filter(l => progress[l.id]?.completed).length;
          const progressPercentage = (completedCount / lessons.length) * 100;

          return (
            <Box key={unit.id}>
              <StyledUnitListItem 
                onClick={() => toggleUnit(unit.id)}
                selected={unit.id === selectedUnitId}
              >
                <ListItemText
                  primary={isCollapsed ? `U${unit.orderIndex || ''}` : unit.name}
                  secondary={!isCollapsed && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress variant="determinate" value={progressPercentage} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {completedCount} of {lessons.length} completed
                      </Typography>
                    </Box>
                  )}
                  sx={{ m: isCollapsed ? 0 : undefined }}
                />
                {!isCollapsed && (expandedUnits[unit.id] ? <ExpandLess /> : <ExpandMore />)}
              </StyledUnitListItem>
              {!isCollapsed && (
                <Collapse in={expandedUnits[unit.id]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {lessons.map((lesson) => {
                      const isAccessible = isLessonAccessible(lesson, lessons);
                      const isCompleted = progress[lesson.id]?.completed;

                      return (
                        <StyledListItem
                          key={lesson.id}
                          sx={{ pl: 4 }}
                          onClick={() => isAccessible && handleLessonSelect(unit.id, lesson.id)}
                          selected={selectedLessonId === lesson.id}
                          disabled={!isAccessible}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                            <Typography sx={{ flex: 1 }}>
                              {lesson.orderIndex}. {lesson.name}
                            </Typography>
                            {!isAccessible ? (
                              <LockIcon color="disabled" fontSize="small" />
                            ) : isCompleted ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : null}
                          </Stack>
                        </StyledListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      <Box
        component="nav"
        sx={{
          width: { 
            sm: isCollapsed ? 0 : DRAWER_WIDTH 
          },
          flexShrink: { sm: 0 },
          transition: theme => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={isOpen}
          onClose={onToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRight: 1,
              borderColor: 'divider',
              mt: `${TOOLBAR_HEIGHT}px`
            },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant={isCollapsed ? 'temporary' : 'permanent'}
          open={!isCollapsed}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              borderRight: 1,
              borderColor: 'divider',
              mt: `${TOOLBAR_HEIGHT}px`,
              height: `calc(100vh - ${TOOLBAR_HEIGHT}px)`,
              transition: theme => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
      {/* Floating toggle button for desktop */}
      <IconButton
        color="inherit"
        aria-label={isCollapsed ? "expand navigation" : "collapse navigation"}
        onClick={handleToggleCollapse}
        sx={{ 
          position: 'fixed',
          top: TOOLBAR_HEIGHT + 16,
          left: isCollapsed ? 16 : DRAWER_WIDTH - 40,
          display: { xs: 'none', sm: 'flex' },
          zIndex: theme => theme.zIndex.drawer + 2,
          bgcolor: 'background.paper',
          boxShadow: 2,
          '&:hover': {
            bgcolor: 'background.paper',
          },
          transition: theme => theme.transitions.create('left', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </IconButton>
    </>
  );
} 