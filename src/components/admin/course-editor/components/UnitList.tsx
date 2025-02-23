import React, { useCallback } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { UnitItem } from './UnitItem';
import { Course, Unit } from '../../../../types';

interface UnitListProps {
  course: Course;
  loadedUnits: Record<string, Unit>;
  expandedUnits: string[];
  editingUnitId: string | null;
  editingUnitName: string;
  isSaving: boolean;
  onUnitExpand: (unitId: string, expanded: boolean) => void;
  onUnitEditStart: (unitId: string, name: string) => void;
  onUnitEditSave: (unitId: string) => void;
  onUnitEditChange: (name: string) => void;
  onUnitDelete: (unitId: string) => void;
  onAddLesson: (unitId: string) => void;
  onEditLesson: (unitId: string, lessonId: string) => void;
  onDeleteLesson: (unitId: string, lessonId: string) => void;
  onViewQuizResults: (unitId: string, lessonId: string) => void;
  onDragEnd: (result: DropResult) => void;
  loadUnitDetails: (unitId: string) => Promise<Unit | null>;
}

export const UnitList: React.FC<UnitListProps> = ({
  course,
  loadedUnits,
  expandedUnits,
  editingUnitId,
  editingUnitName,
  isSaving,
  onUnitExpand,
  onUnitEditStart,
  onUnitEditSave,
  onUnitEditChange,
  onUnitDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onViewQuizResults,
  onDragEnd,
  loadUnitDetails
}) => {
  // Handle unit expansion with lazy loading
  const handleUnitExpand = useCallback(async (unitId: string, expanded: boolean) => {
    if (expanded && !loadedUnits[unitId]) {
      // Load unit details when expanding
      await loadUnitDetails(unitId);
    }
    onUnitExpand(unitId, expanded);
  }, [loadedUnits, loadUnitDetails, onUnitExpand]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="units" type="unit">
        {(droppableProvided) => (
          <div {...droppableProvided.droppableProps} ref={droppableProvided.innerRef}>
            {course.units
              .sort((a, b) => a.order - b.order)
              .map((unit, index) => {
                const loadedUnit = loadedUnits[unit.id];
                const isLoading = expandedUnits.includes(unit.id) && !loadedUnit;

                return (
                  <UnitItem
                    key={unit.id}
                    id={unit.id}
                    name={unit.name}
                    index={index}
                    lessons={loadedUnit?.lessons || []}
                    lessonCount={unit.lessonCount}
                    isExpanded={expandedUnits.includes(unit.id)}
                    isLoading={isLoading}
                    isEditing={editingUnitId === unit.id}
                    editingName={editingUnitId === unit.id ? editingUnitName : unit.name}
                    isSaving={isSaving}
                    onExpand={(expanded) => handleUnitExpand(unit.id, expanded)}
                    onEditStart={() => onUnitEditStart(unit.id, unit.name)}
                    onEditSave={() => onUnitEditSave(unit.id)}
                    onEditChange={onUnitEditChange}
                    onDelete={() => onUnitDelete(unit.id)}
                    onAddLesson={() => onAddLesson(unit.id)}
                    onEditLesson={(lessonId) => onEditLesson(unit.id, lessonId)}
                    onDeleteLesson={(lessonId) => onDeleteLesson(unit.id, lessonId)}
                    onViewQuizResults={(lessonId) => onViewQuizResults(unit.id, lessonId)}
                  />
                );
              })}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
