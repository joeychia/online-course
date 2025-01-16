import { Box, Typography, Paper, Link } from '@mui/material';
import { UserProgress } from '../types';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router-dom';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import ReactTooltip from 'react-tooltip';
import './CourseProgress.css';

interface CourseProgressProps {
  progress: Record<string, UserProgress>;
  courseId: string;
}

interface CalendarValue {
  date: string;
  count: number;
  lessonId: string;
  lessonName: string;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Recently';
  }
}

export default function CourseProgress({ progress, courseId }: CourseProgressProps) {
  const navigate = useNavigate();

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

  const handleLessonClick = (value: CalendarValue | null) => {
    if (value) {
      navigate(`/${courseId}/${value.lessonId}`);
    }
  };

  if (!latestLesson) {
    return (
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Course Progress
        </Typography>
        <Typography color="text.secondary">
          No lessons completed yet. Start your learning journey!
        </Typography>
      </Paper>
    );
  }

  const [lessonId, lessonData] = latestLesson;
  const formattedDate = formatDate(lessonData.completedAt);

  const handleLatestLessonClick = () => {
    navigate(`/${courseId}/${lessonId}`);
  };

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h6">
          Course Progress
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Object.values(progress).filter(data => data.completed).length} lessons completed
        </Typography>
      </Box>
      
      {/* Calendar Section */}
      <Box sx={{ mt: 3, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Completion Calendar
        </Typography>
        <CalendarHeatmap
          startDate={startDate}
          endDate={new Date()}
          values={calendarValues}
          showWeekdayLabels={true}
          classForValue={(value) => {
            if (!value) {
              return 'color-empty';
            }
            return `color-filled color-scale-${Math.min(value.count, 4)}`;
          }}
          tooltipDataAttrs={(value: any) => {
            if (!value || !value.date) {
              return { 'data-tip': 'No lessons completed' };
            }
            const lessons = value.lessons.map((l: { name: string }) => l.name).join('\n');
            return {
              'data-tip': `${new Date(value.date).toLocaleDateString()}\n${lessons}`,
              'data-multiline': true
            };
          }}
          onClick={handleLessonClick}
        />
        <ReactTooltip multiline={true} />
      </Box>

      {/* Latest Lesson Section */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Latest Completed Lesson
        </Typography>
        <Link
          component="button"
          variant="body1"
          onClick={handleLatestLessonClick}
          sx={{ 
            color: 'primary.main',
            textAlign: 'left',
            display: 'block',
            mb: 1,
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          {lessonData.lessonName}
        </Link>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
          <AccessTimeIcon fontSize="small" />
          <Typography variant="body2">
            Completed {formattedDate}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
} 