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
      
      // Create the unit document in Firestore
      await createUnit(newUnitId, {
        id: newUnitId,
        name: newUnitName,
        description: '',
        lessons: [],
        courseId
      });

      // Update the course's units array
      const newUnit = {
        id: newUnitId,
        name: newUnitName,
        lessons: []
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
      
      await createLesson(newLessonId, {
        id: newLessonId,
        name: newLessonName,
        content: '',
        unitId: selectedUnitForLesson,
        quizId: null
      });

      const unit = course.units.find(u => u.id === selectedUnitForLesson);
      if (unit) {
        const newLesson = {
          id: newLessonId,
          name: newLessonName
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
        const updatedLessons = unit.lessons.filter(lesson => lesson.id !== lessonId);
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

      {course?.units?.map((unit) => (
        <Accordion 
          key={unit.id} 
          sx={{ mb: 1 }}
          expanded={expandedUnits.includes(unit.id)}
          onChange={(_, isExpanded) => {
            setExpandedUnits(prev => 
              isExpanded 
                ? [...prev, unit.id]
                : prev.filter(id => id !== unit.id)
            );
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
            <List>
              {unit.lessons?.map((lesson) => (
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
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

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
