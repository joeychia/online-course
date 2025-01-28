import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

interface AddLessonDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  lessonName: string;
  onLessonNameChange: (name: string) => void;
}

export const AddLessonDialog: React.FC<AddLessonDialogProps> = ({
  open,
  onClose,
  onAdd,
  lessonName,
  onLessonNameChange,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Lesson</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Lesson Name"
          fullWidth
          value={lessonName}
          onChange={(e) => onLessonNameChange(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onAdd} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};
