import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CourseStudentsList from '../components/admin/CourseStudentsList';
import { firestoreService } from '../services/firestoreService';
import { vi } from 'vitest';

// Mock firestoreService
vi.mock('../services/firestoreService', () => ({
  firestoreService: {
    getRegisteredUsersForCourse: vi.fn(),
    getUserById: vi.fn()
  }
}));

// Mock DataGrid component
vi.mock('@mui/x-data-grid', () => ({
  DataGrid: ({ rows, columns }: any) => (
    <div data-testid="data-grid">
      {rows.map((row: any) => (
        <div key={row.id} data-testid="student-row">
          <span>{row.name}</span>
          <span>{row.email}</span>
          <span>{row.completedLessons}</span>
        </div>
      ))}
    </div>
  )
}));

describe('CourseStudentsList', () => {
  const mockStudents = [
    {
      id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      progress: {
        'course123': {
          'lesson1': { completed: true },
          'lesson2': { completed: true },
          'lesson3': { completed: false }
        }
      }
    },
    {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      progress: {
        'course123': {
          'lesson1': { completed: true }
        }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (firestoreService.getRegisteredUsersForCourse as jest.Mock).mockResolvedValue([]);
    
    render(<CourseStudentsList courseId="course123" />);
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays student data correctly', async () => {
    (firestoreService.getRegisteredUsersForCourse as jest.Mock).mockResolvedValue(['user1', 'user2']);
    (firestoreService.getUserById as jest.Mock)
      .mockImplementation((userId) => 
        Promise.resolve(mockStudents.find(student => student.id === userId))
      );

    render(<CourseStudentsList courseId="course123" />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const studentRows = screen.getAllByTestId('student-row');
    expect(studentRows).toHaveLength(2);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('handles empty student list', async () => {
    (firestoreService.getRegisteredUsersForCourse as jest.Mock).mockResolvedValue([]);

    render(<CourseStudentsList courseId="course123" />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('student-row')).not.toBeInTheDocument();
  });

  it('handles error when fetching students', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    (firestoreService.getRegisteredUsersForCourse as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    render(<CourseStudentsList courseId="course123" />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('calculates completed lessons correctly', async () => {
    (firestoreService.getRegisteredUsersForCourse as jest.Mock).mockResolvedValue(['user1']);
    (firestoreService.getUserById as jest.Mock).mockResolvedValue(mockStudents[0]);

    render(<CourseStudentsList courseId="course123" />);

    await waitFor(() => {
      const studentRow = screen.getByTestId('student-row');
      expect(studentRow).toHaveTextContent('2'); // User1 has 2 completed lessons
    });
  });
});
