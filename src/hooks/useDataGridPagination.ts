import { useState, useCallback } from 'react';
import { GridPaginationModel } from '@mui/x-data-grid';

/**
 * Custom hook for managing DataGrid pagination state
 * @param initialPage - Initial page index (default: 0)
 * @param initialPageSize - Initial page size (default: 10)
 * @returns Pagination model and handler for pagination changes
 */
export function useDataGridPagination(initialPage = 0, initialPageSize = 10) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: initialPage,
    pageSize: initialPageSize,
  });

  const handlePaginationModelChange = useCallback((newModel: GridPaginationModel) => {
    setPaginationModel(newModel);
  }, []);

  return {
    paginationModel,
    handlePaginationModelChange,
  };
}
