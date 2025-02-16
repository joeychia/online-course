import React from 'react';
import {
  ListItem,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Draggable } from 'react-beautiful-dnd';

interface LessonItemProps {
  id: string;
  name: string;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

export const LessonItem: React.FC<LessonItemProps> = ({
  id,
  name,
  index,
  onEdit,
  onDelete
}) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <ListItem
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            borderBottom: '1px solid #eee',
            bgcolor: snapshot.isDragging ? 'action.hover' : 'transparent',
            '& .dragHandle': {
              visibility: 'hidden'
            },
            '&:hover .dragHandle': {
              visibility: 'visible'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              {...provided.dragHandleProps}
              className="dragHandle"
            >
              <DragIndicatorIcon sx={{ color: 'text.secondary' }} />
            </Box>
            <Typography>{name}</Typography>
          </Box>
          <Box>
            <IconButton 
              size="small"
              onClick={onEdit}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              size="small"
              onClick={onDelete}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </ListItem>
      )}
    </Draggable>
  );
};
