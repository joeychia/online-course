import { render, cleanup, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseList from '../pages/CourseList';
import { getAllCourses } from '../services/dataService';
import type { Course } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import type { AuthContextType } from '../contexts/AuthContext';

// Mock the dataService
vi.mock('../services/dataService', () => ({
  getAllCourses: vi.fn()
}));

// Create a mock function for useAuth
const mockUseAuth = vi.fn() as unknown as ReturnType<typeof vi.fn> & { mockReturnValue: (value: AuthContextType) => void };
mockUseAuth.mockReturnValue({
  currentUser: null,
  userProfile: null,
  loading: false,
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn()
});

// Mock useAuth hook
vi.mock('../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock data
const mockCourses: Course[] = [
  {
    id: 'course1',
    name: 'Test Course 1',
    description: 'Description 1',
    settings: {
      unlockLessonIndex: 0
    },
    units: [],
    groupIds: {}
  },
  {
    id: 'course2',
    name: 'Test Course 2',
    description: 'Description 2',
    settings: {
      unlockLessonIndex: 0
    },
    units: [],
    groupIds: {}
  }
];

interface RenderOptions {
  user?: FirebaseUser | null;
}

// Test wrapper with router and auth context
const renderWithProviders = (ui: React.ReactElement, { user = null }: RenderOptions = {}) => {
  const mockUser = user as FirebaseUser | null;
  const mockAuthValue: AuthContextType = {
    currentUser: mockUser,
    userProfile: mockUser ? {
      id: mockUser.uid,
      name: mockUser.email?.split('@')[0] || 'Test User',
      email: mockUser.email || 'test@example.com',
      role: 'student',
      createdAt: new Date(),
      updatedAt: new Date()
    } : null,
    loading: false,
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  };
  mockUseAuth.mockReturnValue(mockAuthValue);

  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};

describe('CourseList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('shows loading state initially', async () => {
    vi.mocked(getAllCourses).mockImplementation(() => new Promise(() => {}));
    await act(async () => {
      renderWithProviders(<CourseList />);
    });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays courses when loaded successfully', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await act(async () => {
      renderWithProviders(<CourseList />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Course 1')).toBeInTheDocument();
      expect(screen.getByText('Test Course 2')).toBeInTheDocument();
    });
  });

  it('shows error message when loading fails', async () => {
    vi.mocked(getAllCourses).mockRejectedValue(new Error('Failed to load'));
    await act(async () => {
      renderWithProviders(<CourseList />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load courses/i)).toBeInTheDocument();
    });
  });

  it('shows sign in alert for unauthenticated users', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await act(async () => {
      renderWithProviders(<CourseList />);
    });
    expect(screen.getByText(/Sign in to access full course content/i)).toBeInTheDocument();
  });

  it('does not show sign in alert for authenticated users', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await act(async () => {
      renderWithProviders(<CourseList />, { 
        user: { uid: '123', email: 'test@example.com' } as FirebaseUser 
      });
    });
    expect(screen.queryByText(/Sign in to access full course content/i)).not.toBeInTheDocument();
  });

  it('navigates to login when sign in button is clicked', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await act(async () => {
      renderWithProviders(<CourseList />);
    });
    
    const alert = screen.getByRole('alert');
    const signInButton = within(alert).getByRole('button', { name: /sign in/i });
    await act(async () => {
      fireEvent.click(signInButton);
    });
    
    expect(window.location.pathname).toBe('/login');
  });

  it('shows lock icon on courses for unauthenticated users', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await act(async () => {
      renderWithProviders(<CourseList />);
    });

    await waitFor(() => {
      const lockChips = screen.getAllByTestId('LockIcon');
      expect(lockChips).toHaveLength(mockCourses.length);
    });
  });

  it('does not show lock icon on courses for authenticated users', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await act(async () => {
      renderWithProviders(<CourseList />, { 
        user: { uid: '123', email: 'test@example.com' } as FirebaseUser 
      });
    });

    await waitFor(() => {
      const lockChips = screen.queryAllByTestId('LockIcon');
      expect(lockChips).toHaveLength(0);
    });
  });

  it('shows "No courses available" when courses array is empty', async () => {
    vi.mocked(getAllCourses).mockResolvedValue([]);
    await act(async () => {
      renderWithProviders(<CourseList />);
    });

    await waitFor(() => {
      expect(screen.getByText(/no courses available/i)).toBeInTheDocument();
    });
  });
}); 