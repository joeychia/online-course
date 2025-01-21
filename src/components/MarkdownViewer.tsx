import { Viewer } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import { Box } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer = ({ content }: MarkdownViewerProps) => {
  const { isDarkMode } = useTheme();

  return (
    <Box sx={{ 
      '& .toastui-editor-contents': {
        color: theme => theme.palette.text.secondary,
        fontSize: '0.875rem',
      }
    }}>
      <Viewer 
        initialValue={content} 
        theme={isDarkMode ? 'dark' : 'light'}
      />
    </Box>
  );
};

export default MarkdownViewer; 