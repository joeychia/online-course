import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseListItem } from '../components/admin/CourseListItem';
import { ThemeProvider } from '../contexts/ThemeContext';
import { FontSizeProvider } from '../contexts/FontSizeContext';
import type { Course } from '../types';

const mockCourse: Course = {
  id: 'course_1',
  name: 'Test Course',
  description: 'Test Description',
  units: [],
  settings: { unlockLessonIndex: 0 },
  groupIds: {},
  isPublic: false
};

describe('CourseListItem', () => {
  const mockOnSelect = vi.fn();

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider>
        <FontSizeProvider>
          {ui}
        </FontSizeProvider>
      </ThemeProvider>
    );
  };

  it('renders course name and description', () => {
    renderWithProviders(
      <CourseListItem
        course={mockCourse}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    renderWithProviders(
      <CourseListItem
        course={mockCourse}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockOnSelect).toHaveBeenCalled();
  });
});
