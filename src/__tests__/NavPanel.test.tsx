import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from '@testing-library/react';
import NavPanel from '../components/NavPanel';
import { Course } from '../types';
import { firestoreService } from '../services/firestoreService';
import { AuthContext } from '../contexts/AuthContext';

// Mock firestoreService
vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    getLessonsIdNameForUnit: vi.fn(),
    getLessonById: vi.fn(),
    getUnitById: vi.fn()
  }
}));

// Mock unit data
const mockUnitData = {
  id: '1',
  name: '第一單元',
  courseId: '1',
  description: 'Test Unit Description',
  order: 0,
  lessons: [
    { id: 'u1l1', name: '第一課', order: 0 },
    { id: 'u1l2', name: '第二課', order: 1 }
  ]
};

// Mock auth context
const mockAuthContext = {
  currentUser: {
    uid: 'test-user',
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
  },
  userProfile: {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    roles: { student: true, instructor: false, admin: false },
    progress: {},
    registeredCourses: {},
    groupIds: {},
    notes: {},
    QuizHistory: {}
  },
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signInWithGoogle: vi.fn(),
  signUp: vi.fn(),
  resetPassword: vi.fn(),
  user: {
    uid: 'test-user',
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
  },
  isAdmin: false
};

// Get the mocked firestoreService
const mockedFirestoreService = firestoreService as any;

// Mock useTranslation hook
vi.mock('../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        unit: '單元',
        lesson: '課程'
      };
      return translations[key] || key;
    },
    language: 'zh-TW'
  })
}));

const mockUnits = [
  { id: '1', name: '第一單元', order: 0, lessonCount: 2 },
  { id: '2', name: '第二單元', order: 1, lessonCount: 2 }
];

const mockCourse: Course = {
  id: '1',
  name: '測試課程',
  description: '測試課程描述',
  settings: {
    unlockLessonIndex: 1
  },
  units: mockUnits,
  groupIds: { default: true }
};

const mockLessonsUnit1 = [
  { id: 'u1l1', name: '第一課', order: 0 },
  { id: 'u1l2', name: '第二課', order: 1 }
];

const mockLessonsUnit2 = [
  { id: 'u2l1', name: '第一課', order: 0 },
  { id: 'u2l2', name: '第二課', order: 1 }
];

const mockProgress = {
  'u1l1': { completed: true, completedAt: '2024-01-01T10:00:00Z' },
  'u1l2': { completed: false, completedAt: '2024-01-02T10:00:00Z'  },
  'u2l1': { completed: true, completedAt: '2024-01-03T10:00:00Z'  },
  'u2l2': { completed: false, completedAt: '2024-01-04T10:00:00Z'  }
};



const renderWithRouter = async (ui: React.ReactElement) => {
  const result = render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </AuthContext.Provider>
  );

  // Wait for initial render
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  // Wait for drawer to be mounted using data-testid instead of role
  const drawerPaper = await screen.findByTestId('nav-drawer');
  return { drawer: drawerPaper, ...result };
};

describe('NavPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFirestoreService.getUnitById.mockImplementation((unitId: string) => {
      return Promise.resolve(unitId === '1' ? mockUnitData : null);
    });
    mockedFirestoreService.getLessonsIdNameForUnit.mockImplementation((unitId: string) => {
      return Promise.resolve(unitId === '1' ? mockLessonsUnit1 : mockLessonsUnit2);
    });
  });

  it('renders course name and description', async () => {
    const { drawer } = await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        onSelectLesson={() => {}}
        isOpen={true}
        onToggle={() => {}}
      />
    );

    const unitButton = await within(drawer).findByTestId('unit-button-1');
    expect(unitButton).toBeInTheDocument();
    expect(within(drawer).getByText('第一單元')).toBeInTheDocument();
  });

  it('loads lessons when unit is expanded', async () => {
    const { drawer } = await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        onSelectLesson={() => {}}
        isOpen={true}
        onToggle={() => {}}
        selectedUnitId="1"
      />
    );

    // Wait for unit button to be available
    const unitButton = await within(drawer).findByTestId('unit-button-1');
    expect(unitButton).toBeInTheDocument();

    // Wait for lessons to load
    const lessonItem = await within(drawer).findByTestId('lesson-item-u1l1');
    expect(lessonItem).toBeInTheDocument();
  });

  it('shows completion status correctly', async () => {
    const { drawer } = await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        onSelectLesson={() => {}}
        isOpen={true}
        onToggle={() => {}}
        selectedUnitId="1"
      />
    );

    // Wait for completion icon to appear
    const completeIcon = await within(drawer).findByTestId('lesson-complete-u1l1');
    expect(completeIcon).toBeInTheDocument();
  });

  it('calls onSelectLesson when a lesson is clicked', async () => {
    const onSelectLesson = vi.fn();
    const { drawer } = await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        onSelectLesson={onSelectLesson}
        isOpen={true}
        onToggle={() => {}}
        selectedUnitId="1"
      />
    );

    const lessonItem = await within(drawer).findByTestId('lesson-item-u1l1');
    fireEvent.click(lessonItem);
    expect(onSelectLesson).toHaveBeenCalledWith('1', 'u1l1');
  });

  it('locks lessons based on course settings and completion status', async () => {
    const { drawer } = await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        onSelectLesson={() => {}}
        isOpen={true}
        onToggle={() => {}}
        selectedUnitId="1"
      />
    );

    // First lesson should be accessible
    const firstLesson = await within(drawer).findByTestId('lesson-item-u1l1');
    expect(firstLesson).toBeInTheDocument();
    expect(firstLesson).not.toHaveAttribute('aria-disabled');

    // Second lesson should be accessible because first lesson is completed
    const secondLesson = await within(drawer).findByTestId('lesson-item-u1l2');
    expect(secondLesson).toBeInTheDocument();
    expect(secondLesson).not.toHaveAttribute('aria-disabled');
  });

  it('toggles unit expansion when clicked', async () => {
    const { drawer } = await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        isOpen={true}
        onToggle={() => {}}
        selectedUnitId="1"
      />
    );

    // Initial state - expanded
    const lessonItem = await within(drawer).findByTestId('lesson-item-u1l1');
    expect(lessonItem).toBeInTheDocument();

    // Click to collapse
    const unitButton = within(drawer).getByTestId('unit-button-1');
    fireEvent.click(unitButton);

    // Verify collapse
    await waitFor(() => {
      const collapseDiv = within(drawer).getByTestId('unit-button-1').nextElementSibling;
      expect(collapseDiv).toHaveClass('MuiCollapse-hidden');
    });

    // Click to expand again
    fireEvent.click(unitButton);

    // Verify expand
    await waitFor(() => {
      const collapseDiv = within(drawer).getByTestId('unit-button-1').nextElementSibling;
      expect(collapseDiv).not.toHaveClass('MuiCollapse-hidden');
    });
  });

  it('handles mobile view correctly', async () => {
    await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        onSelectLesson={() => {}}
        isOpen={true}
        onToggle={() => {}}
      />
    );

    const mobileDrawer = document.querySelector('.MuiDrawer-paper');
    expect(mobileDrawer).toBeInTheDocument();
    expect(mobileDrawer).toHaveClass('MuiDrawer-paper');
    expect(mobileDrawer).toHaveClass('MuiDrawer-paperAnchorLeft');
  });
});
