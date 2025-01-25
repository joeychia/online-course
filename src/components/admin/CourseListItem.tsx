import React from 'react';
import {
  ListItem,
  Box,
  Typography,
  Button
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
  return (
    <ListItem divider>
      <Box width="100%">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="h2">{course.name}</Typography>
          <Box display="flex" gap={1} alignItems="center">
            <Button
              startIcon={<VisibilityIcon />}
              onClick={onSelect}
              variant="outlined"
              size="small"
            >
              View Details
            </Button>
            <Button
              startIcon={<EditIcon />}
              onClick={() => onEdit(course)}
              variant="outlined"
              size="small"
            >
              Edit
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(course.id)}
              variant="outlined"
              size="small"
            >
              Delete
            </Button>
          </Box>
        </Box>
        <Typography color="textSecondary">{course.description}</Typography>
      </Box>
    </ListItem>
  );
};
