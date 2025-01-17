import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Stack,
  IconButton,
  Drawer,
  CircularProgress,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuIcon from '@mui/icons-material/Menu';
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

// Export the constants
export const DRAWER_WIDTH = 350;
export const TOOLBAR_HEIGHT = 64;

interface NavPanelProps {
  course: Course;
  units: Unit[];
  progress: { [key: string]: { completed: boolean } };
  selectedUnitId?: string;
  selectedLessonId?: string;
  onSelectLesson?: (unitId: string, lessonId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
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
}: NavPanelProps) {
  const navigate = useNavigate();
  const [expandedUnits, setExpandedUnits] = useState<{ [key: string]: boolean }>(
    units.reduce((acc, unit) => ({ 
      ...acc, 
      [unit.id]: unit.id === selectedUnitId || !selectedUnitId
    }), {})
  );
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
    const isAccessible = previousLesson ? progress[previousLesson.id]?.completed : false;
    return isAccessible;
  };

  const handleLessonSelect = (unitId: string, lessonId: string) => {
    if (onSelectLesson) {
      onSelectLesson(unitId, lessonId);
    } else {
      console.log('navigating to unit', unitId, 'lesson', lessonId);
      navigate(`/${course.id}/${unitId}/${lessonId}`);
    }
    
    // Close drawer on mobile after selecting a lesson
    const isMobile = window.innerWidth < 600; // sm breakpoint is 600px
    if (isMobile) {
      onToggle();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, overflow: 'hidden' }}>
          <IconButton onClick={onToggle} >
            <CloseIcon />
          </IconButton>
          <Box 
            sx={{ 
              flex: 1, 
              overflow: 'hidden',
              '&:hover': {
                cursor: 'pointer',
                '& h1': {
                  color: 'primary.main',
                }
              }
            }}
            onClick={() => navigate(`/${course.id}`)}
          >
            <Typography variant="h6" component="h1" noWrap sx={{ transition: 'color 0.2s' }}>
              {course.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} noWrap>
              {course.description}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {units.map((unit) => {
          const lessons = unitLessons[unit.id] || [];

          return (
            <Box key={unit.id}>
              <StyledUnitListItem 
                onClick={() => toggleUnit(unit.id)}
                selected={unit.id === selectedUnitId}
              >
                <ListItemText
                  primary={unit.name}
                  sx={{ m: 0 }}
                />
                {expandedUnits[unit.id] ? <ExpandLess /> : <ExpandMore />}
              </StyledUnitListItem>
              <Collapse in={expandedUnits[unit.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {loading[unit.id] ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    lessons.map((lesson) => {
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
                            ) : (
                              <LockOpenIcon color="primary" fontSize="small" />
                            )}
                          </Stack>
                        </StyledListItem>
                      );
                    })
                  )}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { sm: isOpen ? DRAWER_WIDTH : 0 },
        flexShrink: { sm: 0 },
        transition: theme => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      {/* Mobile Drawer */}
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
            mt: `${TOOLBAR_HEIGHT}px`,
            height: '100%',
            overflowX: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: DRAWER_WIDTH,
            borderRight: 1,
            borderColor: 'divider',
            mt: `${TOOLBAR_HEIGHT}px`,
            height: `calc(100vh - ${TOOLBAR_HEIGHT}px)`,
            overflowX: 'hidden',
            transform: isOpen ? 'none' : `translateX(-${DRAWER_WIDTH}px)`,
            visibility: isOpen ? 'visible' : 'hidden',
            transition: theme => theme.transitions.create(['transform', 'visibility'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
} 