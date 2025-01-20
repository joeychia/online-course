import { Box, Typography, Paper, Link } from '@mui/material';
import { UserProgress } from '../types';
import { useNavigate } from 'react-router-dom';
import CalendarHeatmap, { ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import ReactTooltip from 'react-tooltip';
import './CourseProgress.css';
import { formatDate } from '../utils/dateUtils';
import { useTranslation } from '../hooks/useTranslation';

interface CourseProgressProps {
  progress: Record<string, UserProgress>;
  courseId: string;
  units: Array<{ id: string; name: string }>;
  unitLessons: { [key: string]: Array<{ id: string; name: string }> };
}

interface CalendarValue extends ReactCalendarHeatmapValue<string> {
  date: string;
  count: number;
  lessons: { name: string; id: string }[];
  lessonId: string;
}

interface TooltipDataAttrs {
  'data-tip': string;
  'data-multiline'?: boolean;
}

export default function CourseProgress({ progress, courseId, units, unitLessons }: CourseProgressProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  // Find the next lesson
  const findNextLesson = () => {
    if (!latestLesson) {
      return null;
    }

    const [completedLessonId] = latestLesson;
    
    // Find which unit contains the completed lesson
    for (const unit of units) {
      const lessons = unitLessons[unit.id] || [];
      const lessonIndex = lessons.findIndex(lesson => lesson.id === completedLessonId);
      
      if (lessonIndex !== -1) {
        // If there's a next lesson in the same unit
        if (lessonIndex < lessons.length - 1) {
          const nextLesson = {
            id: lessons[lessonIndex + 1].id,
            name: lessons[lessonIndex + 1].name,
            unitId: unit.id
          };
          return nextLesson;
        }
        
        // If we're at the end of this unit, look for the first lesson of the next unit
        const currentUnitIndex = units.findIndex(u => u.id === unit.id);
        if (currentUnitIndex !== -1 && currentUnitIndex < units.length - 1) {
          const nextUnit = units[currentUnitIndex + 1];
          const nextUnitLessons = unitLessons[nextUnit.id] || [];
          if (nextUnitLessons.length > 0) {
            const nextLesson = {
              id: nextUnitLessons[0].id,
              name: nextUnitLessons[0].name,
              unitId: nextUnit.id
            };
            return nextLesson;
          }
        }
        break;
      }
    }
    return null;
  };

  const nextLesson = findNextLesson();

  // Prepare calendar data
  const calendarData = Object.entries(progress)
    .filter(([_, data]) => data.completed && data.completedAt)
    .reduce<{ [key: string]: { count: number; lessons: { name: string; id: string }[] } }>((acc, [lessonId, data]) => {
      try {
        // Convert ISO string to local date
        const date = new Date(data.completedAt);
        if (!isNaN(date.getTime())) {
          // Format date to YYYY-MM-DD in local timezone
          const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
          const dateKey = localDate.toISOString().split('T')[0];
          if (!acc[dateKey]) {
            acc[dateKey] = { count: 0, lessons: [] };
          }
          acc[dateKey].count++;
          acc[dateKey].lessons.push({
            name: data.lessonName,
            id: lessonId
          });
        }
      } catch (error) {
        console.warn('Invalid date format:', data.completedAt);
      }
      return acc;
    }, {});

  // Convert to calendar heatmap format
  const calendarValues = Object.entries(calendarData).map(([date, data]) => ({
    date,
    count: data.count,
    lessons: data.lessons,
    lessonId: data.lessons[data.lessons.length - 1].id // Use the latest lesson's ID for navigation
  }));

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 5); // Show last 6 months

  const handleLessonClick = (value: CalendarValue | undefined) => {
    if (value) {
      navigate(`/${courseId}/${value.lessonId}`);
    }
  };

  if (!latestLesson) {
    return (
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          {t('courseProgress')}
        </Typography>
        <Typography color="text.secondary">
          {t('noLessonsCompleted')}
        </Typography>
      </Paper>
    );
  }

  const [lessonId, lessonData] = latestLesson;
  const formattedDate = formatDate(lessonData.completedAt);

  // Find the unit for the latest completed lesson
  const findUnitForLesson = (lessonId: string) => {
    for (const unit of units) {
      const lessons = unitLessons[unit.id] || [];
      if (lessons.some(lesson => lesson.id === lessonId)) {
        return unit;
      }
    }
    return null;
  };

  const latestLessonUnit = findUnitForLesson(lessonId);

  const handleLatestLessonClick = () => {
    navigate(`/${courseId}/${latestLessonUnit?.id || ''}/${lessonId}`);
  };

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h6">
          {t('courseProgress')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('lessonsCompleted', { count: Object.values(progress).filter(data => data.completed).length })}
        </Typography>
      </Box>
      
      {/* Calendar Section */}
      <Box sx={{ mt: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('completionCalendar')}
        </Typography>
        <CalendarHeatmap
          startDate={startDate}
          endDate={new Date()}
          values={calendarValues}
          showWeekdayLabels={true}
          weekdayLabels={['日', '一', '二', '三', '四', '五', '六']}
          monthLabels={['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']}
          classForValue={(value) => {
            if (!value) {
              return 'color-empty';
            }
            return `color-filled color-scale-${Math.min(value.count, 4)}`;
          }}
          tooltipDataAttrs={(value: ReactCalendarHeatmapValue<string> | undefined): TooltipDataAttrs => {
            if (!value || !value.date) {
              return { 'data-tip': String(t('noLessonsCompletedTooltip')) };
            }
            const calendarValue = value as CalendarValue;
            const lessons = calendarValue.lessons.map(l => l.name).join('\n');
            return {
              'data-tip': `${new Date(calendarValue.date).toLocaleDateString('zh-TW')}\n${lessons}`,
              'data-multiline': true
            };
          }}
          onClick={(value: ReactCalendarHeatmapValue<string> | undefined) => {
            if (value) {
              handleLessonClick(value as CalendarValue);
            }
          }}
        />
        <ReactTooltip multiline={true} />
      </Box>

      {/* Latest Lesson Section */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('latestCompletedLesson')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 1
            }}>
              <Box sx={{ flex: 1 }}>
                <Link
                  component="button"
                  variant="body1"
                  onClick={handleLatestLessonClick}
                  sx={{ 
                    color: 'primary.main',
                    textAlign: 'left',
                    mr: 2,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {latestLessonUnit?.name} / {lessonData.lessonName}
                </Link>
                {formattedDate}
              </Box>
            </Box>
          </Box>

          {nextLesson && (
            <Box sx={{ 
              mt: 2,
              p: 2, 
              bgcolor: 'primary.50', 
              borderRadius: 1,
              border: 1,
              borderColor: 'primary.100'
            }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {t('nextUp')}
              </Typography>
              <Box>
                <Link
                  component="button"
                  variant="h6"
                  onClick={() => navigate(`/${courseId}/${nextLesson.unitId}/${nextLesson.id}`)}
                  sx={{ 
                    color: 'primary.main',
                    textAlign: 'left',
                    display: 'block',
                    fontWeight: 'medium',
                    mb: 0.5,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {units.find(u => u.id === nextLesson.unitId)?.name} / {nextLesson.name}
                </Link>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
} 