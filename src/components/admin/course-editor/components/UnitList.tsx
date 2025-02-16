import React from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { UnitItem } from './UnitItem';
import { Course } from '../../../../types';

interface UnitListProps {
  course: Course;
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
}

export const UnitList: React.FC<UnitListProps> = ({
  course,
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
  onDragEnd
}) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="units" type="unit">
        {(droppableProvided) => (
          <div {...droppableProvided.droppableProps} ref={droppableProvided.innerRef}>
            {course.units
              .sort((a, b) => a.order - b.order)
              .map((unit, index) => (
                <UnitItem
                  key={unit.id}
                  id={unit.id}
                  name={unit.name}
                  index={index}
                  lessons={unit.lessons}
                  isExpanded={expandedUnits.includes(unit.id)}
                  isEditing={editingUnitId === unit.id}
                  editingName={editingUnitId === unit.id ? editingUnitName : unit.name}
                  isSaving={isSaving}
                  onExpand={(expanded) => onUnitExpand(unit.id, expanded)}
                  onEditStart={() => onUnitEditStart(unit.id, unit.name)}
                  onEditSave={() => onUnitEditSave(unit.id)}
                  onEditChange={onUnitEditChange}
                  onDelete={() => onUnitDelete(unit.id)}
                  onAddLesson={() => onAddLesson(unit.id)}
                  onEditLesson={(lessonId) => onEditLesson(unit.id, lessonId)}
                  onDeleteLesson={(lessonId) => onDeleteLesson(unit.id, lessonId)}
                  onViewQuizResults={() => {
                    const lastLesson = unit.lessons[unit.lessons.length - 1];
                    if (lastLesson) {
                      onViewQuizResults(unit.id, lastLesson.id);
                    }
                  }}
                />
              ))}
            {droppableProvided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
