import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseProgress from '../components/CourseProgress';
import type { UserProgress } from '../types';

// Mock react-calendar-heatmap
vi.mock('react-calendar-heatmap', () => ({
  default: vi.fn(({ values, onClick }) => (
    <div data-testid="calendar-heatmap">
      {values.map((value: any, index: number) => (
        <button
          key={index}
          data-testid={`calendar-day-${value.date}`}
          onClick={() => onClick(value)}
        >
          {value.date}
        </button>
      ))}
    </div>
  ))
}));

// Mock ReactTooltip
vi.mock('react-tooltip', () => ({
  default: vi.fn(() => null)
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('CourseProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no lessons are completed', () => {
    render(
      <MemoryRouter>
        <CourseProgress progress={{}} courseId="course1" />
      </MemoryRouter>
    );

    expect(screen.getByText('Course Progress')).toBeInTheDocument();
    expect(screen.getByText('No lessons completed yet. Start your learning journey!')).toBeInTheDocument();
  });

  it('displays completed lessons count', () => {
    const mockProgress: Record<string, UserProgress> = {
      'lesson1': {
        completed: true,
        completedAt: '2024-01-01T10:00:00Z',
        lessonName: 'Lesson 1'
      },
      'lesson2': {
        completed: true,
        completedAt: '2024-01-02T10:00:00Z',
        lessonName: 'Lesson 2'
      },
      'lesson3': {
        completed: false,
        lessonName: 'Lesson 3'
      }
    };

    render(
      <MemoryRouter>
        <CourseProgress progress={mockProgress} courseId="course1" />
      </MemoryRouter>
    );

    expect(screen.getByText('2 lessons completed')).toBeInTheDocument();
  });

  it('shows latest completed lesson with timestamp', () => {
    const mockProgress: Record<string, UserProgress> = {
      'lesson1': {
        completed: true,
        completedAt: '2024-01-01T10:00:00Z',
        lessonName: 'Lesson 1'
      },
      'lesson2': {
        completed: true,
        completedAt: '2024-01-02T10:00:00Z',
        lessonName: 'Latest Lesson'
      }
    };

    render(
      <MemoryRouter>
        <CourseProgress progress={mockProgress} courseId="course1" />
      </MemoryRouter>
    );

    expect(screen.getByText('Latest Lesson')).toBeInTheDocument();
    // Note: Exact date format might vary by timezone, so we check for partial match
    expect(screen.getByText(/January 2, 2024 at 02:00 AM/)).toBeInTheDocument();
  });

  it('navigates to lesson when clicking on latest lesson', () => {
    const mockProgress: Record<string, UserProgress> = {
      'lesson1': {
        completed: true,
        completedAt: '2024-01-02T10:00:00Z',
        lessonName: 'Latest Lesson'
      }
    };

    render(
      <MemoryRouter>
        <CourseProgress progress={mockProgress} courseId="course1" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Latest Lesson'));
    expect(mockNavigate).toHaveBeenCalledWith('/course1/lesson1');
  });

  it('handles calendar day clicks', () => {
    const mockProgress: Record<string, UserProgress> = {
      'lesson1': {
        completed: true,
        completedAt: '2024-01-01T10:00:00Z',
        lessonName: 'Lesson 1'
      }
    };

    render(
      <MemoryRouter>
        <CourseProgress progress={mockProgress} courseId="course1" />
      </MemoryRouter>
    );

    const calendarDay = screen.getByTestId('calendar-day-2024-01-01');
    fireEvent.click(calendarDay);
    expect(mockNavigate).toHaveBeenCalledWith('/course1/lesson1');
  });

  it('handles invalid completion dates gracefully', () => {
    const mockProgress: Record<string, UserProgress> = {
      'lesson1': {
        completed: true,
        completedAt: 'invalid-date',
        lessonName: 'Lesson 1'
      }
    };

    render(
      <MemoryRouter>
        <CourseProgress progress={mockProgress} courseId="course1" />
      </MemoryRouter>
    );

    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getByText(/Recently/)).toBeInTheDocument();
  });

  it('shows calendar heatmap with correct data', () => {
    const mockProgress: Record<string, UserProgress> = {
      'lesson1': {
        completed: true,
        completedAt: '2024-01-01T10:00:00Z',
        lessonName: 'Lesson 1'
      },
      'lesson2': {
        completed: true,
        completedAt: '2024-01-01T11:00:00Z',
        lessonName: 'Lesson 2'
      }
    };

    render(
      <MemoryRouter>
        <CourseProgress progress={mockProgress} courseId="course1" />
      </MemoryRouter>
    );

    // Check if calendar is rendered with the correct date
    const calendarDay = screen.getByTestId('calendar-day-2024-01-01');
    expect(calendarDay).toBeInTheDocument();

    // Verify that clicking the calendar day navigates to the latest lesson completed on that day
    fireEvent.click(calendarDay);
    expect(mockNavigate).toHaveBeenCalledWith('/course1/lesson2');
  });

  it('sorts lessons by completion date correctly', () => {
    const mockProgress: Record<string, UserProgress> = {
      'lesson1': {
        completed: true,
        completedAt: '2024-01-01T10:00:00Z',
        lessonName: 'Old Lesson'
      },
      'lesson2': {
        completed: true,
        completedAt: '2024-01-02T10:00:00Z',
        lessonName: 'Latest Lesson'
      },
      'lesson3': {
        completed: false,
        lessonName: 'Uncompleted Lesson'
      }
    };

    render(
      <MemoryRouter>
        <CourseProgress progress={mockProgress} courseId="course1" />
      </MemoryRouter>
    );

    // The latest completed lesson should be shown in the "Latest Completed Lesson" section
    const latestLessonLink = screen.getByText('Latest Lesson');
    expect(latestLessonLink).toBeInTheDocument();
  });
}); 