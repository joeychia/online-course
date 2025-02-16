import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  List,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { LessonItem } from './LessonItem';

interface UnitItemProps {
  id: string;
  name: string;
  index: number;
  lessons: Array<{ id: string; name: string; order: number }>;
  isExpanded: boolean;
  isEditing: boolean;
  editingName: string;
  isSaving: boolean;
  onExpand: (expanded: boolean) => void;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditChange: (name: string) => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onViewQuizResults: () => void;
}

export const UnitItem: React.FC<UnitItemProps> = ({
  id,
  name,
  index,
  lessons,
  isExpanded,
  isEditing,
  editingName,
  isSaving,
  onExpand,
  onEditStart,
  onEditSave,
  onEditChange,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onViewQuizResults
}) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(draggableProvided, snapshot) => (
        <div
          ref={draggableProvided.innerRef}
          {...draggableProvided.draggableProps}
        >
          <Accordion 
            sx={{ 
              mb: 1,
              transition: 'box-shadow 0.2s',
              ...(snapshot.isDragging && {
                boxShadow: '0 5px 10px rgba(0,0,0,0.2) !important'
              })
            }}
            expanded={isExpanded}
            onChange={(_, expanded) => onExpand(expanded)}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              {...draggableProvided.dragHandleProps}
              sx={{
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center'
                }
              }}
            >
              <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                {isEditing ? (
                  <TextField
                    size="small"
                    value={editingName}
                    onChange={(e) => onEditChange(e.target.value)}
                    onBlur={onEditSave}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        onEditSave();
                      }
                    }}
                    autoFocus
                    sx={{ flexGrow: 1 }}
                  />
                ) : (
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'})
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStart();
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <Tooltip title="View Quiz Results">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewQuizResults();
                      }}
                    >
                      <AssessmentIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box mb={2}>
                <Button
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                  onClick={onAddLesson}
                  disabled={isSaving}
                >
                  Add Lesson
                </Button>
              </Box>
              <Droppable droppableId={id} type="lesson">
                {(droppableProvided) => (
                  <List
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                  >
                    {lessons
                      .sort((a, b) => a.order - b.order)
                      .map((lesson, lessonIndex) => (
                        <LessonItem
                          key={lesson.id}
                          id={lesson.id}
                          name={lesson.name}
                          index={lessonIndex}
                          onEdit={() => onEditLesson(lesson.id)}
                          onDelete={() => onDeleteLesson(lesson.id)}
                        />
                      ))}
                    {droppableProvided.placeholder}
                  </List>
                )}
              </Droppable>
            </AccordionDetails>
          </Accordion>
        </div>
      )}
    </Draggable>
  );
};
