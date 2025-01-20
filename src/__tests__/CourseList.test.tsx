import { render, cleanup, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseList from '../pages/CourseList';
import { getAllCourses } from '../services/dataService';
import type { Course } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import type { AuthContextType } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';

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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

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
    <LanguageProvider>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </LanguageProvider>
  );
};

describe('CourseList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  const renderComponent = async () => {
    const result = render(
      <LanguageProvider>
        <MemoryRouter>
          <CourseList />
        </MemoryRouter>
      </LanguageProvider>
    );
    // Wait for initial loading to complete
    await screen.findByRole('heading', { name: /可選課程/i });
    return result;
  };

  it('shows loading state initially', () => {
    vi.mocked(getAllCourses).mockImplementation(() => new Promise(() => {}));
    render(
      <LanguageProvider>
        <MemoryRouter>
          <CourseList />
        </MemoryRouter>
      </LanguageProvider>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays courses when loaded successfully', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await renderComponent();

    expect(screen.getByText('Test Course 1')).toBeInTheDocument();
    expect(screen.getByText('Test Course 2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '可選課程' })).toBeInTheDocument();
  });

  it('shows error message when loading fails', async () => {
    vi.mocked(getAllCourses).mockRejectedValue(new Error('Failed to load'));
    render(
      <LanguageProvider>
        <MemoryRouter>
          <CourseList />
        </MemoryRouter>
      </LanguageProvider>
    );

    expect(await screen.findByText('載入課程失敗。請稍後再試。')).toBeInTheDocument();
  });

  it('shows sign in alert for unauthenticated users', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await renderComponent();

    expect(screen.getByText('登入以訪問完整課程內容並追蹤您的學習進度。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
  });

  it('shows lock icon on courses for unauthenticated users', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await renderComponent();

    const lockChips = screen.getAllByText('請登入以訪問課程');
    expect(lockChips).toHaveLength(mockCourses.length);
  });

  it('navigates to login when sign in button is clicked', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await renderComponent();

    const signInButton = screen.getByRole('button', { name: '登入' });
    fireEvent.click(signInButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows "No courses available" when courses array is empty', async () => {
    vi.mocked(getAllCourses).mockResolvedValue([]);
    render(
      <LanguageProvider>
        <MemoryRouter>
          <CourseList />
        </MemoryRouter>
      </LanguageProvider>
    );

    expect(await screen.findByText('目前沒有可用的課程')).toBeInTheDocument();
  });
}); 