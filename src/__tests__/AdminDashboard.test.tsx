import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../pages/AdminDashboard';
import { useAuth } from '../hooks/useAuth';
import { firestoreService } from '../services/firestoreService';
import { MemoryRouter } from 'react-router-dom';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '../types';

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
    student: false,
    instructor: false,
    admin: false
  },
  registeredCourses: {},
  progress: {},
  groupIds: {},
  notes: {},
  QuizHistory: {}
};

// Mock dependencies
vi.mock('../hooks/useAuth');
// Mock firestoreService
vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    getUserById: vi.fn()
  }
}));

// Get the mocked firestoreService
const mockedFirestoreService = firestoreService as any;
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(() => ({}))
}));
vi.mock('../components/admin/CourseManagement', () => ({
  CourseManagement: () => <div data-testid="course-management">Course Management Component</div>
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: () => <div data-testid="navigate">Navigate Component</div>
  };
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: mockFirebaseUser,
      userProfile: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn()
    });
    mockedFirestoreService.getUserById.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects when user is not admin', async () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: mockFirebaseUser,
      userProfile: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn()
    });
    mockedFirestoreService.getUserById.mockResolvedValue({
      ...mockUserProfile,
      roles: { student: false, instructor: false, admin: false }
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });
  });

  it('renders admin dashboard for admin users', async () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: mockFirebaseUser,
      userProfile: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn()
    });
    mockedFirestoreService.getUserById.mockResolvedValue({
      ...mockUserProfile,
      name: 'Admin User',
      email: 'admin@example.com',
      roles: { student: false, instructor: false, admin: true }
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('course-management')).toBeInTheDocument();
    });
  });

  it('handles case when currentUser is null', async () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: null,
      userProfile: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn()
    });

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });
    expect(mockedFirestoreService.getUserById).not.toHaveBeenCalled();
  });

  it('handles error when fetching user profile', async () => {
    vi.mocked(useAuth).mockReturnValue({
      currentUser: mockFirebaseUser,
      userProfile: null,
      loading: false,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
      signUp: vi.fn(),
      resetPassword: vi.fn()
    });
    mockedFirestoreService.getUserById.mockRejectedValue(new Error('Failed to fetch user'));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });
  });
});
