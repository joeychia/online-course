import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Unit } from '../../types';
import { getUnit, updateUnit, createLesson } from '../../services/dataService';
import { LessonEditor } from './LessonEditor';

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
      // Create a new lesson ID
      const newLessonId = `lesson_${Date.now()}`;
      
      // Create the lesson document in Firestore
      await createLesson(newLessonId, {
        id: newLessonId,
        name: newLessonName,
        content: '',
        unitId: unitId,
        quizId: null
      });

      // Update the unit's lessons array
      const newLesson = {
        id: newLessonId,
        name: newLessonName
      };
      const updatedLessons = [...unit.lessons, newLesson];
      await updateUnit(unitId, { lessons: updatedLessons });
      
      await loadUnit();
      setIsLessonDialogOpen(false);
      setNewLessonName('');
      onSave(); // Call onSave to update parent component
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
      onSave(); // Call onSave to update parent component
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

        <List>
          {unit?.lessons.map((lesson) => (
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
                <IconButton onClick={() => setSelectedLesson(lesson.id)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteLesson(lesson.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

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
          <Button onClick={handleAddLesson} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Lesson</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this lesson?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lesson Editor Dialog */}
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
