import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseList from '../pages/CourseList';
import { getAllCourses } from '../services/dataService';
import type { Course, UserProfile } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import type { AuthContextType } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { FontSizeProvider } from '../contexts/FontSizeContext';

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
vi.mock('../hooks/useAuth', () => ({
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

const mockFirebaseUser: FirebaseUser = {
  uid: '123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: false,
  isAnonymous: false,
  metadata: {
    creationTime: Date.now().toString(),
    lastSignInTime: Date.now().toString()
  },
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn(),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase'
};

const mockUserProfile: UserProfile = {
  id: '123',
  name: 'Test User',
  email: 'test@example.com',
  roles: {
    student: true,
    instructor: false,
    admin: false
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  registeredCourses: {},
  progress: {},
  groupIds: {},
  notes: {},
  QuizHistory: {}
};

interface RenderOptions {
  user?: FirebaseUser | null;
}

// @ts-ignore - This is used in tests
const renderWithProviders = (ui: React.ReactElement, { user = null }: RenderOptions = {}) => {
  const mockAuthValue: AuthContextType = {
    currentUser: mockFirebaseUser,
    userProfile: mockUserProfile as UserProfile | null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn()
  };
  mockUseAuth.mockReturnValue(mockAuthValue);

  return render(
    <ThemeProvider>
      <FontSizeProvider>
        <LanguageProvider>
          <MemoryRouter>
            {ui}
          </MemoryRouter>
        </LanguageProvider>
      </FontSizeProvider>
    </ThemeProvider>
  );
};

describe('CourseList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  const renderComponent = async () => {
    const result = render(
      <ThemeProvider>
        <FontSizeProvider>
          <LanguageProvider>
            <MemoryRouter>
              <CourseList />
            </MemoryRouter>
          </LanguageProvider>
        </FontSizeProvider>
      </ThemeProvider>
    );
    // Wait for initial loading to complete
    await screen.findByRole('heading', { name: /可選課程/i });
    return result;
  };

  it('shows loading state initially', () => {
    vi.mocked(getAllCourses).mockImplementation(() => new Promise(() => {}));
    render(
      <ThemeProvider>
        <FontSizeProvider>
          <LanguageProvider>
            <MemoryRouter>
              <CourseList />
            </MemoryRouter>
          </LanguageProvider>
        </FontSizeProvider>
      </ThemeProvider>
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
      <ThemeProvider>
        <FontSizeProvider>
          <LanguageProvider>
            <MemoryRouter>
              <CourseList />
            </MemoryRouter>
          </LanguageProvider>
        </FontSizeProvider>
      </ThemeProvider>
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

    const lockChips = screen.getAllByRole('button', { name: '課程介紹' });
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
      <ThemeProvider>
        <FontSizeProvider>
          <LanguageProvider>
            <MemoryRouter>
              <CourseList />
            </MemoryRouter>
          </LanguageProvider>
        </FontSizeProvider>
      </ThemeProvider>
    );

    expect(await screen.findByText('目前沒有可用的課程')).toBeInTheDocument();
  });

  it('shows course description button for each course', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await renderComponent();

    const descriptionButtons = screen.getAllByRole('button', { name: '課程介紹' });
    expect(descriptionButtons).toHaveLength(mockCourses.length);
  });

  it('opens description dialog when description button is clicked', async () => {
    vi.mocked(getAllCourses).mockResolvedValue(mockCourses);
    await renderComponent();

    const descriptionButton = screen.getAllByRole('button', { name: '課程介紹' })[0];
    fireEvent.click(descriptionButton);

    expect(screen.getByText('Description 1')).toBeInTheDocument();
  });
});
