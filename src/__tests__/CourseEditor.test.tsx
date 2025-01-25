import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseEditor } from '../components/admin/CourseEditor';
import { getCourse, updateCourse } from '../services/dataService';
import type { Course } from '../types';

// Mock services
vi.mock('../services/dataService', () => ({
  getCourse: vi.fn(),
  updateCourse: vi.fn()
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
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.mocked(getCourse).mockResolvedValue(mockCourse);
    vi.mocked(updateCourse).mockResolvedValue();
  });

  it('loads and displays course data on mount', async () => {
    render(<CourseEditor courseId="course_1" />);

    expect(getCourse).toHaveBeenCalledWith('course_1');
    await waitFor(() => {
      expect(screen.getByText('Unit 1')).toBeInTheDocument();
    });
  });

  it('displays loading state before course data arrives', () => {
    vi.mocked(getCourse).mockImplementation(() => new Promise(() => {}));
    render(<CourseEditor courseId="course_1" />);

    expect(screen.queryByText('Unit 1')).not.toBeInTheDocument();
  });

  it('handles error when loading course fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Failed to load course');
    vi.mocked(getCourse).mockRejectedValue(error);
    
    render(<CourseEditor courseId="course_1" />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Error loading course:', error);
    });

    expect(screen.queryByText('Unit 1')).not.toBeInTheDocument();
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

      const deleteButton = await screen.findByTestId('DeleteIcon');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
    });

    it('deletes unit when confirmed', async () => {
      render(<CourseEditor courseId="course_1" />);

      const deleteButton = await screen.findByTestId('DeleteIcon');
      fireEvent.click(deleteButton);

      expect(updateCourse).toHaveBeenCalledWith('course_1', {
        units: []
      });
    });

    it('does not delete unit when canceled', async () => {
      vi.spyOn(window, 'confirm').mockImplementation(() => false);
      render(<CourseEditor courseId="course_1" />);

      const deleteButton = await screen.findByTestId('DeleteIcon');
      fireEvent.click(deleteButton);

      expect(updateCourse).not.toHaveBeenCalled();
    });
  });

  describe('Unit editor integration', () => {
    it('opens unit editor when clicking edit button', async () => {
      render(<CourseEditor courseId="course_1" />);

      const editButton = await screen.findByTestId('EditIcon');
      fireEvent.click(editButton);

      expect(screen.getByTestId('unit-editor')).toBeInTheDocument();
    });

    it('closes unit editor', async () => {
      render(<CourseEditor courseId="course_1" />);

      // Open editor
      const editButton = await screen.findByTestId('EditIcon');
      fireEvent.click(editButton);

      // Close editor
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('unit-editor')).not.toBeInTheDocument();
    });

    it('reloads course after unit editor saves', async () => {
      render(<CourseEditor courseId="course_1" />);

      // Open editor
      const editButton = await screen.findByTestId('EditIcon');
      fireEvent.click(editButton);

      // Clear previous calls to getCourse (from initial load)
      vi.mocked(getCourse).mockClear();

      // Save changes
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(getCourse).toHaveBeenCalledWith('course_1');
    });
  });
});
