import { Paper, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

export default function PreviewBanner() {
  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 3, 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText' 
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          Preview Mode
        </Typography>
        <Button
          component={Link}
          to="/register"
          variant="contained"
          color="secondary"
        >
          Sign up for full access
        </Button>
      </Box>
    </Paper>
  );
} 