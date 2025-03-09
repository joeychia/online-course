import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { CourseManagement } from '../components/admin/CourseManagement';
import { ThemeProvider } from '../contexts/ThemeContext';
import { FontSizeProvider } from '../contexts/FontSizeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { firestoreService } from '../services/firestoreService';
import { BrowserRouter } from 'react-router-dom';

// Mock the firestoreService
vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    getAllCourses: vi.fn(),
    createCourse: vi.fn(),
    updateCourse: vi.fn(),
    deleteCourse: vi.fn(),
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Get the mocked firestoreService
const mockedFirestoreService = firestoreService as any;

const mockCourses = [
  {
    id: 'course_1',
    name: 'Test Course 1',
    description: 'Description 1',
    units: [],
    settings: { unlockLessonIndex: 0 },
    groupIds: {},
    isPublic: false
  },
  {
    id: 'course_2',
    name: 'Test Course 2',
    description: 'Description 2',
    units: [],
    settings: { unlockLessonIndex: 0 },
    groupIds: {},
    isPublic: false
  }
];

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <FontSizeProvider>
          <LanguageProvider>
            {ui}
          </LanguageProvider>
        </FontSizeProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('CourseManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFirestoreService.getAllCourses.mockResolvedValue(mockCourses);
  });

  it('loads and displays courses on mount', async () => {
    renderWithProviders(<CourseManagement />);

    await waitFor(() => {
      expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      expect(screen.getByText('Test Course 2')).toBeInTheDocument();
    });
  });

  describe('Course Creation', () => {
    it('opens create course dialog', () => {
      renderWithProviders(<CourseManagement />);
      
      const createButton = screen.getByRole('button', { name: 'Create New Course' });
      fireEvent.click(createButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('creates a new course', async () => {
      mockedFirestoreService.createCourse.mockResolvedValue('new_course');
      renderWithProviders(<CourseManagement />);

      // Open dialog
      const createButton = screen.getByRole('button', { name: 'Create New Course' });
      fireEvent.click(createButton);

      // Fill form
      fireEvent.change(screen.getByLabelText(/Course Name/i), {
        target: { value: 'New Course' },
      });

      // Submit
      fireEvent.click(screen.getByText('Create'));

      await waitFor(() => {
        expect(mockedFirestoreService.createCourse).toHaveBeenCalled();
      });
    });

    it('validates required fields', async () => {
      renderWithProviders(<CourseManagement />);

      // Open dialog
      const createButton = screen.getByRole('button', { name: 'Create New Course' });
      fireEvent.click(createButton);

      // Submit without filling required fields
      fireEvent.click(screen.getByText('Create'));

      // createCourse should not be called
      expect(mockedFirestoreService.createCourse).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('navigates to course editor when course is clicked', async () => {
      renderWithProviders(<CourseManagement />);

      await waitFor(() => {
        expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      });

      // Find the course card for Test Course 1
      const courseCards = screen.getAllByText('Test Course 1');
      const courseCard = courseCards[0].closest('.MuiCard-root');
      
      // Make sure courseCard is not null
      expect(courseCard).not.toBeNull();
      
      // Find the primary action button (the second button) within this specific card
      const manageButton = within(courseCard as HTMLElement).getAllByRole('button')[1];
      fireEvent.click(manageButton);

      // Should navigate to course editor
      expect(mockNavigate).toHaveBeenCalledWith('/admin/courses/course_1');
    });
  });

  describe('Error Handling', () => {
    it('handles course loading error', async () => {
      mockedFirestoreService.getAllCourses.mockRejectedValue(new Error('Failed to load'));
      renderWithProviders(<CourseManagement />);

      await waitFor(() => {
        const container = screen.getByTestId('course-grid');
        expect(container.children.length).toBe(0);
      });
    });
  });
});
