import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { Course } from '../../types';
import { getCourse, updateCourse, createUnit, getLessonsIdNameForUnit } from '../../services/dataService';
import { UnitEditor } from '../../components/admin/UnitEditor';
import { StudentsQuizResults } from './StudentsQuizResults';

export const CourseEditor: React.FC<{ courseId: string }> = ({ courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [selectedQuizUnit, setSelectedQuizUnit] = useState<{ unitId: string; lessonId: string } | null>(null);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const loadedCourse = await getCourse(courseId);
      setCourse(loadedCourse);
    } catch (error) {
      console.error('Error loading course:', error);
      setCourse(null);
    }
  };

  const handleAddUnit = async () => {
    if (!course || !newUnitName.trim()) return;
    
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
    } catch (error) {
      console.error('Error adding unit:', error);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!course || !window.confirm('Are you sure you want to delete this unit?')) return;

    try {
      const updatedUnits = course.units.filter(unit => unit.id !== unitId);
      await updateCourse(courseId, { units: updatedUnits });
      await loadCourse();
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Course Structure</Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => setIsUnitDialogOpen(true)}
        >
          Add Unit
        </Button>
      </Box>

      <List>
        {course?.units?.map((unit) => (
          <ListItem
            key={unit.id}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid #eee'
            }}
          >
            <Box flex={1}>
              <Typography variant="h6">{unit.name}</Typography>
              <Typography color="textSecondary">
                {unit.lessons?.length || 0} lessons
              </Typography>
            </Box>
            <Box>
              <IconButton onClick={() => setSelectedUnit(unit.id)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleDeleteUnit(unit.id)}>
                <DeleteIcon />
              </IconButton>
              <Tooltip title="View Quiz Results">
                <IconButton
                  onClick={async () => {
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
          </ListItem>
        ))}
      </List>

      {/* Add Unit Dialog */}
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

      {/* Unit Editor Dialog */}
      {selectedUnit && (
        <UnitEditor
          courseId={courseId}
          unitId={selectedUnit}
          onClose={() => setSelectedUnit(null)}
          onSave={loadCourse}
        />
      )}

      {selectedQuizUnit && (
        <StudentsQuizResults
          courseId={courseId}
          lessonId={selectedQuizUnit.lessonId}
          onClose={() => setSelectedQuizUnit(null)}
        />
      )}
    </Box>
  );
};
