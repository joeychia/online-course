import { Box, Typography, Paper, Link, useTheme } from '@mui/material';
import { formatOpenDate, isFutureDate } from '../utils/dateUtils';
import { CourseUnit, UserProgress } from '../types';
import { useNavigate } from 'react-router-dom';
import ReactCalendarHeatmap, { ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import ReactTooltip from 'react-tooltip';
import './CourseProgress.css';
import { formatDate } from '../utils/dateUtils';
import { useTranslation } from '../hooks/useTranslation';
import { convertChinese } from '../utils/chineseConverter';
import { TooltipDataAttrs } from 'react-calendar-heatmap';
import { useFontSize } from '../contexts/FontSizeContext';
import { getLesson, getLessonsIdNameForUnit } from '../services/dataService';
import { useEffect, useState } from 'react';

interface CourseProgressProps {
  progress: Record<string, UserProgress>;
  courseId: string;
  units: Array<CourseUnit>;
  unitLessons: { [key: string]: Array<{ id: string; name: string }> };
}

interface CalendarValue extends ReactCalendarHeatmapValue<string> {
  date: string;
  count: number;
  lessons: { name: string; id: string }[];
  lessonId: string;
}

export default function CourseProgress({ progress, courseId, units }: CourseProgressProps) {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const theme = useTheme();
  const { fontSize } = useFontSize();
  const [nextLesson, setNextLesson] = useState<{ id: string; name: string; unitName: String; unitId: string; openDate?: string } | null>(null);
  const [latestLessonData, setLatestLessonData] = useState<{ id: string; name: string; unitName: String; unitId: string } | null>(null);

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

  // Load latest lesson data when latestLesson changes
  useEffect(() => {
    async function loadLatestLessonData() {
      if (!latestLesson) {
        setLatestLessonData(null);
        return;
      }

      const [completedLessonId] = latestLesson;
      
      try {
        const completedLesson = await getLesson(completedLessonId);
        if (!completedLesson) {
          setLatestLessonData(null);
          return;
        }

        const currentUnitIndex = units.findIndex(u => u.id === completedLesson.unitId);
        if (currentUnitIndex === -1) {
          setLatestLessonData(null);
          return;
        }

        setLatestLessonData({
          id: completedLessonId,
          name: completedLesson.name,
          unitName: units[currentUnitIndex].name,
          unitId: completedLesson.unitId
        });
      } catch (error) {
        console.error('Error loading latest lesson data:', error);
        setLatestLessonData(null);
      }
    }

    void loadLatestLessonData();
  }, []);

  // Load next lesson data when latestLesson changes
  useEffect(() => {
    async function loadNextLesson() {
      if (!latestLesson || !latestLessonData) {
        setNextLesson(null);
        return;
      }

      try {
        // Get all lessons in the current unit
        const currentUnitLessons = await getLessonsIdNameForUnit(latestLessonData.unitId);
        const lessonIndex = currentUnitLessons.findIndex(lesson => lesson.id === latestLessonData.id);
        const currentUnitIndex = units.findIndex(u => u.id === latestLessonData.unitId);

        if (lessonIndex !== -1 && lessonIndex < currentUnitLessons.length - 1 && currentUnitIndex !== -1 && currentUnitIndex < units.length - 1) {
          // If there's a next lesson in the same unit
          setNextLesson({
            id: currentUnitLessons[lessonIndex + 1].id,
            name: currentUnitLessons[lessonIndex + 1].name,
            unitName: units[currentUnitIndex].name,
            unitId: latestLessonData.unitId,
            openDate: units[currentUnitIndex].openDate
          });
          return;
        }

        // If we're at the end of this unit, look for the first lesson of the next unit
        if (currentUnitIndex !== -1 && currentUnitIndex < units.length - 1) {
          const nextUnit = units[currentUnitIndex + 1];
          const nextUnitLessons = await getLessonsIdNameForUnit(nextUnit.id);
          if (nextUnitLessons.length > 0) {
            setNextLesson({
              id: nextUnitLessons[0].id,
              name: nextUnitLessons[0].name,
              unitName: units[currentUnitIndex + 1].name,
              unitId: nextUnit.id,
              openDate: units[currentUnitIndex + 1].openDate
            });
            return;
          }
        }
        
        setNextLesson(null);
      } catch (error) {
        console.error('Error loading next lesson:', error);
        setNextLesson(null);
      }
    }

    void loadNextLesson();
  }, [latestLessonData]);

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

  if (!latestLesson) {
    return (
      <Paper sx={{
        p: 3,
        mb: 3,
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
        color: theme.palette.text.primary
      }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: `calc(${fontSize}px * 1.25)` }}>
          {t('courseProgress')}
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize }}>
          {t('noLessonsCompleted')}
        </Typography>
      </Paper>
    );
  }

  const [lessonId, lessonData] = latestLesson;
  const formattedDate = convertChinese(formatDate(lessonData.completedAt), language);

  const handleLatestLessonClick = () => {
    navigate(`/${courseId}/${lessonId}`);
  };

  return (
    <Paper sx={{
      p: 3,
      mb: 3,
      bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
      color: theme.palette.text.primary
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h6" sx={{ fontSize: `calc(${fontSize}px * 1.25)` }}>
          {t('courseProgress')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize }}>
          {t('lessonsCompleted', { count: Object.values(progress).filter(data => data.completed).length })}
        </Typography>
      </Box>
      
      {/* Calendar Section */}
      <Box sx={{ mt: 3, mb: 4, maxWidth: '800px' }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: `calc(${fontSize}px * 1.1)` }}>
          {t('completionCalendar')}
        </Typography>
        <Box>
          <ReactCalendarHeatmap
            startDate={startDate}
            endDate={new Date()}
            values={calendarValues}
            showWeekdayLabels={true}
            weekdayLabels={['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(day => convertChinese(day, language)) as [string, string, string, string, string, string, string]}
            monthLabels={['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'].map(month => convertChinese(month, language)) as [string, string, string, string, string, string, string, string, string, string, string, string]}
            classForValue={(value) => {
              if (!value) {
                return theme.palette.mode === 'dark' ? 'color-empty-dark' : 'color-empty';
              }
              return `color-filled color-scale-${Math.min(value.count, 4)}${theme.palette.mode === 'dark' ? '-dark' : ''}`;
            }}
            tooltipDataAttrs={(value) => {
              if (!value || !value.date) {
                return {
                  'data-tip': String(t('noLessonsCompletedTooltip')),
                  'style': { fontSize }
                } as TooltipDataAttrs;
              }
              const calendarValue = value as CalendarValue;
              const lessons = calendarValue.lessons.map(l => convertChinese(l.name, language)).join('\n');
              return {
                'data-tip': `${new Date(calendarValue.date).toLocaleDateString(language === 'zh-TW' ? 'zh-TW' : 'zh-CN')}\n${lessons}`,
                'data-multiline': true,
                'style': { fontSize }
              } as TooltipDataAttrs;
            }}
          />
          <ReactTooltip multiline={true} />
        </Box>
      </Box>

      {/* Latest Lesson Section */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontSize: `calc(${fontSize}px * 1.1)` }}>
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
                    fontSize,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {convertChinese(latestLessonData?.unitName+" / "+latestLessonData?.name, language)}
                </Link>
                <Typography 
                  component="div" 
                  color="text.secondary"
                  sx={{ 
                    fontSize,
                    display: 'block',
                    mt: 1
                  }}
                >
                  {formattedDate}
                </Typography>
              </Box>
            </Box>
          </Box>

          {nextLesson && (
            <Box sx={{ 
              mt: 2,
              p: 2, 
              bgcolor: theme.palette.mode === 'dark' ? 'primary.900' : 'primary.50', 
              borderRadius: 1,
              border: 1,
              borderColor: theme.palette.mode === 'dark' ? 'primary.800' : 'primary.100',
              boxShadow: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              opacity: nextLesson.openDate && isFutureDate(nextLesson.openDate) ? 0.7 : 1,
              cursor: nextLesson.openDate && isFutureDate(nextLesson.openDate) ? 'not-allowed' : 'pointer',
              '&:hover': nextLesson.openDate && isFutureDate(nextLesson.openDate) ? {} : {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              }
            }}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ fontSize: `calc(${fontSize}px * 1.25)` }}>
                {t('nextUp')}
                {nextLesson.openDate && new Date(nextLesson.openDate) > new Date() && (
                  <Typography variant="caption" component="span" color="text.secondary" sx={{ ml: 1 }}>
                    {t('opensAt', { date: formatOpenDate(nextLesson.openDate, language) })}
                  </Typography>
                )}
              </Typography>
              <Box>
                <Link
                  component="button"
                  variant="h6"
                  onClick={() => {
                    if (!nextLesson.openDate || !isFutureDate(nextLesson.openDate)) {
                      navigate(`/${courseId}/${nextLesson.unitId}/${nextLesson.id}`);
                    }
                  }}
                  sx={{ 
                    color: 'primary.main',
                    textAlign: 'left',
                    display: 'block',
                    fontWeight: 'medium',
                    mb: 0.5,
                    fontSize: `calc(${fontSize}px * 1.25)`,
                    '&:hover': {
                      textDecoration: nextLesson.openDate && isFutureDate(nextLesson.openDate) ? 'none' : 'underline'
                    },
                    cursor: nextLesson.openDate && isFutureDate(nextLesson.openDate) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {convertChinese(`${nextLesson.unitName+" / "+nextLesson.name}`, language)}
                </Link>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}