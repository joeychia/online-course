import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonEditor } from '../components/admin/LessonEditor';
import { firestoreService } from '../services/firestoreService';
import type { Lesson } from '../types';

const TEST_DATA = {
  LESSON_NAME: 'Test Lesson',
  VIDEO_TITLE: 'Test Video',
  VIDEO_URL: 'https://example.com/video',
  CONTENT: 'Test content',
  UPDATED_SUFFIX: ' Updated',
  UPDATED_LESSON: 'Updated Lesson',
  UPDATED_VIDEO: 'Updated Video'
} as const;

// Mock services
vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    getLessonById: vi.fn(),
    updateLesson: vi.fn()
  }
}));

// Get the mocked firestoreService
const mockedFirestoreService = firestoreService as any;

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(() => ({}))
}));

// Mock RichTextEditor
vi.mock('../components/RichTextEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}));

// Mock lesson with video fields
const mockLessonWithVideo: Lesson = {
  id: 'lesson1',
  unitId: 'unit1',
  name: TEST_DATA.LESSON_NAME,
  content: TEST_DATA.CONTENT,
  'video-title': TEST_DATA.VIDEO_TITLE,
  'video-url': TEST_DATA.VIDEO_URL,
  quizId: null
};

describe('LessonEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFirestoreService.getLessonById.mockResolvedValue(mockLessonWithVideo);
    mockedFirestoreService.updateLesson.mockResolvedValue();
  });

  it('loads and displays lesson data on mount', async () => {
    render(
      <LessonEditor
        unitId="unit_1"
        lessonId="lesson_1"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(mockedFirestoreService.getLessonById).toHaveBeenCalledWith('lesson_1');
    await waitFor(() => {
      expect(screen.getByText(`Edit Lesson: ${TEST_DATA.LESSON_NAME}`)).toBeInTheDocument();
      expect(screen.getByLabelText('Lesson Name')).toHaveValue(TEST_DATA.LESSON_NAME);
      expect(screen.getByLabelText('Video Title')).toHaveValue(TEST_DATA.VIDEO_TITLE);
      expect(screen.getByLabelText('Video URL')).toHaveValue(TEST_DATA.VIDEO_URL);
      expect(screen.getByTestId('rich-text-editor')).toHaveValue(TEST_DATA.CONTENT);
    });
  });

  describe('Form Updates', () => {
    it('updates lesson name', async () => {
      const user = userEvent.setup();
      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Lesson Name')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText('Lesson Name');
      await user.clear(nameInput);
      await user.type(nameInput, TEST_DATA.UPDATED_LESSON);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockedFirestoreService.updateLesson).toHaveBeenCalledWith('lesson_1', expect.objectContaining({
        name: TEST_DATA.UPDATED_LESSON
      }));
    });

    it('updates video title', async () => {
      const user = userEvent.setup();
      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Video Title')).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText('Video Title');
      await user.clear(titleInput);
      await user.type(titleInput, TEST_DATA.UPDATED_VIDEO);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockedFirestoreService.updateLesson).toHaveBeenCalledWith('lesson_1', expect.objectContaining({
        'video-title': TEST_DATA.UPDATED_VIDEO
      }));
    });

    it('updates video URL', async () => {
      const user = userEvent.setup();
      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Video URL')).toBeInTheDocument();
      });

      const urlInput = screen.getByLabelText('Video URL');
      await user.clear(urlInput);
      await user.type(urlInput, TEST_DATA.VIDEO_URL + '/updated');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockedFirestoreService.updateLesson).toHaveBeenCalledWith('lesson_1', expect.objectContaining({
        'video-url': TEST_DATA.VIDEO_URL + '/updated'
      }));
    });

    it('updates lesson content', async () => {
      const user = userEvent.setup();
      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
      });

      const contentInput = screen.getByTestId('rich-text-editor');
      await user.clear(contentInput);
      await user.type(contentInput, TEST_DATA.CONTENT + TEST_DATA.UPDATED_SUFFIX);

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(mockedFirestoreService.updateLesson).toHaveBeenCalledWith('lesson_1', expect.objectContaining({
        content: TEST_DATA.CONTENT + TEST_DATA.UPDATED_SUFFIX
      }));
    });
  });

  describe('Save and Close', () => {
    it('saves all changes and closes', async () => {
      const user = userEvent.setup();
      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText('Lesson Name')).toBeInTheDocument();
      });

      // Update all fields
      await user.type(screen.getByLabelText('Lesson Name'), ' Updated');
      await user.type(screen.getByLabelText('Video Title'), ' Updated');
      await user.type(screen.getByLabelText('Video URL'), '/updated');
      await user.type(screen.getByTestId('rich-text-editor'), ' Updated');

      // Save changes
      await user.click(screen.getByText('Save'));

      expect(mockedFirestoreService.updateLesson).toHaveBeenCalledWith('lesson_1', {
        name: TEST_DATA.LESSON_NAME + TEST_DATA.UPDATED_SUFFIX,
        'video-title': TEST_DATA.VIDEO_TITLE + TEST_DATA.UPDATED_SUFFIX,
        'video-url': TEST_DATA.VIDEO_URL + '/updated',
        content: TEST_DATA.CONTENT + TEST_DATA.UPDATED_SUFFIX,
        quizId: null,
        unitId: 'unit_1'
      });
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('closes without saving when clicking Cancel', async () => {
      const user = userEvent.setup();
      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      expect(mockedFirestoreService.updateLesson).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Video Fields Handling', () => {
    it('should save successfully when video fields are empty', async () => {
      const user = userEvent.setup();
      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText('Video Title')).toBeInTheDocument();
        expect(screen.getByLabelText('Video URL')).toBeInTheDocument();
      });

      // Clear video fields
      const titleInput = screen.getByLabelText('Video Title');
      const urlInput = screen.getByLabelText('Video URL');
      await user.clear(titleInput);
      await user.clear(urlInput);

      // Try to save
      await user.click(screen.getByText('Save'));

      // Verify save was successful
      expect(mockedFirestoreService.updateLesson).toHaveBeenCalledWith('lesson_1', {
        name: TEST_DATA.LESSON_NAME,
        content: TEST_DATA.CONTENT,
        quizId: null,
        unitId: 'unit_1'
      });
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles lesson loading error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockedFirestoreService.getLessonById.mockRejectedValue(new Error('Failed to load lesson'));

      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(TEST_DATA.LESSON_NAME)).not.toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('handles save error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockedFirestoreService.updateLesson.mockRejectedValue(new Error('Failed to save lesson'));

      const user = userEvent.setup();
      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for form and save
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });
});
