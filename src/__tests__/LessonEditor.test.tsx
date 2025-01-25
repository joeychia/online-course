import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonEditor } from '../components/admin/LessonEditor';
import { getLesson, updateLesson } from '../services/dataService';
import type { Lesson } from '../types';

// Mock services
vi.mock('../services/dataService', () => ({
  getLesson: vi.fn(),
  updateLesson: vi.fn()
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

const mockLesson: Lesson = {
  id: 'lesson_1',
  unitId: 'unit_1',
  name: 'Test Lesson',
  content: 'Test Content',
  'video-title': 'Test Video',
  'video-url': 'https://example.com/video',
  quizId: null
};

describe('LessonEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getLesson).mockResolvedValue(mockLesson);
    vi.mocked(updateLesson).mockResolvedValue();
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

    expect(getLesson).toHaveBeenCalledWith('lesson_1');
    await waitFor(() => {
      expect(screen.getByText('Edit Lesson: Test Lesson')).toBeInTheDocument();
      expect(screen.getByLabelText('Lesson Name')).toHaveValue('Test Lesson');
      expect(screen.getByLabelText('Video Title')).toHaveValue('Test Video');
      expect(screen.getByLabelText('Video URL')).toHaveValue('https://example.com/video');
      expect(screen.getByTestId('rich-text-editor')).toHaveValue('Test Content');
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
      await user.type(nameInput, 'Updated Lesson');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(updateLesson).toHaveBeenCalledWith('lesson_1', expect.objectContaining({
        name: 'Updated Lesson'
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
      await user.type(titleInput, 'Updated Video');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(updateLesson).toHaveBeenCalledWith('lesson_1', expect.objectContaining({
        'video-title': 'Updated Video'
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
      await user.type(urlInput, 'https://example.com/updated');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(updateLesson).toHaveBeenCalledWith('lesson_1', expect.objectContaining({
        'video-url': 'https://example.com/updated'
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
      await user.type(contentInput, 'Updated Content');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      expect(updateLesson).toHaveBeenCalledWith('lesson_1', expect.objectContaining({
        content: 'Updated Content'
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

      expect(updateLesson).toHaveBeenCalledWith('lesson_1', {
        name: 'Test Lesson Updated',
        'video-title': 'Test Video Updated',
        'video-url': 'https://example.com/video/updated',
        content: 'Test Content Updated'
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

      expect(updateLesson).not.toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles lesson loading error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getLesson).mockRejectedValue(new Error('Failed to load lesson'));

      render(
        <LessonEditor
          unitId="unit_1"
          lessonId="lesson_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Test Lesson')).not.toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('handles save error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(updateLesson).mockRejectedValue(new Error('Failed to save lesson'));

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
