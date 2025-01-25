import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnitEditor } from '../components/admin/UnitEditor';
import { getUnit, updateUnit, createLesson } from '../services/dataService';
import type { Unit } from '../types';

// Mock services
vi.mock('../services/dataService', () => ({
  getUnit: vi.fn(),
  updateUnit: vi.fn(),
  createLesson: vi.fn()
}));

// Mock LessonEditor
vi.mock('../components/admin/LessonEditor', () => ({
  LessonEditor: ({ lessonId, onClose, onSave }: { lessonId: string; onClose: () => void; onSave: () => void }) => (
    <div data-testid="lesson-editor">
      Editing lesson {lessonId}
      <button onClick={onClose}>Close Lesson</button>
      <button onClick={onSave}>Save Lesson</button>
    </div>
  )
}));

const mockUnit: Unit = {
  id: 'unit_1',
  courseId: 'course_1',
  name: 'Test Unit',
  description: 'Test Description',
  lessons: [
    { id: 'lesson_1', name: 'Lesson 1' },
    { id: 'lesson_2', name: 'Lesson 2' }
  ]
};

describe('UnitEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUnit).mockResolvedValue(mockUnit);
    vi.mocked(updateUnit).mockResolvedValue();
    vi.mocked(createLesson).mockResolvedValue();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('loads and displays unit data on mount', async () => {
    render(
      <UnitEditor
        courseId="course_1"
        unitId="unit_1"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(getUnit).toHaveBeenCalledWith('unit_1');
    await waitFor(() => {
      expect(screen.getByText('Edit Unit: Test Unit')).toBeInTheDocument();
      expect(screen.getByText('Lesson 1')).toBeInTheDocument();
      expect(screen.getByText('Lesson 2')).toBeInTheDocument();
    });
  });

  describe('Unit Name Editing', () => {
    it('updates unit name', async () => {
      const user = userEvent.setup();
      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for unit to load
      await waitFor(() => {
        expect(screen.getByLabelText('Unit Name')).toBeInTheDocument();
      });

      // Update name and trigger blur
      const nameInput = screen.getByLabelText('Unit Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Unit Name');
      fireEvent.blur(nameInput);

      // Wait for and check if updateUnit was called
      await waitFor(() => {
        expect(updateUnit).toHaveBeenCalledWith('unit_1', {
          name: 'Updated Unit Name'
        });
      });
      expect(updateUnit).toHaveBeenCalledWith('unit_1', {
        name: 'Updated Unit Name'
      });
    });
  });

  describe('Lesson Management', () => {
    it('opens add lesson dialog', async () => {
      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const addButton = await screen.findByText('Add Lesson');
      fireEvent.click(addButton);

      expect(screen.getByText('Add New Lesson')).toBeInTheDocument();
      expect(screen.getByLabelText('Lesson Name')).toBeInTheDocument();
    });

    it('adds a new lesson', async () => {
      const user = userEvent.setup();
      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Open dialog
      const addButton = await screen.findByText('Add Lesson');
      await user.click(addButton);

      // Fill form
      const nameInput = screen.getByLabelText('Lesson Name');
      await user.type(nameInput, 'New Lesson');

      // Submit
      const submitButton = screen.getByText('Add');
      await user.click(submitButton);

      // Verify createLesson was called first
      expect(createLesson).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: 'New Lesson',
          content: '',
          unitId: 'unit_1',
          quizId: null
        })
      );

      // Then verify updateUnit was called
      expect(updateUnit).toHaveBeenCalledWith('unit_1', {
        lessons: [
          ...mockUnit.lessons,
          expect.objectContaining({
            name: 'New Lesson'
          })
        ]
      });
    });

    it('validates lesson name', async () => {
      const user = userEvent.setup();
      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Open dialog and submit without name
      const addButton = await screen.findByText('Add Lesson');
      await user.click(addButton);
      const submitButton = screen.getByText('Add');
      await user.click(submitButton);

      expect(createLesson).not.toHaveBeenCalled();
      expect(updateUnit).not.toHaveBeenCalled();
    });

    it('deletes a lesson with confirmation', async () => {
      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for lessons to load
      await waitFor(() => {
        expect(screen.getByText('Lesson 1')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(updateUnit).toHaveBeenCalledWith('unit_1', {
        lessons: [mockUnit.lessons[1]]
      });
    });

    it('opens lesson editor', async () => {
      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Wait for lessons to load
      await waitFor(() => {
        expect(screen.getByText('Lesson 1')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);

      expect(screen.getByTestId('lesson-editor')).toBeInTheDocument();
      expect(screen.getByText('Editing lesson lesson_1')).toBeInTheDocument();
    });

    it('closes lesson editor', async () => {
      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Open editor
      await waitFor(() => {
        expect(screen.getByText('Lesson 1')).toBeInTheDocument();
      });
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);

      // Close editor
      const closeButton = screen.getByText('Close Lesson');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('lesson-editor')).not.toBeInTheDocument();
    });

    it('reloads unit after lesson save', async () => {
      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Open editor
      await waitFor(() => {
        expect(screen.getByText('Lesson 1')).toBeInTheDocument();
      });
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);

      // Clear previous calls
      vi.mocked(getUnit).mockClear();

      // Save lesson
      const saveButton = screen.getByText('Save Lesson');
      fireEvent.click(saveButton);

      expect(getUnit).toHaveBeenCalledWith('unit_1');
    });
  });

  describe('Error Handling', () => {
    it('handles unit loading error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getUnit).mockRejectedValue(new Error('Failed to load unit'));

      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Lesson 1')).not.toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('handles lesson addition error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(createLesson).mockRejectedValue(new Error('Failed to add lesson'));

      const user = userEvent.setup();
      render(
        <UnitEditor
          courseId="course_1"
          unitId="unit_1"
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Add lesson
      const addButton = await screen.findByText('Add Lesson');
      await user.click(addButton);
      await user.type(screen.getByLabelText('Lesson Name'), 'New Lesson');
      await user.click(screen.getByText('Add'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
