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
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AddIcon from '@mui/icons-material/Add';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { LessonItem } from './LessonItem';

interface UnitItemProps {
  id: string;
  name: string;
  index: number;
  lessons: Array<{ id: string; name: string; order: number }>;
  lessonCount: number;
  isExpanded: boolean;
  isLoading: boolean;
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
  onViewQuizResults: (lessonId: string) => void;
}

export const UnitItem: React.FC<UnitItemProps> = ({
  id,
  name,
  index,
  lessons,
  lessonCount,
  isExpanded,
  isLoading,
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
            disabled={isLoading}
          >
            <AccordionSummary
              sx={{
                minHeight: 0,
                padding: 1,
                '& .MuiAccordionSummary-content': {
                  margin: 0
                }
              }}
            >
              <Box 
                {...draggableProvided.dragHandleProps}
                sx={{ 
                  display: 'flex',
                  alignItems: 'stretch',
                  mr: 1,
                  alignSelf: 'stretch',
                  color: 'text.secondary'
                }}
              >
                <DragIndicatorIcon sx={{ mt: 0.75, mb: 'auto' }} />
              </Box>
              <Box sx={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: {xs: 'column', sm: 'row'}, 
                gap: {xs: 1, sm: 2},
                alignItems: {xs: 'flex-start', sm: 'center'},
                pt: 0
              }}>
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
                  <Box sx={{ 
                    width: '100%',
                    display: 'flex',
                    flexDirection: {xs: 'column', sm: 'row'},
                    gap: 1
                  }}>
                    <Typography sx={{ flexGrow: 1, pt: 0.75 }}>{name}</Typography>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: {xs: '100%', sm: 'auto'}
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        color: 'text.secondary'
                      }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            cursor: 'pointer',
                            '& .expand-icon': {
                              transition: 'transform 0.2s',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onExpand(!isExpanded);
                          }}
                        >
                          <MenuBookIcon fontSize="small" />
                          <Typography variant="body2" sx={{ mx: 0.5 }}>
                            {lessonCount}
                          </Typography>
                          <ExpandMoreIcon className="expand-icon" fontSize="small" />
                        </Box>
                      </Box>
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
                          data-testid="delete-unit-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                          }}
                        >
                          <DeleteIcon data-testid="delete-unit-icon" />
                        </IconButton>
                        <Tooltip title="View Quiz Results">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Pass the last lesson's ID for quiz results
                            const lastLesson = lessons[lessons.length - 1];
                            if (lastLesson) {
                              onViewQuizResults(lastLesson.id);
                            }
                            }}
                          >
                            <AssessmentIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {isLoading ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">Loading lessons...</Typography>
                </Box>
              ) : (
                <>
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
                </>
              )}
            </AccordionDetails>
          </Accordion>
        </div>
      )}
    </Draggable>
  );
};
