import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { 
  getMockCourse, 
  getMockUnitsForCourse,
  getMockLessonsForUnit,
} from '../data/mockDataLoader';

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

const DRAWER_WIDTH = 350;
const COLLAPSED_WIDTH = 0;
const TOOLBAR_HEIGHT = 64; // Standard MUI toolbar height

interface NavPanelProps {
  course: Course;
  units: Unit[];
  progress: { [key: string]: { completed: boolean } };
  selectedUnitId?: string;
  selectedLessonId?: string;
  onSelectLesson: (unitId: string, lessonId: string) => void;
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
  const [expandedUnits, setExpandedUnits] = useState<{ [key: string]: boolean }>(
    units.reduce((acc, unit) => ({ 
      ...acc, 
      [unit.id]: unit.id === selectedUnitId || !selectedUnitId
    }), {})
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const isLessonAccessible = (unit: Unit, lesson: Lesson, allLessons: Lesson[]) => {
    if (lesson.orderIndex === 1) return true;
    const previousLesson = allLessons.find(l => l.orderIndex === lesson.orderIndex - 1);
    return previousLesson ? progress[previousLesson.id]?.completed : false;
  };

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
        <IconButton onClick={handleToggleCollapse} sx={{ display: { xs: 'none', sm: 'flex' } }}>
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {units.map((unit) => {
          const lessons = getMockLessonsForUnit(unit.id);
          const completedCount = lessons.filter(l => progress[l.id]?.completed).length;
          const progressPercentage = (completedCount / lessons.length) * 100;

          return (
            <Box key={unit.id}>
              <StyledListItem 
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
              </StyledListItem>
              {!isCollapsed && (
                <Collapse in={expandedUnits[unit.id]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {lessons.map((lesson) => {
                      const isAccessible = isLessonAccessible(unit, lesson, lessons);
                      const isCompleted = progress[lesson.id]?.completed;

                      return (
                        <StyledListItem
                          key={lesson.id}
                          sx={{ pl: 4 }}
                          onClick={() => isAccessible && onSelectLesson(unit.id, lesson.id)}
                          selected={selectedLessonId === lesson.id}
                          disabled={!isAccessible}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                            <Typography sx={{ flex: 1 }}>
                              {lesson.orderIndex}. {lesson.name}
                            </Typography>
                            {isCompleted ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : !isAccessible ? (
                              <LockIcon color="disabled" fontSize="small" />
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
      {/* Mobile toggle button */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={onToggle}
        sx={{ 
          position: 'fixed',
          top: TOOLBAR_HEIGHT + 16,
          left: 16,
          display: { sm: 'none' },
          zIndex: theme => theme.zIndex.drawer + 2,
          bgcolor: 'background.paper',
          boxShadow: 1,
          '&:hover': {
            bgcolor: 'background.paper',
          }
        }}
      >
        <MenuIcon />
      </IconButton>
    </>
  );
} 