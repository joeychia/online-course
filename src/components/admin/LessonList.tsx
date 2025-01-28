import React from 'react';
import {
  List,
  ListItem,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface Lesson {
  id: string;
  name: string;
}

interface LessonListProps {
  lessons: Lesson[];
  onEdit: (lessonId: string) => void;
  onDelete: (lessonId: string) => void;
}

export const LessonList: React.FC<LessonListProps> = ({
  lessons,
  onEdit,
  onDelete,
}) => {
  return (
    <List>
      {lessons.map((lesson) => (
        <ListItem
          key={lesson.id}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '1px solid #eee'
          }}
        >
          <Typography>{lesson.name}</Typography>
          <Box>
            <IconButton onClick={() => onEdit(lesson.id)}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => onDelete(lesson.id)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};
