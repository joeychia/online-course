import { Viewer } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import { Box } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useFontSize } from '../contexts/FontSizeContext';

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer = ({ content }: MarkdownViewerProps) => {
  const { isDarkMode } = useTheme();
  const { fontSize } = useFontSize();
  return (
    <Box sx={{
      '& .toastui-editor-contents': {
        color: theme => theme.palette.text.primary,
        fontFamily: theme => theme.typography.fontFamily,
        fontSize: fontSize,
        '& p': {
          color: theme => theme.palette.text.primary,
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          color: theme => theme.palette.text.primary,
          lineHeight: 1.2,
        },
        '& a': {
          color: theme => theme.palette.primary.main,
        },
        '& blockquote': {
          borderLeft: theme => `4px solid ${theme.palette.divider}`,
          color: theme => theme.palette.text.secondary,
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        },
        '& code': {
          color: theme => theme.palette.mode === 'dark' ? '#e6e6e6' : '#333',
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        '& pre': {
          backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        '& table': {
          borderColor: theme => theme.palette.divider,
        },
        '& th, & td': {
          borderColor: theme => theme.palette.divider,
        },
        '& hr': {
          borderColor: theme => theme.palette.divider,
        },
      }
    }}>
      <Viewer 
        initialValue={content} 
        theme={isDarkMode ? 'dark' : 'light'}
        linkAttributes={{
          target: '_blank',
          rel: 'noopener noreferrer'
        }}
      />
    </Box>
  );
};

export default MarkdownViewer;