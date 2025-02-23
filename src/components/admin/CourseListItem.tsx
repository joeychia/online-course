import React, { useState, useRef, useEffect } from 'react';
import MarkdownViewer from '../MarkdownViewer';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Paper,
  CardActionArea,
  Button
} from '@mui/material';
import { Course } from '../../types';

interface CourseListItemProps {
  course: Course;
  onSelect: () => void;
}

export const CourseListItem: React.FC<CourseListItemProps> = ({
  course,
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
    <Card component={Paper} elevation={2}>
      <CardActionArea onClick={onSelect} sx={{ height: '100%' }}>
      <CardContent>
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
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider'
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
                background: (theme) => `linear-gradient(180deg, ${theme.palette.background.paper}00 0%, ${theme.palette.background.paper} 100%)`,
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
      </CardActionArea>
    </Card>
  );
};
