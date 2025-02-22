import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { Course } from '../../../../types';

interface CourseSettingsProps {
  open: boolean;
  onClose: () => void;
  course: Course;
  onSave: (settings: Course['settings']) => Promise<boolean>;
  isSaving?: boolean;
}

export const CourseSettings: React.FC<CourseSettingsProps> = ({
  open,
  onClose,
  course,
  onSave,
  isSaving = false
}) => {
  const [settings, setSettings] = useState<Course['settings']>({
    unlockLessonIndex: course.settings.unlockLessonIndex,
    token: course.settings.token || '',
    enableNote: course.settings.enableNote || false
  });
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      // Validate unlockLessonIndex is a non-negative number
      if (settings.unlockLessonIndex < 0) {
        setError('Unlock lesson index must be a non-negative number');
        return;
      }

      const success = await onSave(settings);
      if (success) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Course Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Unlock Lesson Index
            </Typography>
            <TextField
              type="number"
              value={settings.unlockLessonIndex}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                unlockLessonIndex: parseInt(e.target.value) || 0
              }))}
              fullWidth
              size="small"
              inputProps={{ min: 0 }}
              helperText="Number of lessons to unlock initially (0 or greater)"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Access Token
            </Typography>
            <TextField
              value={settings.token || ''}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                token: e.target.value
              }))}
              fullWidth
              size="small"
              helperText="Optional: Required token to access the course"
            />
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableNote || false}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    enableNote: e.target.checked
                  }))}
                />
              }
              label="Enable Notes"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
