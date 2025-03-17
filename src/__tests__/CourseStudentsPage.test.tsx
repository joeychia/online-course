import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseStudentsPage from '../pages/CourseStudentsPage';
import { AuthProvider } from '../contexts/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { vi } from 'vitest';

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

// Mock CourseStudentsList component
vi.mock('../components/admin/CourseStudentsList', () => ({
  default: () => <div data-testid="course-students-list">Course Students List</div>
}));

describe('CourseStudentsPage', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      isAdmin: true,
      loading: false
    });
  });

  it('renders course students list for admin users', () => {
    render(
      <MemoryRouter initialEntries={['/admin/course/123/students']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/course/:courseId/students" element={<CourseStudentsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Course Students')).toBeInTheDocument();
    expect(screen.getByTestId('course-students-list')).toBeInTheDocument();
  });

  it('redirects non-admin users to home', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      isAdmin: false,
      loading: false
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/admin/course/123/students']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/course/:courseId/students" element={<CourseStudentsPage />} />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText('Course Students')).not.toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('redirects to admin dashboard if courseId is missing', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/admin/course//students']}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/course/:courseId/students" element={<CourseStudentsPage />} />
            <Route path="/admin" element={<div>Admin Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText('Course Students')).not.toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
