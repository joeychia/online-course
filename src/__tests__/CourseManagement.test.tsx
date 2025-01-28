import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseManagement } from '../components/admin/CourseManagement';
import { ThemeProvider } from '../contexts/ThemeContext';
import { FontSizeProvider } from '../contexts/FontSizeContext';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '../services/dataService';
import type { Course } from '../types';

// Mock services
vi.mock('../services/dataService', () => ({
  getAllCourses: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn()
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

// Mock CourseEditor
vi.mock('../components/admin/CourseEditor', () => ({
  CourseEditor: ({ courseId }: { courseId: string }) => (
    <div data-testid="course-editor">Editing course {courseId}</div>
  )
}));

const mockCourses: Course[] = [
  {
    id: 'course_1',
    name: 'Test Course 1',
    description: 'Description 1',
    units: [],
    settings: { unlockLessonIndex: 1 },
    groupIds: {},
    isPublic: false
  },
  {
    id: 'course_2',
    name: 'Test Course 2',
    description: 'Description 2',
    units: [],
    settings: { unlockLessonIndex: 1 },
    groupIds: {},
    isPublic: false
  }
];

describe('CourseManagement', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider>
        <FontSizeProvider>
          {ui}
        </FontSizeProvider>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  it('loads and displays courses on mount', async () => {
    renderWithProviders(<CourseManagement />);

    expect(getAllCourses).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      expect(screen.getByText('Test Course 2')).toBeInTheDocument();
    });
  });

  describe('Course Creation', () => {
    it('opens create course dialog', async () => {
      renderWithProviders(<CourseManagement />);

      const createButton = screen.getByText('Create New Course');
      fireEvent.click(createButton);

      expect(screen.getByRole('heading', { name: 'Create New Course' })).toBeInTheDocument();
      expect(screen.getByLabelText('Course Name')).toBeInTheDocument();
      expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    });

    it('creates a new course', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CourseManagement />);

      // Open dialog
      const createButton = screen.getByText('Create New Course');
      await user.click(createButton);

      // Fill form
      const nameInput = screen.getByLabelText('Course Name');
      const descriptionInput = screen.getByTestId('rich-text-editor');
      await user.type(nameInput, 'New Course');
      await user.type(descriptionInput, 'New Description');

      // Submit
      const submitButton = screen.getByText('Create');
      await user.click(submitButton);

      expect(createCourse).toHaveBeenCalledWith({
        name: 'New Course',
        description: 'New Description',
        settings: { unlockLessonIndex: 1 },
        units: [],
        groupIds: {},
        isPublic: false
      });

      // Should reload courses
      expect(getAllCourses).toHaveBeenCalledTimes(2);
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CourseManagement />);

      // Open dialog
      const createButton = screen.getByText('Create New Course');
      await user.click(createButton);

      // Try to submit without filling form
      const submitButton = screen.getByText('Create');
      await user.click(submitButton);

      expect(createCourse).not.toHaveBeenCalled();
    });
  });

  describe('Course Editing', () => {
    it('opens edit dialog with course data', async () => {
      renderWithProviders(<CourseManagement />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = await screen.findAllByText('Edit');
      fireEvent.click(editButtons[0]);

      // Check dialog content
      expect(screen.getByText('Edit Course')).toBeInTheDocument();
      expect(screen.getByLabelText('Course Name')).toHaveValue('Test Course 1');
      expect(screen.getByTestId('rich-text-editor')).toHaveValue('Description 1');
    });

    it('updates course data', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CourseManagement />);

      // Wait for courses and open edit dialog
      await waitFor(() => {
        expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      });
      const editButtons = await screen.findAllByText('Edit');
      await user.click(editButtons[0]);

      // Update form
      const nameInput = screen.getByLabelText('Course Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Course');

      // Submit
      const updateButton = screen.getByText('Update');
      await user.click(updateButton);

      expect(updateCourse).toHaveBeenCalledWith('course_1', {
        name: 'Updated Course',
        description: 'Description 1',
      });
    });
  });

  describe('Course Deletion', () => {
    it('confirms before deleting course', async () => {
      renderWithProviders(<CourseManagement />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = await screen.findAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(deleteCourse).toHaveBeenCalledWith('course_1');
    });

    it('does not delete when confirmation is canceled', async () => {
      vi.spyOn(window, 'confirm').mockImplementation(() => false);
      renderWithProviders(<CourseManagement />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButtons = await screen.findAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(deleteCourse).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('switches between course list and editor', async () => {
      renderWithProviders(<CourseManagement />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      });

      // Click view details
      const viewButtons = await screen.findAllByText('View Details');
      fireEvent.click(viewButtons[0]);

      // Check if editor is shown
      expect(screen.getByTestId('course-editor')).toBeInTheDocument();
      expect(screen.getByText('Editing course course_1')).toBeInTheDocument();

      // Go back to list
      const backButton = screen.getByText('Back to Course List');
      fireEvent.click(backButton);

      // Check if list is shown
      expect(screen.getByText('Course Management')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles course loading error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getAllCourses).mockRejectedValue(new Error('Failed to load courses'));

      renderWithProviders(<CourseManagement />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
