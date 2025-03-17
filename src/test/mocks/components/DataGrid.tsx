
/**
 * Mock implementation of MUI DataGrid component for testing
 * Renders a simplified version of the grid with rows
 */
export const MockDataGrid = ({ rows, ...props }: any) => (
  <div data-testid="data-grid" {...props}>
    {rows && rows.length > 0 && rows.map((row: any) => (
      <div key={row.id} data-testid="student-row">
        <span>{row.name}</span>
        <span>{row.email}</span>
        <span>{row.completedLessons}</span>
      </div>
    ))}
  </div>
);

/**
 * Mock implementation of MUI GridPaginationModel
 * Used for type compatibility in tests
 */
export const MockGridPaginationModel = {};
