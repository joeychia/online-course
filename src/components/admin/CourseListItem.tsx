import React from 'react';
import {
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Course } from '../../types';
import MarkdownViewer from '../MarkdownViewer';

interface CourseListItemProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
}

export const CourseListItem: React.FC<CourseListItemProps> = ({
  course,
  onEdit,
  onDelete
}) => {
  return (
    <ListItem divider>
      <ListItemText
        primary={<Typography variant="h6" component="h2">{course.name}</Typography>}
        secondary={<MarkdownViewer content={course.description} />}
      />
      <ListItemSecondaryAction>
        <IconButton edge="end" onClick={() => onEdit(course)}>
          <EditIcon />
        </IconButton>
        <IconButton edge="end" onClick={() => onDelete(course.id)}>
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}; 