import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Dialog,
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Course } from '../../types';
import { 
  getCourse, 
  updateCourse, 
  createUnit, 
  getLessonsIdNameForUnit, 
  getUnit,
  updateUnit,
  createLesson
} from '../../services/dataService';
import { StudentsQuizResults } from './StudentsQuizResults';
import { LessonEditor } from './LessonEditor';
import { DeleteUnitDialog } from './dialogs/DeleteUnitDialog';

export const CourseEditor: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [selectedQuizUnit, setSelectedQuizUnit] = useState<{ unitId: string; lessonId: string } | null>(null);
  const [deleteUnitDialogOpen, setDeleteUnitDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitName, setEditingUnitName] = useState('');
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [selectedUnitForLesson, setSelectedUnitForLesson] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const loadedCourse = await getCourse(courseId);
      if (loadedCourse) {
        // Fetch lesson counts for each unit
        const unitsWithLessonCounts = await Promise.all(
          loadedCourse.units.map(async (unit) => {
            const unitDetails = await getUnit(unit.id);
            return {
              ...unit,
              lessons: unitDetails?.lessons || []
            };
          })
        );
        setCourse({
          ...loadedCourse,
          units: unitsWithLessonCounts
        });
      } else {
        setCourse(null);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      setCourse(null);
    }
  };

  const handleAddUnit = async () => {
    if (!course || !newUnitName.trim()) return;
    setIsSaving(true);
    try {
      const newUnitId = `unit_${Date.now()}`;
      const newOrder = course.units.length;
      
      // Create the unit document in Firestore
      await createUnit(newUnitId, {
        id: newUnitId,
        name: newUnitName,
        description: '',
        lessons: [],
        courseId,
        order: newOrder
      });

      // Update the course's units array
      const newUnit = {
        id: newUnitId,
        name: newUnitName,
        lessons: [],
        order: newOrder
      };
      const updatedUnits = [...(course.units || []), newUnit];
      await updateCourse(courseId, { units: updatedUnits });
      await loadCourse();
      setIsUnitDialogOpen(false);
      setNewUnitName('');
      setShowSuccess(true);
    } catch (error) {
      console.error('Error adding unit:', error);
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUnit = (unitId: string) => {
    setUnitToDelete(unitId);
    setDeleteUnitDialogOpen(true);
  };

  const confirmDeleteUnit = async () => {
    if (!course || !unitToDelete) return;

    try {
      const updatedUnits = course.units.filter(unit => unit.id !== unitToDelete);
      await updateCourse(courseId, { units: updatedUnits });
      await loadCourse();
    } catch (error) {
      console.error('Error deleting unit:', error);
    } finally {
      setDeleteUnitDialogOpen(false);
      setUnitToDelete(null);
    }
  };

  const handleSaveUnitName = async (unitId: string) => {
    if (!course || !editingUnitName.trim()) return;
    setIsSaving(true);
    
    try {
      // Update unit document
      await updateUnit(unitId, { name: editingUnitName });

      // Update course units array
      const updatedUnits = course.units.map(u => 
        u.id === unitId ? { ...u, name: editingUnitName } : u
      );
      await updateCourse(courseId, { units: updatedUnits });

      await loadCourse();
      setEditingUnitId(null);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating unit name:', error);
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLesson = async () => {
    if (!course || !newLessonName.trim() || !selectedUnitForLesson) return;
    setIsSaving(true);

    try {
      const newLessonId = `lesson_${Date.now()}`;
      
      const unit = course.units.find(u => u.id === selectedUnitForLesson);
      const newOrder = unit?.lessons?.length || 0;

      await createLesson(newLessonId, {
        id: newLessonId,
        name: newLessonName,
        content: '',
        unitId: selectedUnitForLesson,
        quizId: null,
        order: newOrder
      });

      if (unit) {
        const newLesson = {
          id: newLessonId,
          name: newLessonName,
          order: newOrder
        };
        const updatedLessons = [...unit.lessons, newLesson];
        await updateUnit(selectedUnitForLesson, { lessons: updatedLessons });
      }
      
      await loadCourse();
      setIsLessonDialogOpen(false);
      setNewLessonName('');
      setSelectedUnitForLesson(null);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error adding lesson:', error);
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (unitId: string, lessonId: string) => {
    if (!course) return;
    setIsSaving(true);

    try {
      const unit = course.units.find(u => u.id === unitId);
      if (unit) {
        const updatedLessons = unit.lessons.filter(lesson => lesson.id !== lessonId)
          .map((lesson, index) => ({ ...lesson, order: index }));
        await updateUnit(unitId, { lessons: updatedLessons });
        await loadCourse();
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || !course) return;

    const { source, destination, type } = result;
    if (source.index === destination.index && source.droppableId === destination.droppableId) return;

    setIsSaving(true);
    try {
      if (type === 'unit') {
        const newUnits = Array.from(course.units);
        const [removed] = newUnits.splice(source.index, 1);
        newUnits.splice(destination.index, 0, removed);

        // Update order for all affected units
        const updatedUnits = newUnits.map((unit, index) => ({
          ...unit,
          order: index
        }));

        // Update course with new unit order
        await updateCourse(courseId, { units: updatedUnits });
        
        // Update individual unit documents
        await Promise.all(
          updatedUnits.map(unit => 
            updateUnit(unit.id, { order: unit.order })
          )
        );
      } else if (type === 'lesson') {
        const unitId = source.droppableId;
        const unit = course.units.find(u => u.id === unitId);
        
        if (unit) {
          const newLessons = Array.from(unit.lessons);
          const [removed] = newLessons.splice(source.index, 1);
          newLessons.splice(destination.index, 0, removed);

          // Update order for all affected lessons
          const updatedLessons = newLessons.map((lesson, index) => ({
            ...lesson,
            order: index
          }));

          // Update unit with new lesson order
          await updateUnit(unitId, { lessons: updatedLessons });
        }
      }

      await loadCourse();
      setShowSuccess(true);
    } catch (error) {
      console.error('Error reordering:', error);
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 500, mb: 2 }}>
          {course?.name || 'Loading...'}
        </Typography>
        <Divider />
      </Box>
      
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={() => {
              if (course) {
                if (expandedUnits.length === course.units.length) {
                  setExpandedUnits([]);
                } else {
                  setExpandedUnits(course.units.map(u => u.id));
                }
              }
            }}
            disabled={!course?.units?.length}
          >
            {expandedUnits.length === (course?.units?.length || 0) ? 'Collapse All' : 'Expand All'}
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setIsUnitDialogOpen(true)}
            disabled={isSaving}
          >
            Add Unit
          </Button>
        </Box>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="units" type="unit">
          {(droppableProvided) => (
            <div {...droppableProvided.droppableProps} ref={droppableProvided.innerRef}>
              {course?.units?.sort((a, b) => a.order - b.order).map((unit, index) => (
                <Draggable key={unit.id} draggableId={unit.id} index={index}>
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
                        expanded={expandedUnits.includes(unit.id)}
                        onChange={(_, isExpanded) => {
                          setExpandedUnits(prev => 
                            isExpanded 
                              ? [...prev, unit.id]
                              : prev.filter(id => id !== unit.id)
                          );
                        }}
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
                            {editingUnitId === unit.id ? (
                              <TextField
                                size="small"
                                value={editingUnitName}
                                onChange={(e) => setEditingUnitName(e.target.value)}
                                onBlur={() => handleSaveUnitName(unit.id)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveUnitName(unit.id);
                                  }
                                }}
                                autoFocus
                                sx={{ flexGrow: 1 }}
                              />
                            ) : (
                              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography>{unit.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ({unit.lessons?.length || 0} {unit.lessons?.length === 1 ? 'lesson' : 'lessons'})
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingUnitId(unit.id);
                                  setEditingUnitName(unit.name);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteUnit(unit.id);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                              <Tooltip title="View Quiz Results">
                                <IconButton
                                  size="small"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const lessons = await getLessonsIdNameForUnit(unit.id);
                                      if (lessons && lessons.length > 0) {
                                        const lastLesson = lessons[lessons.length - 1];
                                        setSelectedQuizUnit({ unitId: unit.id, lessonId: lastLesson.id });
                                      }
                                    } catch (error) {
                                      console.error('Error loading lessons for quiz results:', error);
                                    }
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
                              onClick={() => {
                                setSelectedUnitForLesson(unit.id);
                                setIsLessonDialogOpen(true);
                              }}
                              disabled={isSaving}
                            >
                              Add Lesson
                            </Button>
                          </Box>
                          <Droppable droppableId={unit.id} type="lesson">
                            {(lessonDroppableProvided) => (
                              <List
                                ref={lessonDroppableProvided.innerRef}
                                {...lessonDroppableProvided.droppableProps}
                              >
                                {unit.lessons?.sort((a, b) => a.order - b.order).map((lesson, lessonIndex) => (
                                  <Draggable
                                    key={lesson.id}
                                    draggableId={lesson.id}
                                    index={lessonIndex}
                                  >
                                    {(lessonDraggableProvided, lessonSnapshot) => (
                                      <ListItem
                                        ref={lessonDraggableProvided.innerRef}
                                        {...lessonDraggableProvided.draggableProps}
                                        sx={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          borderBottom: '1px solid #eee',
                                          bgcolor: lessonSnapshot.isDragging ? 'action.hover' : 'transparent',
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
                                            {...lessonDraggableProvided.dragHandleProps}
                                            className="dragHandle"
                                          >
                                            <DragIndicatorIcon sx={{ color: 'text.secondary' }} />
                                          </Box>
                                          <Typography>{lesson.name}</Typography>
                                        </Box>
                                        <Box>
                                          <IconButton 
                                            size="small"
                                            onClick={() => {
                                              setSelectedLesson(lesson.id);
                                              setSelectedUnitForLesson(unit.id);
                                            }}
                                          >
                                            <EditIcon />
                                          </IconButton>
                                          <IconButton 
                                            size="small"
                                            onClick={() => handleDeleteLesson(unit.id, lesson.id)}
                                          >
                                            <DeleteIcon />
                                          </IconButton>
                                        </Box>
                                      </ListItem>
                                    )}
                                  </Draggable>
                                ))}
                                {lessonDroppableProvided.placeholder}
                              </List>
                            )}
                          </Droppable>
                        </AccordionDetails>
                      </Accordion>
                    </div>
                  )}
                </Draggable>
              ))}
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Dialogs */}
      <Dialog open={isUnitDialogOpen} onClose={() => setIsUnitDialogOpen(false)}>
        <DialogTitle>Add New Unit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Unit Name"
            fullWidth
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUnitDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddUnit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onClose={() => setIsLessonDialogOpen(false)}>
        <DialogTitle>Add New Lesson</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Lesson Name"
            fullWidth
            value={newLessonName}
            onChange={(e) => setNewLessonName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsLessonDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddLesson} 
            variant="contained"
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {selectedQuizUnit && (
        <StudentsQuizResults
          courseId={courseId}
          lessonId={selectedQuizUnit.lessonId}
          onClose={() => setSelectedQuizUnit(null)}
        />
      )}

      <DeleteUnitDialog
        open={deleteUnitDialogOpen}
        onClose={() => setDeleteUnitDialogOpen(false)}
        onConfirm={confirmDeleteUnit}
      />

      {/* Snackbars */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Operation completed successfully
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={3000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          An error occurred. Please try again.
        </Alert>
      </Snackbar>

      {/* Lesson Editor Dialog */}
      {selectedLesson && (
        <LessonEditor
          unitId={selectedUnitForLesson || ''}
          lessonId={selectedLesson}
          onClose={() => {
            setSelectedLesson(null);
            setSelectedUnitForLesson(null);
          }}
          onSave={loadCourse}
        />
      )}
    </Box>
  );
};
