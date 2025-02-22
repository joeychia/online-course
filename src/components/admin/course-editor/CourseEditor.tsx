import React, { useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { DropResult } from 'react-beautiful-dnd';
import { StudentsQuizResults } from '../StudentsQuizResults';
import { LessonEditor } from '../LessonEditor';
import { CourseHeader } from './components/CourseHeader';
import { UnitList } from './components/UnitList';
import { AddUnitDialog } from './dialogs/AddUnitDialog';
import { AddLessonDialog } from './dialogs/AddLessonDialog';
import { DeleteUnitDialog } from '../dialogs/DeleteUnitDialog';
import { useCourseData } from './hooks/useCourseData';
import { useUnitOperations } from './hooks/useUnitOperations';
import { useLessonOperations } from './hooks/useLessonOperations';
import { useCourseOperations } from './hooks/useCourseOperations';

interface CourseEditorProps {
  courseId: string;
}

export const CourseEditor: React.FC<CourseEditorProps> = ({ courseId }) => {
  // Course data and operations
  const { course, isLoading, error: courseError, reloadCourse } = useCourseData(courseId);
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
  const [selectedQuizUnit, setSelectedQuizUnit] = useState<{ unitId: string; lessonId: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Compute error message from all possible sources
  const error = courseError || unitError || lessonError || settingsError;

  // Header handlers
  const handleToggleExpandAll = () => {
    if (!course) return;
    if (expandedUnits.length === course.units.length) {
      setExpandedUnits([]);
    } else {
      setExpandedUnits(course.units.map(u => u.id));
    }
  };

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
    if (success) setShowSuccess(true);
    return success;
  };

  const handleDeleteLesson = async (unitId: string, lessonId: string) => {
    const success = await deleteLesson(unitId, lessonId);
    if (success) setShowSuccess(true);
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
    }

    if (success) setShowSuccess(true);
  };

  return (
    <Box>
      <CourseHeader
        course={course}
        isLoading={isLoading}
        onAddUnit={() => setIsUnitDialogOpen(true)}
        onToggleExpandAll={handleToggleExpandAll}
        isSaving={isUnitSaving || isLessonSaving || isSettingsSaving}
        isAllExpanded={course ? expandedUnits.length === course.units.length : false}
        hasUnits={Boolean(course?.units?.length)}
        onUpdateSettings={updateCourseSettings}
      />

      {course && (
        <UnitList
          course={course}
          expandedUnits={expandedUnits}
          editingUnitId={editingUnitId}
          editingUnitName={editingUnitName}
          isSaving={isUnitSaving || isLessonSaving}
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
              setSelectedUnitForLesson(unitId);
              setSelectedUnitName(unit.name);
              setIsLessonDialogOpen(true);
            }
          }}
          onEditLesson={(unitId, lessonId) => {
            setSelectedLesson(lessonId);
            setSelectedUnitForLesson(unitId);
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

      {selectedQuizUnit && (
        <StudentsQuizResults
          courseId={courseId}
          lessonId={selectedQuizUnit.lessonId}
          onClose={() => setSelectedQuizUnit(null)}
        />
      )}

      {selectedLesson && (
        <LessonEditor
          unitId={selectedUnitForLesson || ''}
          lessonId={selectedLesson}
          onClose={() => {
            setSelectedLesson(null);
            setSelectedUnitForLesson(null);
          }}
          onSave={reloadCourse}
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
