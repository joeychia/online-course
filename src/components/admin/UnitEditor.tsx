import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Unit } from '../../types';
import { getUnit, updateUnit, createLesson } from '../../services/dataService';
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
  const [localName, setLocalName] = useState('');
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
        <Box mb={3}>
          <TextField
            label="Unit Name"
            fullWidth
            value={localName}
            disabled={isLoading}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={async () => {
              try {
                await updateUnit(unitId, { name: localName });
                await loadUnit();
              } catch (error) {
                console.error('Error updating unit name:', error);
              }
            }}
          />
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
    </Dialog>
  );
};
