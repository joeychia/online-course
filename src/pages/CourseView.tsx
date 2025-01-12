import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Viewer } from '@toast-ui/react-editor';
import { mockCourses } from '../mockData';
import { Course, Unit, Lesson } from '../types';
import RichTextEditor from '../components/RichTextEditor';

interface LessonListProps {
  unit: Unit;
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonId?: string;
}

const LessonList = ({ unit, onSelectLesson, selectedLessonId }: LessonListProps) => {
  return (
    <div className="lesson-list h-full">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">{unit.name}</h2>
        <div className="mt-2">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: '60%' }} />
          </div>
          <p className="text-sm text-gray-600 mt-2">60% Complete</p>
        </div>
      </div>
      <div className="divide-y">
        {Object.values(unit.lessons).map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => onSelectLesson(lesson)}
            className={`lesson-item w-full text-left ${
              selectedLessonId === lesson.id ? 'active' : ''
            }`}
          >
            {lesson.name}
          </button>
        ))}
      </div>
    </div>
  );
};

interface LessonContentProps {
  lesson: Lesson | null;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const LessonContent = ({ lesson, onNext, onPrevious, hasNext, hasPrevious }: LessonContentProps) => {
  const [note, setNote] = useState<string>(
    lesson?.notes?.content || "### My Notes\n\nAdd your notes here..."
  );

  const handleSaveNote = () => {
    if (lesson && note) {
      // Here you would typically save the note to your backend
      console.log('Saving note:', note);
    }
  };

  if (!lesson) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Select a lesson to view its content</p>
      </div>
    );
  }

  return (
    <div className="lesson-content h-full">
      <div className="course-header">
        <h1>{lesson.name}</h1>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">Estimated time: 30 mins</p>
          <div className="flex gap-4">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="nav-button"
            >
              ← Previous
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="nav-button"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
      <div className="prose max-w-none mb-8">
        <Viewer initialValue={lesson.content} />
      </div>
      
      {/* Notes Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Personal Notes</h2>
          <button
            onClick={handleSaveNote}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Notes
          </button>
        </div>
        <RichTextEditor
          value={note}
          onChange={setNote}
          placeholder="Write your notes here..."
        />
      </div>
    </div>
  );
};

export default function CourseView() {
  const { courseId, unitId } = useParams<{ courseId: string; unitId: string }>();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const course = mockCourses.find((c) => c.id === courseId);
  const unit = course?.units[unitId || ''];

  if (!course || !unit) {
    return <div>Course or unit not found</div>;
  }

  const lessons = Object.values(unit.lessons);
  const currentIndex = selectedLesson ? lessons.findIndex(l => l.id === selectedLesson.id) : -1;
  const hasNext = currentIndex < lessons.length - 1;
  const hasPrevious = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setSelectedLesson(lessons[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setSelectedLesson(lessons[currentIndex - 1]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Left Panel - Lesson List */}
      <div className="w-80 border-r">
        <LessonList
          unit={unit}
          onSelectLesson={setSelectedLesson}
          selectedLessonId={selectedLesson?.id}
        />
      </div>

      {/* Right Panel - Lesson Content */}
      <div className="flex-1 overflow-y-auto">
        <LessonContent 
          lesson={selectedLesson}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
        />
      </div>
    </div>
  );
} 