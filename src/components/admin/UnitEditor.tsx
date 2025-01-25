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
import { getUnit, updateUnit } from '../../services/dataService';
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
}) => {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');

  useEffect(() => {
    loadUnit();
  }, [unitId]);

  const loadUnit = async () => {
    try {
      const loadedUnit = await getUnit(unitId);
      setUnit(loadedUnit);
    } catch (error) {
      console.error('Error loading unit:', error);
      setUnit(null);
    }
  };

  const handleAddLesson = async () => {
    if (!unit || !newLessonName.trim()) return;

    try {
      const newLesson = {
        id: `lesson_${Date.now()}`,
        name: newLessonName
      };

      const updatedLessons = [...unit.lessons, newLesson];
      await updateUnit(unitId, { lessons: updatedLessons });
      await loadUnit();
      setIsLessonDialogOpen(false);
      setNewLessonName('');
    } catch (error) {
      console.error('Error adding lesson:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!unit || !window.confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const updatedLessons = unit.lessons.filter(lesson => lesson.id !== lessonId);
      await updateUnit(unitId, { lessons: updatedLessons });
      await loadUnit();
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Unit: {unit?.name}</DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <TextField
            label="Unit Name"
            fullWidth
            value={unit?.name || ''}
            onChange={(e) => {
              if (unit) {
                setUnit({ ...unit, name: e.target.value });
              }
            }}
            onBlur={async () => {
              if (unit) {
                try {
                  await updateUnit(unitId, { name: unit.name });
                  await loadUnit();
                } catch (error) {
                  console.error('Error updating unit name:', error);
                }
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
