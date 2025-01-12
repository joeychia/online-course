import { useParams } from 'react-router-dom';
import { 
  Typography, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import ImageIcon from '@mui/icons-material/Image';
import QuizIcon from '@mui/icons-material/Quiz';
import { Course, Lesson } from '../types';
import Layout from '../components/Layout';
import PreviewBanner from '../components/PreviewBanner';
import { mockCourses } from '../mockData';

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = mockCourses.find(c => c.id === courseId);

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircleOutlineIcon />;
      case 'text':
        return <TextSnippetIcon />;
      case 'image':
        return <ImageIcon />;
      case 'quiz':
        return <QuizIcon />;
      default:
        return <TextSnippetIcon />;
    }
  };

  if (!course) {
    return (
      <Layout>
        <Typography>Course not found</Typography>
      </Layout>
    );
  }

  return (
    <Layout>
      <PreviewBanner />
      
      <Typography variant="h4" gutterBottom>
        {course.name}
      </Typography>
      <Typography paragraph>
        {course.description}
      </Typography>

      {Object.entries(course.units).map(([unitId, unit]) => (
        <Accordion key={unitId}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{unit.name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {Object.entries(unit.lessons).map(([lessonId, lesson], index) => (
                <ListItem key={lessonId}>
                  <ListItemIcon>
                    {getLessonIcon(lesson.type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={lesson.name}
                    secondary={`Type: ${lesson.type}`}
                  />
                  {index > 0 && (
                    <Tooltip title="Sign up to access this lesson">
                      <LockIcon color="action" />
                    </Tooltip>
                  )}
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Layout>
  );
} 