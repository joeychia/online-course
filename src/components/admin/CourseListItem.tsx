import React, { useState, useRef, useEffect } from 'react';
import MarkdownViewer from '../MarkdownViewer';
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Button,
  Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Course } from '../../types';

interface CourseListItemProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => Promise<void>;
  onSelect: () => void;
}

export const CourseListItem: React.FC<CourseListItemProps> = ({
  course,
  onEdit,
  onDelete,
  onSelect
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setShowExpandButton(contentHeight > 200); // 200px is our max-height
    }
  }, [course.description]);

  return (
    <Card component={Paper} elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.5px',
            textShadow: '1px 1px 0px rgba(0,0,0,0.05)',
            fontFamily: '"Segoe UI", "Roboto", "Helvetica", sans-serif',
            mb: 3
          }}
        >
          {course.name}
        </Typography>
        <Box 
          ref={contentRef}
          sx={{ 
            mb: 2,
            maxHeight: expanded ? 'none' : '200px',
            overflow: 'hidden',
            position: 'relative',
            bgcolor: '#f5f5f5',
            p: 2,
            borderRadius: 1
          }}
        >
          <MarkdownViewer content={course.description} />
          {!expanded && showExpandButton && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50px',
                background: 'linear-gradient(180deg, rgba(245,245,245,0) 0%, rgba(245,245,245,1) 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setExpanded(true)}
            >
              <Typography color="primary" sx={{ mb: 1 }}>Show More</Typography>
            </Box>
          )}
        </Box>
        {expanded && showExpandButton && (
          <Button 
            onClick={() => setExpanded(false)}
            sx={{ display: 'block', margin: '0 auto', mb: 1 }}
          >
            Show Less
          </Button>
        )}
      </CardContent>
      <CardActions sx={{ 
        p: 2, 
        pt: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 1,
        '& .MuiButton-root': {
          minWidth: '32px',
          height: '32px',
          padding: '0 8px'
        }
      }}>
        <Button
          startIcon={<VisibilityIcon />}
          onClick={onSelect}
          variant="contained"
          size="small"
          color="primary"
          title="View Details"
        >
          View
        </Button>
        <Button
          startIcon={<EditIcon />}
          onClick={() => onEdit(course)}
          variant="contained"
          size="small"
          color="secondary"
          title="Edit Course"
        >
          Edit
        </Button>
        <Button
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(course.id)}
          variant="contained"
          size="small"
          color="error"
          title="Delete Course"
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );
};
