import React from 'react';
import {
  Box,
  Typography,
  Button,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Course } from '../../../../types';

interface CourseHeaderProps {
  course: Course | null;
  isLoading: boolean;
  onAddUnit: () => void;
  onToggleExpandAll: () => void;
  isSaving: boolean;
  isAllExpanded: boolean;
  hasUnits: boolean;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({
  course,
  isLoading,
  onAddUnit,
  onToggleExpandAll,
  isSaving,
  isAllExpanded,
  hasUnits
}) => {
  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 500, mb: 2 }}>
          {course?.name || (isLoading ? 'Loading...' : 'Course not found')}
        </Typography>
        <Divider />
      </Box>
      
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={onToggleExpandAll}
            disabled={!hasUnits}
          >
            {isAllExpanded ? 'Collapse All' : 'Expand All'}
          </Button>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={onAddUnit}
            disabled={isSaving}
          >
            Add Unit
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
