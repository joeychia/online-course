import React from 'react';

/**
 * Creates a test-specific version of a component with default props and mocked dependencies
 * 
 * @param Component - The original component to create a test version of
 * @param defaultProps - Default props to provide to the component
 * @returns A new component with the default props applied
 * 
 * @example
 * const TestCourseStudentsPage = createTestComponent(
 *   CourseStudentsPage,
 *   { courseId: '123', isAdmin: true }
 * );
 * 
 * // In tests
 * render(<TestCourseStudentsPage />); // Uses defaults
 * render(<TestCourseStudentsPage isAdmin={false} />); // Override specific props
 */
export function createTestComponent<P extends object>(
  Component: React.ComponentType<P>,
  defaultProps: Partial<P>
) {
  return (props: Partial<P>) => {
    const mergedProps = { ...defaultProps, ...props } as P;
    return <Component {...mergedProps} />;
  };
}
