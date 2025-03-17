import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Divider,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import { CourseSettings } from './CourseSettings';
import { Course } from '../../../../types';

interface CourseHeaderProps {
  course: Course | null;
  isLoading: boolean;
  onAddUnit: () => void;
  isSaving: boolean;
  onUpdateSettings: (settings: Course['settings']) => Promise<boolean>;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => Promise<void>;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({
  course,
  isLoading,
  onAddUnit,
  isSaving,
  onUpdateSettings,
  onEditCourse,
  onDeleteCourse
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <Box>
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={2} justifyContent="space-between">
            <Typography variant="h4" sx={{ fontWeight: 500 }}>
              {course?.name || (isLoading ? 'Loading...' : 'Course not found')}
            </Typography>
            {course && (
              <Box display="flex" gap={2}>
                <Button
                  startIcon={<PeopleIcon />}
                  variant="outlined"
                  onClick={() => navigate(`/admin/courses/${course.id}/students`)}
                  disabled={isSaving}
                >
                  View Students
                </Button>
                <Button
                  startIcon={<AssessmentIcon />}
                  variant="outlined"
                  onClick={() => navigate(`/admin/quiz/${course.id}`)}
                  disabled={isSaving}
                >
                  View Quiz Results
                </Button>
              </Box>
            )}
          </Box>
          <Divider />
        </Box>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <IconButton
              color="error"
              onClick={() => course && onDeleteCourse(course.id)}
              disabled={!course || isSaving}
              title="Delete Course"
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Box>
          <Box display="flex" gap={2}>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                onClick={() => course && onEditCourse(course)}
                disabled={!course || isSaving}
              >
                Edit Course
              </Button>
              <Button
                startIcon={<SettingsIcon />}
                variant="outlined"
                onClick={() => setIsSettingsOpen(true)}
                disabled={!course || isSaving}
              >
                Settings
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
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 1 }}>
              <IconButton
                onClick={() => course && onEditCourse(course)}
                disabled={!course || isSaving}
                title="Edit Course"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={() => setIsSettingsOpen(true)}
                disabled={!course || isSaving}
                title="Settings"
              >
                <SettingsIcon />
              </IconButton>
              <IconButton
                onClick={onAddUnit}
                disabled={isSaving}
                color="primary"
                title="Add Unit"
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
      {course && (
        <CourseSettings
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          course={course}
          onSave={onUpdateSettings}
          isSaving={isSaving}
        />
      )}
    </>
  );
};
