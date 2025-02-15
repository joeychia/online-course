import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { Unit } from '../../types';
import { getUnit, updateUnit, createLesson, getCourse, updateCourse } from '../../services/dataService';
import { LessonEditor } from './LessonEditor';
import { AddLessonDialog } from './dialogs/AddLessonDialog';
import { DeleteLessonDialog } from './dialogs/DeleteLessonDialog';
import { LessonList } from './LessonList';

interface UnitEditorProps {
  courseId: string;
  unitId: string;
  onClose: () => void;
  onSave: () => void;
}

export const UnitEditor: React.FC<UnitEditorProps> = ({
  unitId,
  onClose,
  onSave,
}) => {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localName, setLocalName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadUnit();
  }, [unitId]);

  const loadUnit = async () => {
    setIsLoading(true);
    try {
      const loadedUnit = await getUnit(unitId);
      if (loadedUnit) {
        setUnit(loadedUnit);
        setLocalName(loadedUnit.name);
      } else {
        console.error('Unit not found');
      }
    } catch (error) {
      console.error('Error loading unit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!unit || localName.trim() === '') return;
    
    setIsSaving(true);
    try {
      // Update unit document
      await updateUnit(unitId, { name: localName });

      // Get and update parent course
      const course = await getCourse(unit.courseId);
      if (course) {
        const updatedUnits = course.units.map((u: { id: string; name: string; lessons: Array<{ id: string; name: string }> }) => 
          u.id === unitId ? { ...u, name: localName, lessons: u.lessons } : u
        );
        await updateCourse(unit.courseId, { units: updatedUnits });
      }

      setShowSuccess(true);
      onSave(); // Call onSave to update parent
      await loadUnit(); // Refresh local state
    } catch (error) {
      console.error('Error updating unit name:', error);
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLesson = async () => {
    if (!unit || !newLessonName.trim()) return;

    try {
      const newLessonId = `lesson_${Date.now()}`;
      
      await createLesson(newLessonId, {
        id: newLessonId,
        name: newLessonName,
        content: '',
        unitId: unitId,
        quizId: null
      });

      const newLesson = {
        id: newLessonId,
        name: newLessonName
      };
      const updatedLessons = [...unit.lessons, newLesson];
      await updateUnit(unitId, { lessons: updatedLessons });
      
      await loadUnit();
      setIsLessonDialogOpen(false);
      setNewLessonName('');
      onSave();
    } catch (error) {
      console.error('Error adding lesson:', error);
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessonToDelete(lessonId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!unit || !lessonToDelete) return;

    try {
      const updatedLessons = unit.lessons.filter(lesson => lesson.id !== lessonToDelete);
      await updateUnit(unitId, { lessons: updatedLessons });
      await loadUnit();
      onSave();
    } catch (error) {
      console.error('Error deleting lesson:', error);
    } finally {
      setDeleteConfirmOpen(false);
      setLessonToDelete(null);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Unit: {isLoading ? 'Loading...' : unit?.name}</DialogTitle>
      <DialogContent>
        <Box mt={1} mb={3}>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              label="Unit Name"
              fullWidth
              size="small"
              value={localName}
              disabled={isLoading || isSaving}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={async () => {
                if (unit && localName !== unit.name) {
                  await handleSave();
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={isLoading || isSaving || !unit || localName === unit?.name}
            >
              Save
            </Button>
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Lessons</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setIsLessonDialogOpen(true)}
            disabled={isLoading}
          >
            Add Lesson
          </Button>
        </Box>

        {unit && (
          <LessonList
            lessons={unit.lessons}
            onEdit={setSelectedLesson}
            onDelete={handleDeleteLesson}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <AddLessonDialog
        open={isLessonDialogOpen}
        onClose={() => setIsLessonDialogOpen(false)}
        onAdd={handleAddLesson}
        lessonName={newLessonName}
        onLessonNameChange={setNewLessonName}
      />

      <DeleteLessonDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
      />

      {selectedLesson && (
        <LessonEditor
          unitId={unitId}
          lessonId={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onSave={loadUnit}
        />
      )}

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Unit name saved successfully
        </Alert>
      </Snackbar>

      <Snackbar
        open={showError}
        autoHideDuration={3000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setShowError(false)}>
          Error saving unit name. Please try again.
        </Alert>
      </Snackbar>
    </Dialog>
  );
};
