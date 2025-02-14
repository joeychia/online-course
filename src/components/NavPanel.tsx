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
  Drawer,
  CircularProgress,
  Button,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';
import { Course } from '../types';
import { getLesson, getLessonsIdNameForUnit } from '../services/dataService';
import { convertChinese } from '../utils/chineseConverter';
import { useTranslation } from '../hooks/useTranslation';

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
  },
  '& .MuiListItemText-primary': {
    fontSize: 'var(--font-size-body)',
  }
}));

const StyledUnitListItem = styled(ListItemButton)(({ theme }) => ({
  '&.Mui-selected': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.grey[800]
      : theme.palette.grey[200],
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark'
        ? theme.palette.grey[700]
        : theme.palette.grey[300],
    }
  },
  '& .MuiListItemText-primary': {
    fontSize: 'var(--font-size-body)',
    fontWeight: 500,
  }
}));

// Export the constants
export const DRAWER_WIDTH = 350;
export const TOOLBAR_HEIGHT = 62;
export const TOOLBAR_HEIGHT_MOBILE = 56;

interface NavPanelProps {
  course: Course;
  units: Array<{ id: string; name: string }>;
  progress: { [key: string]: { completed: boolean; completedAt: string } };
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
  const { t } = useTranslation();
  const { language } = useTranslation();
  const [expandedUnits, setExpandedUnits] = useState<{ [key: string]: boolean }>(
    units.reduce((acc, unit) => ({ 
      ...acc, 
      [unit.id]: unit.id === selectedUnitId || !selectedUnitId
    }), {})
  );
  const [unitLessons, setUnitLessons] = useState<{ [key: string]: Array<{ id: string; name: string }> }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [nextUnitId, setNextUnitId] = useState<string | null>(null);
    // Find the latest completed lesson
    const latestLesson = Object.entries(progress)
    .filter(([_, data]) => data.completed && data.completedAt)
    .sort((a, b) => {
      try {
        const dateA = new Date(a[1].completedAt);
        const dateB = new Date(b[1].completedAt);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    })[0];
    
  // Load next lesson when selectedLessonId changes
  useEffect(() => {
    async function loadNextLesson() {
      if (!latestLesson) return;

      try {
        const [completedLessonId] = latestLesson;
        const lesson = await getLesson(completedLessonId);
        if (!lesson) return;

        // Get all lessons in the current unit
        const currentUnitLessons = await getLessonsIdNameForUnit(lesson.unitId);
        const lessonIndex = currentUnitLessons.findIndex(l => l.id === completedLessonId);
        const currentUnitIndex = units.findIndex(u => u.id === lesson.unitId);

        if (lessonIndex !== -1 && lessonIndex < currentUnitLessons.length - 1) {
          // Next lesson is in the same unit
          setNextLessonId(currentUnitLessons[lessonIndex + 1].id);
          setNextUnitId(lesson.unitId);
        } else if (currentUnitIndex !== -1 && currentUnitIndex < units.length - 1) {
          // Look for first lesson in next unit
          const nextUnit = units[currentUnitIndex + 1];
          const nextUnitLessons = await getLessonsIdNameForUnit(nextUnit.id);
          if (nextUnitLessons.length > 0) {
            setNextLessonId(nextUnitLessons[0].id);
            setNextUnitId(nextUnit.id);
          }
        }
      } catch (error) {
        console.error('Error loading next lesson:', error);
      }
    }

    void loadNextLesson();
  }, [latestLesson, units]); // Updated dependencies to use latestLesson

  // Expand unit and scroll to next lesson when it's determined
  useEffect(() => {
    if (nextUnitId) {
      // Expand the unit containing the next lesson
      setExpandedUnits(prev => ({ ...prev, [nextUnitId]: true }));

      // Scroll the unit into view after a short delay to ensure the expansion is complete
      setTimeout(() => {
        const unitElement = document.querySelector(`[data-testid="unit-button-${nextUnitId}"]`);
        if (unitElement) {
          unitElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [nextUnitId, nextLessonId]);

  // Load lessons for selected unit only
  useEffect(() => {
    async function loadLessonsName(unitId: string) {
      if (!unitLessons[unitId] && !loading[unitId]) {
        console.log(`[NavPanel] Starting to load lessons for unit ${unitId}`);
        try {
          setLoading(prev => ({ ...prev, [unitId]: true }));
          const lessons = await getLessonsIdNameForUnit(unitId);
          console.log(`[NavPanel] Successfully loaded ${lessons.length} lessons for unit ${unitId}:`, lessons.map(l => l.name));
          setUnitLessons(prev => ({ ...prev, [unitId]: lessons }));
        } catch (err) {
          console.error(`[NavPanel] Error loading lessons for unit ${unitId}:`, err);
        } finally {
          setLoading(prev => ({ ...prev, [unitId]: false }));
          console.log(`[NavPanel] Finished loading attempt for unit ${unitId}`);
        }
      }
    }

    // Load lessons for all expanded units
    Object.entries(expandedUnits).forEach(([unitId, isExpanded]) => {
      if (isExpanded) {
        loadLessonsName(unitId);
      }
    });
  }, [expandedUnits]); // Removed loading from dependencies

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const isLessonAccessible = (lessonIndex: number, unitLessons: Array<{ id: string }>) => {

    // If course has unlockLessonIndex, only that lesson is accessible in each unit
    if (course.settings?.unlockLessonIndex !== undefined) {
      if(lessonIndex === course.settings.unlockLessonIndex) {
        return true;
      }
    }

    // Otherwise use the default progression logic:
    // First lesson of each unit is always accessible
    if (lessonIndex === 1) return true;

    // Other lessons require previous lesson to be completed
    const previousLessonId = unitLessons[lessonIndex - 2]?.id;
    return previousLessonId ? progress[previousLessonId]?.completed : false;
  };

  const handleLessonSelect = (unitId: string, lessonId: string) => {
    if (onSelectLesson) {
      onSelectLesson(unitId, lessonId);
    } else {
      navigate(`/${course.id}/${unitId}/${lessonId}`);
    }
    
    // Close drawer on mobile after selecting a lesson
    const isMobile = window.innerWidth < 600;
    if (isMobile) {
      onToggle();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {units.length > 50 && (
        <Box sx={{ 
          p: 1, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="subtitle2" sx={{ fontSize: 'var(--font-size-body)', fontWeight: 300, whiteSpace: 'nowrap' }}>
            {t('quickJump')}
          </Typography>
          <Box sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '-webkit-overflow-scrolling': 'touch',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            width: '100%',
            flexWrap: 'nowrap',
            py: 1
          }}
        >
          {Array.from({ length: Math.ceil(units.length / 30) }, (_, index) => {
            const startUnit = index * 30 + 1;
            return (
              <Button
                key={index}
                size="small"
                variant="outlined"
                onClick={() => {
                  const unitElement = document.querySelector(
                    `[data-testid="unit-button-${units[index * 30].id}"]`
                  );
                  if (unitElement) {
                    unitElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                      inline: 'nearest'
                    });
                  }
                }}
                sx={{ 
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  fontSize: 'var(--font-size-body)'
                }}
              >
                {startUnit-1}...
              </Button>
            );
          })}
        </Box>
        </Box>
      )}

      <List sx={{ 
        flex: 1, 
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        height: '100%',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}>
        {units.map((unit) => {
          const lessons = unitLessons[unit.id] || [];

          return (
            <Box key={unit.id}>
              <StyledUnitListItem 
                onClick={() => toggleUnit(unit.id)}
                selected={unit.id === selectedUnitId}
                data-testid={`unit-button-${unit.id}`}
              >
                <ListItemText
                  primary={convertChinese(unit.name, language)}
                  sx={{ m: 0 }}
                />
                {expandedUnits[unit.id] ? <ExpandLess /> : <ExpandMore />}
              </StyledUnitListItem>
              <Collapse in={expandedUnits[unit.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {loading[unit.id] ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} data-testid={`unit-loading-${unit.id}`} />
                    </Box>
                  ) : (
                    lessons.map((lesson, index) => {
                      const isAccessible = isLessonAccessible(index + 1, lessons);
                      const isCompleted = progress[lesson.id]?.completed;

                      return (
                        <StyledListItem
                          key={lesson.id}
                          sx={{ pl: 4 }}
                          onClick={() => isAccessible && handleLessonSelect(unit.id, lesson.id)}
                          selected={selectedLessonId === lesson.id}
                          disabled={!isAccessible}
                          data-testid={`lesson-item-${lesson.id}`}
                        >
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                            <Typography sx={{ 
                              flex: 1,
                              fontSize: 'var(--font-size-body)',
                            }}>
                              {convertChinese(lesson.name, language)}
                            </Typography>
                            {!isAccessible ? (
                              <LockIcon color="disabled" fontSize="small" data-testid={`lesson-lock-${lesson.id}`} />
                            ) : isCompleted ? (
                              <CheckCircleIcon color="success" fontSize="small" data-testid={`lesson-complete-${lesson.id}`} />
                            ) : (
                              <LockOpenIcon color="primary" fontSize="small" data-testid={`lesson-unlocked-${lesson.id}`} />
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
      data-testid="nav-drawer"
      sx={{
        width: { sm: isOpen ? DRAWER_WIDTH : 0 },
        flexShrink: { sm: 0 },
      }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
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
            mt: `${TOOLBAR_HEIGHT_MOBILE}px`,
            height: `calc(100% - ${TOOLBAR_HEIGHT_MOBILE}px)`,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={isOpen}
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: DRAWER_WIDTH,
            borderRight: 1,
            borderColor: 'divider',
            mt: `${TOOLBAR_HEIGHT}px`,
            height: `calc(100vh - ${TOOLBAR_HEIGHT}px)`,
            position: 'fixed',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            transition: theme => theme.transitions.create(['transform'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            transform: isOpen ? 'none' : `translateX(-${DRAWER_WIDTH}px)`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}