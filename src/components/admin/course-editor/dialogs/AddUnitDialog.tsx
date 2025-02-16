import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress
} from '@mui/material';

interface AddUnitDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<boolean>;
  isSaving: boolean;
}

export const AddUnitDialog: React.FC<AddUnitDialogProps> = ({
  open,
  onClose,
  onAdd,
  isSaving
}) => {
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    if (await onAdd(name)) {
      setName('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Unit</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Unit Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && name.trim()) {
              handleSubmit();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaving || !name.trim()}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};
