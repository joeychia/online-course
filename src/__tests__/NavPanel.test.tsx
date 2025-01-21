import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from '@testing-library/react';
import NavPanel from '../components/NavPanel';
import { Course } from '../types';
import { getLessonsIdNameForUnit } from '../services/dataService';

// Mock dataService
vi.mock('../services/dataService', () => ({
  getLessonsIdNameForUnit: vi.fn()
}));

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
  { id: '1', name: '第一單元' },
  { id: '2', name: '第二單元' }
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
  { id: 'u1l1', name: '第一課' },
  { id: 'u1l2', name: '第二課' }
];

const mockLessonsUnit2 = [
  { id: 'u2l1', name: '第一課' },
  { id: 'u2l2', name: '第二課' }
];

const mockProgress = {
  'u1l1': { completed: true },
  'u1l2': { completed: false },
  'u2l1': { completed: true },
  'u2l2': { completed: false }
};

const mockGetLessons = vi.mocked(getLessonsIdNameForUnit);
mockGetLessons.mockImplementation((unitId) => {
  return Promise.resolve(unitId === '1' ? mockLessonsUnit1 : mockLessonsUnit2);
});

const renderWithRouter = async (ui: React.ReactElement) => {
  render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );

  // Wait for initial render
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  const drawer = screen.getByTestId('nav-drawer');
  return { drawer };
};

describe('NavPanel', () => {
  it('renders course name and description', async () => {
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

    const drawer = screen.getByTestId('nav-drawer');
    const unitButtons = within(drawer).getAllByTestId('unit-button-1');
    expect(unitButtons[0]).toBeInTheDocument();

    const courseName = within(drawer).getByText('測試課程');
    expect(courseName).toBeInTheDocument();
  });

  it('loads lessons when unit is expanded', async () => {
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

    const drawer = screen.getByTestId('nav-drawer');
    const unitButtons = within(drawer).getAllByTestId('unit-button-1');
    await act(async () => {
      fireEvent.click(unitButtons[0]);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const lessonItems = within(drawer).getAllByTestId('lesson-item-u1l1');
    expect(lessonItems[0]).toBeInTheDocument();
  });

  it('shows completion status correctly', async () => {
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

    const drawer = screen.getByTestId('nav-drawer');
    const unitButtons = within(drawer).getAllByTestId('unit-button-1');
    await act(async () => {
      fireEvent.click(unitButtons[0]);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const completeIcon = within(drawer).getAllByTestId('lesson-complete-u1l1')[0];
    expect(completeIcon).toBeInTheDocument();
  });

  it('calls onSelectLesson when a lesson is clicked', async () => {
    const onSelectLesson = vi.fn();
    await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        onSelectLesson={onSelectLesson}
        isOpen={true}
        onToggle={() => {}}
      />
    );

    const drawer = screen.getByTestId('nav-drawer');
    const unitButtons = within(drawer).getAllByTestId('unit-button-1');
    await act(async () => {
      fireEvent.click(unitButtons[0]);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const lessonItems = within(drawer).getAllByTestId('lesson-item-u1l1');
    fireEvent.click(lessonItems[0]);
    expect(onSelectLesson).toHaveBeenCalledWith('1', 'u1l1');
  });

  it('locks lessons based on course settings', async () => {
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

    const drawer = screen.getByTestId('nav-drawer');
    const unitButtons = within(drawer).getAllByTestId('unit-button-1');
    await act(async () => {
      fireEvent.click(unitButtons[0]);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const unlockedIcon = within(drawer).getAllByTestId('lesson-unlocked-u1l2')[0];
    expect(unlockedIcon).toBeInTheDocument();
  });

  it('toggles unit expansion when clicked', async () => {
    const { drawer } = await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        isOpen={true}
        onToggle={() => {}}
      />
    );

    // Initially expanded
    let lessonItems = within(drawer).getAllByTestId('lesson-item-u1l1');
    expect(lessonItems.length).toBe(1);

    // Click to collapse
    const unitButton = within(drawer).getByTestId('unit-button-1');
    await act(async () => {
      unitButton.click();
      // Wait for the collapse animation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    // Wait for the element to be unmounted
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Check that the lessons are no longer visible
    lessonItems = within(drawer).queryAllByTestId('lesson-item-u1l1');
    expect(lessonItems.length).toBe(0);
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

    const drawer = screen.getByTestId('nav-drawer');
    const mobileDrawer = drawer.querySelector('.MuiDrawer-paper');
    expect(mobileDrawer).toHaveClass('MuiDrawer-paper', 'MuiDrawer-paperAnchorLeft');
  });
}); 