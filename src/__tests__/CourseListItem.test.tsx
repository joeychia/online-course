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
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
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
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onSelect when View Details button is clicked', () => {
    renderWithProviders(
      <CourseListItem
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    expect(mockOnSelect).toHaveBeenCalled();
  });

  it('calls onEdit with course when Edit button is clicked', () => {
    renderWithProviders(
      <CourseListItem
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCourse);
  });

  it('calls onDelete with course ID when Delete button is clicked', async () => {
    renderWithProviders(
      <CourseListItem
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockCourse.id);
  });

  it('renders all action buttons with correct icons', () => {
    renderWithProviders(
      <CourseListItem
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    // Check that all buttons are present with their icons
    expect(screen.getByTestId('VisibilityIcon')).toBeInTheDocument();
    expect(screen.getByTestId('EditIcon')).toBeInTheDocument();
    expect(screen.getByTestId('DeleteIcon')).toBeInTheDocument();

    // Check button labels
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('maintains consistent button styling', () => {
    renderWithProviders(
      <CourseListItem
        course={mockCourse}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onSelect={mockOnSelect}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('MuiButton-outlined');
      expect(button).toHaveClass('MuiButton-sizeSmall');
    });
  });
});
