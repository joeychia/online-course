import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
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
  { id: '1', name: '第一單元', lessons: [] },
  { id: '2', name: '第二單元', lessons: [] }
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
        selectedUnitId="1"
      />
    );

    const drawer = screen.getByTestId('nav-drawer');

    // Wait for lessons to load
    await waitFor(() => {
      const lessonItems = within(drawer).getAllByTestId('lesson-item-u1l1');
      expect(lessonItems[0]).toBeInTheDocument();
    });
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
        selectedUnitId="1" // Set selectedUnitId to ensure first unit is expanded
      />
    );

    const drawer = screen.getByTestId('nav-drawer');
    
    // Wait for lessons to load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Wait for completion icon to appear
    await waitFor(() => {
      const completeIcon = within(drawer).getByTestId('lesson-complete-u1l1');
      expect(completeIcon).toBeInTheDocument();
    });
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
        selectedUnitId="1"
      />
    );

    const drawer = screen.getByTestId('nav-drawer');

    // Wait for lessons to load
    await waitFor(() => {
      const lessonItems = within(drawer).getAllByTestId('lesson-item-u1l1');
      expect(lessonItems[0]).toBeInTheDocument();
    });

    const lessonItem = within(drawer).getByTestId('lesson-item-u1l1');
    fireEvent.click(lessonItem);
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
        selectedUnitId="1"
      />
    );

    const drawer = screen.getByTestId('nav-drawer');

    // Wait for lessons to load
    await waitFor(() => {
      const unlockedIcon = within(drawer).getByTestId('lesson-unlocked-u1l2');
      expect(unlockedIcon).toBeInTheDocument();
    });
  });

  it('toggles unit expansion when clicked', async () => {
    const { drawer } = await renderWithRouter(
      <NavPanel
        course={mockCourse}
        units={mockUnits}
        progress={mockProgress}
        isOpen={true}
        onToggle={() => {}}
        selectedUnitId="1" // Set selectedUnitId to ensure first unit is expanded
      />
    );

    // Wait for initial lessons to load
    await waitFor(() => {
      const lessonItems = within(drawer).getAllByTestId('lesson-item-u1l1');
      expect(lessonItems.length).toBe(1);
    });

    // Click to collapse
    const unitButton = within(drawer).getByTestId('unit-button-1');
    fireEvent.click(unitButton);

    // Wait for collapse animation and verify lessons are hidden
    await waitFor(() => {
      const lessonItems = within(drawer).queryAllByTestId('lesson-item-u1l1');
      expect(lessonItems.length).toBe(0);
    });

    // Click to expand again
    fireEvent.click(unitButton);

    // Wait for lessons to reappear
    await waitFor(() => {
      const lessonItems = within(drawer).getAllByTestId('lesson-item-u1l1');
      expect(lessonItems.length).toBe(1);
    });
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
