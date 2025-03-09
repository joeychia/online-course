import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CourseCard from '../components/CourseCard';
import { ThemeProvider } from '../contexts/ThemeContext';
import { FontSizeProvider } from '../contexts/FontSizeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
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

describe('CourseCard', () => {
  const mockOnPrimaryAction = vi.fn();

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider>
        <FontSizeProvider>
          <LanguageProvider>
            {ui}
          </LanguageProvider>
        </FontSizeProvider>
      </ThemeProvider>
    );
  };

  it('renders course name', () => {
    renderWithProviders(
      <CourseCard
        course={mockCourse}
        onPrimaryAction={mockOnPrimaryAction}
        primaryActionText="Test Action"
        language="zh-TW"
      />
    );

    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });

  it('renders primary action button with correct text', () => {
    renderWithProviders(
      <CourseCard
        course={mockCourse}
        onPrimaryAction={mockOnPrimaryAction}
        primaryActionText="Test Action"
        language="zh-TW"
      />
    );

    expect(screen.getByRole('button', { name: 'Test Action' })).toBeInTheDocument();
  });

  it('calls onPrimaryAction when primary action button is clicked', () => {
    renderWithProviders(
      <CourseCard
        course={mockCourse}
        onPrimaryAction={mockOnPrimaryAction}
        primaryActionText="Test Action"
        language="zh-TW"
      />
    );

    const actionButton = screen.getByRole('button', { name: 'Test Action' });
    fireEvent.click(actionButton);

    expect(mockOnPrimaryAction).toHaveBeenCalled();
  });

  it('shows description button when showDescriptionButton is true', () => {
    renderWithProviders(
      <CourseCard
        course={mockCourse}
        onPrimaryAction={mockOnPrimaryAction}
        primaryActionText="Test Action"
        language="zh-TW"
        showDescriptionButton={true}
      />
    );

    expect(screen.getByRole('button', { name: '查看介紹' })).toBeInTheDocument();
  });

  it('hides description button when showDescriptionButton is false', () => {
    renderWithProviders(
      <CourseCard
        course={mockCourse}
        onPrimaryAction={mockOnPrimaryAction}
        primaryActionText="Test Action"
        language="zh-TW"
        showDescriptionButton={false}
      />
    );

    expect(screen.queryByRole('button', { name: '查看介紹' })).not.toBeInTheDocument();
  });

  it('opens description dialog when description button is clicked', () => {
    renderWithProviders(
      <CourseCard
        course={mockCourse}
        onPrimaryAction={mockOnPrimaryAction}
        primaryActionText="Test Action"
        language="zh-TW"
        showDescriptionButton={true}
      />
    );

    const descriptionButton = screen.getByRole('button', { name: '查看介紹' });
    fireEvent.click(descriptionButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});
