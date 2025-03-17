import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Lesson } from '../../types';
import { firestoreService } from '../../services/firestoreService';
import RichTextEditor from '../RichTextEditor';
import QuizEditor from './QuizEditor';

interface LessonEditorProps {
  unitId: string;
  lessonId?: string;
  isNewLesson?: boolean;
  onClose: () => void;
  onSave: () => void;
  onAddLesson?: (unitId: string, name: string, lessonData?: Partial<Lesson>) => Promise<boolean>;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  unitId,
  lessonId,
  isNewLesson = false,
  onClose,
  onSave,
  onAddLesson
}) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);

  useEffect(() => {
    if (isNewLesson) {
      // Initialize with default values for a new lesson
      setLesson({
        id: `lesson_${Date.now()}`, // Temporary ID, will be replaced when saved
        name: 'New Lesson',
        content: '',
        unitId,
        quizId: null
      });
    } else if (lessonId) {
      // Load existing lesson
      loadLesson(lessonId);
    }
  }, [lessonId, isNewLesson, unitId]);

  const loadLesson = async (id: string) => {
    try {
      const loadedLesson = await firestoreService.getLessonById(id);
      if (loadedLesson) {
        // Ensure unitId is set from props
        setLesson({ ...loadedLesson, unitId });
      } else {
        setLesson(null);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
      setLesson(null);
    }
  };

  const handleSave = async () => {
    if (!lesson) return;

    try {
      // Start with required fields
      const { name, content, quizId, unitId } = lesson;
      const lessonData: Partial<Lesson> = { name, content, quizId, unitId };

      // Only include video fields if they exist and are non-empty strings
      if (typeof lesson['video-title'] === 'string' && lesson['video-title'].length > 0) {
        lessonData['video-title'] = lesson['video-title'];
      }
      if (typeof lesson['video-url'] === 'string' && lesson['video-url'].length > 0) {
        lessonData['video-url'] = lesson['video-url'];
      }

      // Include disableNote field
      lessonData.disableNote = lesson.disableNote || false;

      // Get the unit to update its lessons array
      const unit = await firestoreService.getUnitById(unitId);
      if (!unit) {
        throw new Error('Unit not found');
      }

      if (isNewLesson) {
        if (onAddLesson) {
          // Use the provided addLesson function which handles updating the lesson count
          const success = await onAddLesson(unitId, name, lessonData);
          if (!success) {
            throw new Error('Failed to add lesson');
          }
        } else {
          // Fallback to direct creation if onAddLesson is not provided
          const newLessonId = `lesson_${Date.now()}`; // Generate a new ID
          
          // Create the lesson in Firestore with all required fields
          await firestoreService.createLesson(newLessonId, {
            id: newLessonId,
            unitId, // This is guaranteed to be a string from props
            name: name || 'New Lesson',
            content: content || '',
            quizId: quizId || null,
            ...(lessonData.disableNote !== undefined ? { disableNote: lessonData.disableNote } : {}),
            ...(lessonData['video-title'] ? { 'video-title': lessonData['video-title'] } : {}),
            ...(lessonData['video-url'] ? { 'video-url': lessonData['video-url'] } : {})
          });
          
          // Add the new lesson to the unit's lessons array
          const newLesson = {
            id: newLessonId,
            name: name,
            hasQuiz: !!quizId
          };
          
          const updatedLessons = [...unit.lessons, newLesson];
          
          // Update the unit with the new lesson
          await firestoreService.updateUnit(unitId, { lessons: updatedLessons });
          
          console.warn('LessonEditor: onAddLesson prop not provided, lesson count may not be updated correctly');
        }
      } else if (lessonId) {
        // Update existing lesson
        await firestoreService.updateLesson(lessonId, lessonData);
        
        // Update the lesson name in the parent unit's lessons array
        const updatedLessons = unit.lessons.map(lessonItem => 
          lessonItem.id === lessonId 
            ? { ...lessonItem, name: name, hasQuiz: !!quizId } 
            : lessonItem
        );
        
        // Update the unit with the modified lessons array
        await firestoreService.updateUnit(unitId, { lessons: updatedLessons });
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
    }
  };

  const handleVideoFieldChange = (field: 'video-title' | 'video-url', value: string) => {
    setLesson(prev => {
      if (!prev) return null;

      // Create a new lesson object without the video fields
      const { ['video-title']: _, ['video-url']: __, ...baseLesson } = prev;

      // Only add back non-empty video fields
      const updates: Partial<Lesson> = {};
      
      // Handle video title changes
      if (field === 'video-title') {
        // Add new video title if it has a value
        if (value.length > 0) {
          updates['video-title'] = value;
        }
        // Preserve existing video URL if it exists
        const existingUrl = prev['video-url'];
        if (existingUrl && existingUrl.length > 0) {
          updates['video-url'] = existingUrl;
        }
      }
      
      // Handle video URL changes
      if (field === 'video-url') {
        // Add new video URL if it has a value
        if (value.length > 0) {
          updates['video-url'] = value;
        }
        // Preserve existing video title if it exists
        const existingTitle = prev['video-title'];
        if (existingTitle && existingTitle.length > 0) {
          updates['video-title'] = existingTitle;
        }
      }

      return {
        ...baseLesson,
        ...updates
      } as Lesson;
    });
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {isNewLesson ? 'Add New Lesson' : `Edit Lesson: ${lesson?.name}`}
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} my={2}>
          <TextField
            label="Lesson Name"
            fullWidth
            value={lesson?.name ?? ''}
            onChange={(e) => setLesson(prev => prev ? { ...prev, name: e.target.value } : null)}
            autoFocus={isNewLesson} // Auto focus on name field for new lessons
          />
          
          <TextField
            label="Video Title"
            fullWidth
            value={lesson?.['video-title'] ?? ''}
            onChange={(e) => handleVideoFieldChange('video-title', e.target.value)}
          />

          <TextField
            label="Video URL"
            fullWidth
            value={lesson?.['video-url'] ?? ''}
            onChange={(e) => handleVideoFieldChange('video-url', e.target.value)}
          />

          <FormControlLabel
            control={
              <Switch
                checked={lesson?.disableNote || false}
                onChange={(e) => setLesson(prev => prev ? { ...prev, disableNote: e.target.checked } : null)}
              />
            }
            label="Disable Notes"
          />

          <Box>
            <RichTextEditor
              value={lesson?.content ?? ''}
              onChange={(content) => setLesson(prev => prev ? { ...prev, content } : null)}
            />
          </Box>

          {/* Only show quiz section for existing lessons */}
          {!isNewLesson && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  startIcon={<EditIcon />}
                  variant="outlined"
                  onClick={() => setIsQuizEditorOpen(true)}
                >
                  {lesson?.quizId ? 'Edit Quiz' : 'Add Quiz'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {isNewLesson ? 'Add' : 'Save'}
        </Button>
      </DialogActions>

      {isQuizEditorOpen && (
        <QuizEditor
          quizId={lesson?.quizId}
          onSave={async (quizId: string) => {
            setLesson(prev => prev ? { ...prev, quizId } : null);
            setIsQuizEditorOpen(false);
          }}
        />
      )}
    </Dialog>
  );
};
