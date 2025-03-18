import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../pages/AdminDashboard';
import { useAuth } from '../hooks/useAuth';
import { firestoreService } from '../services/firestoreService';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import { mockUserProfile, createMockAuthContext } from '../test/mocks/authContextMock';
import { MockNavigate } from '../test/mocks/components/Navigation';

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
    Navigate: () => <MockNavigate to="/" replace />
  };
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuthContext({
      userProfile: null,
      isAdmin: false
    }));
    mockedFirestoreService.getUserById.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <LanguageProvider>
          <AdminDashboard />
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects when user is not admin', async () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuthContext({
      userProfile: null,
      isAdmin: false
    }));
    mockedFirestoreService.getUserById.mockResolvedValue({
      ...mockUserProfile,
      roles: { student: false, instructor: false, admin: false }
    });

    render(
      <MemoryRouter>
        <LanguageProvider>
          <AdminDashboard />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });
  });

  it('renders admin dashboard for admin users', async () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuthContext({
      userProfile: null,
      isAdmin: true
    }));
    mockedFirestoreService.getUserById.mockResolvedValue({
      ...mockUserProfile,
      name: 'Admin User',
      email: 'admin@example.com',
      roles: { student: false, instructor: false, admin: true }
    });

    render(
      <MemoryRouter>
        <LanguageProvider>
          <AdminDashboard />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('course-management')).toBeInTheDocument();
    });
  });

  it('handles case when currentUser is null', async () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuthContext({
      currentUser: null,
      userProfile: null,
      user: null,
      isAdmin: false
    }));

    render(
      <MemoryRouter>
        <LanguageProvider>
          <AdminDashboard />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });
    expect(mockedFirestoreService.getUserById).not.toHaveBeenCalled();
  });

  it('handles error when fetching user profile', async () => {
    vi.mocked(useAuth).mockReturnValue(createMockAuthContext({
      userProfile: null,
      isAdmin: false
    }));
    mockedFirestoreService.getUserById.mockRejectedValue(new Error('Failed to fetch user'));

    render(
      <MemoryRouter>
        <LanguageProvider>
          <AdminDashboard />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });
  });
});
