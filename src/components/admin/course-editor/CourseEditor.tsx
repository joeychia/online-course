import React, { useState } from 'react';
import { Box, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { DropResult } from 'react-beautiful-dnd';
import { StudentsQuizResults } from '../StudentsQuizResults';
import { LessonEditor } from '../LessonEditor';
import { CourseHeader } from './components/CourseHeader';
import { UnitList } from './components/UnitList';
import { AddUnitDialog } from './dialogs/AddUnitDialog';
import { AddLessonDialog } from './dialogs/AddLessonDialog';
import { DeleteUnitDialog } from '../dialogs/DeleteUnitDialog';
import { DeleteLessonDialog } from '../dialogs/DeleteLessonDialog';
import { useCourseData } from './hooks/useCourseData';
import { useUnitOperations } from './hooks/useUnitOperations';
import { useLessonOperations } from './hooks/useLessonOperations';
import { useCourseOperations } from './hooks/useCourseOperations';
import { firestoreService } from '../../../services/firestoreService';
import RichTextEditor from '../../RichTextEditor';
import { Course } from '../../../types';

interface CourseEditorProps {
  courseId: string;
}

export const CourseEditor: React.FC<CourseEditorProps> = ({ courseId }) => {
  // Course data and operations
  const { 
    course, 
    loadedUnits,
    isLoading, 
    error: courseError, 
    reloadCourse,
    loadUnitDetails,
    updateUnitLessons
  } = useCourseData(courseId);
  const { 
    addUnit, 
    updateUnitName, 
    deleteUnit, 
    reorderUnits,
    isSaving: isUnitSaving,
    error: unitError 
  } = useUnitOperations({ courseId, course, reloadCourse });
  const {
    updateCourseSettings,
    isSaving: isSettingsSaving,
    error: settingsError
  } = useCourseOperations({ courseId, reloadCourse });
  const {
    addLesson,
    deleteLesson,
    reorderLessons,
    isSaving: isLessonSaving,
    error: lessonError
  } = useLessonOperations({ courseId, course, reloadCourse });

  // UI State
  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedUnitForLesson, setSelectedUnitForLesson] = useState<string | null>(null);
  const [selectedUnitName, setSelectedUnitName] = useState('');
  const [deleteUnitDialogOpen, setDeleteUnitDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitName, setEditingUnitName] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [isNewLesson, setIsNewLesson] = useState(false);
  const [selectedQuizUnit, setSelectedQuizUnit] = useState<{ unitId: string; lessonId: string } | null>(null);
  const [deleteLessonDialogOpen, setDeleteLessonDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<{ unitId: string; lessonId: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCourseName, setEditingCourseName] = useState('');
  const [editingCourseDescription, setEditingCourseDescription] = useState('');

  // Course edit handlers
  const handleEditCourse = (course: Course) => {
    setEditingCourseName(course.name);
    setEditingCourseDescription(course.description);
    setEditDialogOpen(true);
  };

  const handleUpdateCourse = async () => {
    if (!course || !editingCourseName.trim()) return;
    
    try {
      await firestoreService.updateCourse(course.id, {
        name: editingCourseName,
        description: editingCourseDescription,
      });
      setEditDialogOpen(false);
      reloadCourse();
      setShowSuccess(true);
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await firestoreService.deleteCourse(courseId);
        window.location.href = '/admin'; // Redirect to admin dashboard after deletion
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  // Compute error message from all possible sources
  const error = courseError || unitError || lessonError || settingsError;

  // Unit handlers
  const handleAddUnit = async (name: string) => {
    const success = await addUnit(name);
    if (success) setShowSuccess(true);
    return success;
  };

  const handleUnitEditStart = (unitId: string, name: string) => {
    setEditingUnitId(unitId);
    setEditingUnitName(name);
  };

  const handleUnitEditSave = async (unitId: string) => {
    const success = await updateUnitName(unitId, editingUnitName);
    if (success) {
      setEditingUnitId(null);
      setShowSuccess(true);
    }
  };

  const handleDeleteUnit = (unitId: string) => {
    setUnitToDelete(unitId);
    setDeleteUnitDialogOpen(true);
  };

  const handleConfirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    const success = await deleteUnit(unitToDelete);
    if (success) {
      setDeleteUnitDialogOpen(false);
      setUnitToDelete(null);
      setShowSuccess(true);
    }
  };

  // Lesson handlers
  const handleAddLesson = async (name: string) => {
    if (!selectedUnitForLesson) return false;
    const success = await addLesson(selectedUnitForLesson, name);
    if (success) {
      // Get the current unit
      const unit = loadedUnits[selectedUnitForLesson];
      if (unit) {
        // Add the new lesson to the UI immediately
        updateUnitLessons(selectedUnitForLesson, unit => ({
          ...unit,
          lessons: [
            ...unit.lessons,
            {
              id: `lesson_${Date.now()}`, // Same ID generation as in useLessonOperations
              name: name.trim(),
              hasQuiz: false
            }
          ]
        }));
      }
      setShowSuccess(true);
    }
    return success;
  };

  const handleDeleteLesson = (unitId: string, lessonId: string) => {
    setLessonToDelete({ unitId, lessonId });
    setDeleteLessonDialogOpen(true);
  };

  const handleConfirmDeleteLesson = async () => {
    if (!lessonToDelete) return;
    const success = await deleteLesson(lessonToDelete.unitId, lessonToDelete.lessonId);
    if (success) {
      // Immediately update UI by removing the deleted lesson
      updateUnitLessons(lessonToDelete.unitId, unit => ({
        ...unit,
        lessons: unit.lessons.filter(lesson => lesson.id !== lessonToDelete.lessonId)
      }));
      
      // Update backend state
      await reloadCourse();
      
      setDeleteLessonDialogOpen(false);
      setLessonToDelete(null);
      setShowSuccess(true);
    }
  };

  // Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;
    if (source.index === destination.index && source.droppableId === destination.droppableId) return;

    let success = false;
    if (type === 'unit') {
      success = await reorderUnits(source.index, destination.index);
    } else if (type === 'lesson') {
      success = await reorderLessons(source.droppableId, source.index, destination.index);
      if (success) {
        // Force reload the unit details to update the lessons list in UI
        await loadUnitDetails(source.droppableId, true);
      }
    }

    if (success) {
      setShowSuccess(true);
    }
  };

  return (
    <Box>
      <CourseHeader
        course={course}
        isLoading={isLoading}
        onAddUnit={() => setIsUnitDialogOpen(true)}
        isSaving={isUnitSaving || isLessonSaving || isSettingsSaving}
        onUpdateSettings={updateCourseSettings}
        onEditCourse={handleEditCourse}
        onDeleteCourse={handleDeleteCourse}
      />

      {course && (
        <UnitList
          course={course}
          loadedUnits={loadedUnits}
          expandedUnits={expandedUnits}
          editingUnitId={editingUnitId}
          editingUnitName={editingUnitName}
          isSaving={isUnitSaving || isLessonSaving}
          loadUnitDetails={loadUnitDetails}
          onUnitExpand={(unitId, expanded) => {
            setExpandedUnits(prev => 
              expanded 
                ? [...prev, unitId]
                : prev.filter(id => id !== unitId)
            );
          }}
          onUnitEditStart={handleUnitEditStart}
          onUnitEditSave={handleUnitEditSave}
          onUnitEditChange={setEditingUnitName}
          onUnitDelete={handleDeleteUnit}
          onAddLesson={(unitId) => {
            const unit = course.units.find(u => u.id === unitId);
            if (unit) {
              // Open LessonEditor directly in creation mode
              setSelectedUnitForLesson(unitId);
              setIsNewLesson(true);
              setSelectedLesson(null); // No lesson ID for new lesson
            }
          }}
          onEditLesson={(unitId, lessonId) => {
            setSelectedLesson(lessonId);
            setSelectedUnitForLesson(unitId);
            setIsNewLesson(false); // Ensure we're in edit mode, not creation mode
          }}
          onDeleteLesson={handleDeleteLesson}
          onViewQuizResults={(unitId, lessonId) => {
            setSelectedQuizUnit({ unitId, lessonId });
          }}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Dialogs */}
      <AddUnitDialog
        open={isUnitDialogOpen}
        onClose={() => setIsUnitDialogOpen(false)}
        onAdd={handleAddUnit}
        isSaving={isUnitSaving}
      />

      <AddLessonDialog
        open={isLessonDialogOpen}
        onClose={() => {
          setIsLessonDialogOpen(false);
          setSelectedUnitForLesson(null);
          setSelectedUnitName('');
        }}
        onAdd={handleAddLesson}
        isSaving={isLessonSaving}
        unitName={selectedUnitName}
      />

      <DeleteUnitDialog
        open={deleteUnitDialogOpen}
        onClose={() => setDeleteUnitDialogOpen(false)}
        onConfirm={handleConfirmDeleteUnit}
      />

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Course</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Course Name"
            fullWidth
            value={editingCourseName}
            onChange={(e) => setEditingCourseName(e.target.value)}
          />
          <Box mt={2}>
            <RichTextEditor
              value={editingCourseDescription}
              onChange={setEditingCourseDescription}
              placeholder="Enter course description..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateCourse} variant="contained" color="primary">
            Update
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

      {/* Show LessonEditor for both editing existing lessons and creating new ones */}
      {selectedUnitForLesson && (isNewLesson || selectedLesson) && (
        <LessonEditor
          unitId={selectedUnitForLesson}
          lessonId={selectedLesson || undefined}
          isNewLesson={isNewLesson}
          onClose={() => {
            setSelectedLesson(null);
            setSelectedUnitForLesson(null);
            setIsNewLesson(false);
          }}
          onSave={async () => {
            // Reload course data
            await reloadCourse();
            // Also reload the unit details to update the lessons list
            await loadUnitDetails(selectedUnitForLesson, true);
          }}
        />
      )}

      {/* Notifications */}
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

      <DeleteLessonDialog
        open={deleteLessonDialogOpen}
        onClose={() => setDeleteLessonDialogOpen(false)}
        onConfirm={handleConfirmDeleteLesson}
      />

      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={3000}
          onClose={() => {
            // Error state is managed by hooks
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error">
            {error.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};
