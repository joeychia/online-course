import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseEditor } from '../components/admin/CourseEditor';
import { getCourse, updateCourse, createUnit, getUnit } from '../services/dataService';
import type { Course } from '../types';

// Mock services
vi.mock('../services/dataService', () => ({
  getCourse: vi.fn(),
  updateCourse: vi.fn(),
  createUnit: vi.fn(),
  getUnit: vi.fn()
}));

// Mock UnitEditor component
vi.mock('../components/admin/UnitEditor', () => ({
  UnitEditor: ({ onClose, onSave }: { onClose: () => void; onSave: () => void }) => (
    <div data-testid="unit-editor">
      <button onClick={onClose}>Close</button>
      <button onClick={onSave}>Save</button>
    </div>
  )
}));

const mockCourse: Course = {
  id: 'course_1',
  name: 'Test Course',
  description: 'Test Description',
  units: [
    {
      id: 'unit_1',
      name: 'Unit 1',
      lessons: []
    }
  ],
  settings: { unlockLessonIndex: 0 },
  groupIds: {},
  isPublic: false
};

describe('CourseEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCourse).mockResolvedValue(mockCourse);
    vi.mocked(updateCourse).mockResolvedValue();
    vi.mocked(createUnit).mockResolvedValue();
    vi.mocked(getUnit).mockResolvedValue({
      id: 'unit_1',
      name: 'Unit 1',
      courseId: 'course_1',
      description: 'Test Unit Description',
      lessons: []
    });
  });

  it('loads and displays course data on mount', async () => {
    render(<CourseEditor courseId="course_1" />);

    expect(getCourse).toHaveBeenCalledWith('course_1');
    await waitFor(() => {
      // Find the Typography element containing "Unit 1"
      const unitElement = screen.getByRole('heading', { name: 'Unit 1' });
      expect(unitElement).toBeInTheDocument();
    });
  });

  it('displays loading state before course data arrives', () => {
    vi.mocked(getCourse).mockImplementation(() => new Promise(() => {}));
    render(<CourseEditor courseId="course_1" />);

    expect(screen.queryByRole('heading', { name: 'Unit 1' })).not.toBeInTheDocument();
  });

  it('handles error when loading course fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Failed to load course');
    vi.mocked(getCourse).mockRejectedValue(error);
    
    render(<CourseEditor courseId="course_1" />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error loading course:', error);
    });

    expect(screen.queryByRole('heading', { name: 'Unit 1' })).not.toBeInTheDocument();
    consoleError.mockRestore();
  });

  describe('Adding units', () => {
    it('opens add unit dialog when clicking Add Unit button', async () => {
      render(<CourseEditor courseId="course_1" />);

      const addButton = await screen.findByText('Add Unit');
      fireEvent.click(addButton);

      expect(screen.getByText('Add New Unit')).toBeInTheDocument();
    });

    it('handles empty unit name', async () => {
      render(<CourseEditor courseId="course_1" />);

      const addButton = await screen.findByText('Add Unit');
      fireEvent.click(addButton);

      const submitButton = screen.getByText('Add');
      fireEvent.click(submitButton);

      expect(createUnit).not.toHaveBeenCalled();
      expect(updateCourse).not.toHaveBeenCalled();
    });

    it('successfully adds a new unit', async () => {
      const user = userEvent.setup();
      render(<CourseEditor courseId="course_1" />);

      // Open dialog
      const addButton = await screen.findByText('Add Unit');
      await user.click(addButton);

      // Enter unit name
      const input = screen.getByLabelText('Unit Name');
      await user.type(input, 'New Unit');

      // Submit
      const submitButton = screen.getByText('Add');
      await user.click(submitButton);

      // Verify createUnit was called first
      expect(createUnit).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: 'New Unit',
          description: '',
          lessons: [],
          courseId: 'course_1'
        })
      );

      // Then verify updateCourse was called
      expect(updateCourse).toHaveBeenCalledWith('course_1', {
        units: expect.arrayContaining([
          expect.objectContaining({
            name: 'New Unit',
            lessons: []
          })
        ])
      });
    });

    it('closes dialog and clears input after adding unit', async () => {
      const user = userEvent.setup();
      render(<CourseEditor courseId="course_1" />);

      // Open dialog and add unit
      const addButton = await screen.findByText('Add Unit');
      await user.click(addButton);
      const input = screen.getByLabelText('Unit Name');
      await user.type(input, 'New Unit');
      const submitButton = screen.getByText('Add');
      await user.click(submitButton);

      // Check dialog is closed
      await waitFor(() => {
        expect(screen.queryByText('Add New Unit')).not.toBeInTheDocument();
      });

      // Reopen dialog and check input is cleared
      await user.click(addButton);
      await waitFor(() => {
        expect(screen.getByLabelText('Unit Name')).toHaveValue('');
      });
    });
  });

  describe('Deleting units', () => {
    it('shows confirmation dialog when deleting unit', async () => {
      render(<CourseEditor courseId="course_1" />);

      // Wait for course data to load and unit to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Unit 1' })).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Delete Unit')).toBeInTheDocument();
    });

    it('deletes unit when confirmed', async () => {
      render(<CourseEditor courseId="course_1" />);

      // Wait for course data to load and unit to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Unit 1' })).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(updateCourse).toHaveBeenCalledWith('course_1', {
          units: []
        });
      });
    });

    it('does not delete unit when canceled', async () => {
      render(<CourseEditor courseId="course_1" />);

      // Wait for course data to load and unit to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Unit 1' })).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('DeleteIcon');
      fireEvent.click(deleteButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(updateCourse).not.toHaveBeenCalled();
    });
  });

  describe('Unit editor integration', () => {
    it('opens unit editor when clicking edit button', async () => {
      render(<CourseEditor courseId="course_1" />);

      // Wait for course data to load and unit to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Unit 1' })).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);

      expect(screen.getByTestId('unit-editor')).toBeInTheDocument();
    });

    it('closes unit editor', async () => {
      render(<CourseEditor courseId="course_1" />);

      // Wait for course data to load and unit to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Unit 1' })).toBeInTheDocument();
      });

      // Open editor
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);

      // Close editor
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('unit-editor')).not.toBeInTheDocument();
    });

    it('reloads course after unit editor saves', async () => {
      render(<CourseEditor courseId="course_1" />);

      // Wait for course data to load and unit to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Unit 1' })).toBeInTheDocument();
      });

      // Open editor
      const editButtons = screen.getAllByTestId('EditIcon');
      fireEvent.click(editButtons[0]);

      // Clear previous calls to getCourse (from initial load)
      vi.mocked(getCourse).mockClear();

      // Save changes
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(getCourse).toHaveBeenCalledWith('course_1');
    });
  });
});
