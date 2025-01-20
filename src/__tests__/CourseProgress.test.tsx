import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseProgress from '../components/CourseProgress';

// Mock react-calendar-heatmap
vi.mock('react-calendar-heatmap', () => ({
  __esModule: true,
  default: () => <div data-testid="calendar-heatmap">Calendar Heatmap</div>
}));

// Mock ReactTooltip
vi.mock('react-tooltip', () => ({
  __esModule: true,
  default: () => <div>Tooltip</div>
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

  const mockProgress = {
    'lesson1': {
      completed: true,
      completedAt: '2024-03-20T10:00:00Z',
      lessonName: 'Introduction'
    },
    'lesson2': {
      completed: true,
      completedAt: '2024-03-21T11:00:00Z',
      lessonName: 'Basic Concepts'
    }
  };

  const mockUnits = [
    { id: 'unit1', name: 'Unit 1' },
    { id: 'unit2', name: 'Unit 2' }
  ];

  const mockUnitLessons = {
    'unit1': [
      { id: 'lesson1', name: 'Introduction' },
      { id: 'lesson2', name: 'Basic Concepts' },
      { id: 'lesson3', name: 'Advanced Topics' }
    ],
    'unit2': [
      { id: 'lesson4', name: 'Next Unit Lesson' }
    ]
  };

  const defaultProps = {
    progress: mockProgress,
    courseId: 'course1',
    units: mockUnits,
    unitLessons: mockUnitLessons
  };

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <CourseProgress {...defaultProps} {...props} />
      </MemoryRouter>
    );
  };

  it('renders course progress with completed lessons count', () => {
    renderComponent();
    expect(screen.getByText('2 lessons completed')).toBeInTheDocument();
  });

  it('shows latest completed lesson', () => {
    renderComponent();
    expect(screen.getByText('Unit 1 / Basic Concepts')).toBeInTheDocument();
    expect(screen.getByText(/March 21, 2024 at/)).toBeInTheDocument();
  });

  it('shows next lesson when available', () => {
    renderComponent();
    expect(screen.getByText('Next Up')).toBeInTheDocument();
    expect(screen.getByText('Unit 1 / Advanced Topics')).toBeInTheDocument();
  });

  it('shows calendar heatmap', () => {
    renderComponent();
    expect(screen.getByTestId('calendar-heatmap')).toBeInTheDocument();
  });

  it('handles empty progress', () => {
    renderComponent({ progress: {} });
    expect(screen.getByText('No lessons completed yet. Start your learning journey!')).toBeInTheDocument();
  });

  it('finds next lesson in same unit', () => {
    renderComponent();
    const nextLessonLink = screen.getByText('Unit 1 / Advanced Topics');
    expect(nextLessonLink).toBeInTheDocument();
  });

  it('finds next lesson in next unit when at end of current unit', () => {
    const progressAtEndOfUnit = {
      'lesson3': {
        completed: true,
        completedAt: '2024-03-21T11:00:00Z',
        lessonName: 'Advanced Topics'
      }
    };
    
    renderComponent({ progress: progressAtEndOfUnit });
    const nextLessonLink = screen.getByText('Unit 2 / Next Unit Lesson');
    expect(nextLessonLink).toBeInTheDocument();
  });

  it('navigates to lesson when clicking on latest completed lesson', () => {
    renderComponent();
    const latestLessonLink = screen.getByText('Unit 1 / Basic Concepts');
    fireEvent.click(latestLessonLink);
    expect(mockNavigate).toHaveBeenCalledWith('/course1/unit1/lesson2');
  });

  it('navigates to next lesson when clicking on next lesson link', () => {
    renderComponent();
    const nextLessonLink = screen.getByText('Unit 1 / Advanced Topics');
    fireEvent.click(nextLessonLink);
    expect(mockNavigate).toHaveBeenCalledWith('/course1/unit1/lesson3');
  });
}); 