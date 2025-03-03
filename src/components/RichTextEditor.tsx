import { useRef, useEffect } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { useTheme } from '../contexts/ThemeContext';
import { Box } from '@mui/material';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  enableMarkdown?: boolean;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Start writing...', enableMarkdown = true }: RichTextEditorProps) => {
  const editorRef = useRef<Editor>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Update editor content when value prop changes
    const instance = editorRef.current?.getInstance();
    if (instance && instance.getMarkdown() !== value) {
      instance.setMarkdown(value);
    }
  }, [value]);

  const handleChange = () => {
    const instance = editorRef.current?.getInstance();
    if (instance) {
      onChange(instance.getMarkdown());
    }
  };

  return (
    <Box sx={{
      '& .toastui-editor-defaultUI button': {
        backgroundColor: '#f7f9fc',
      },
      '& .toastui-editor-defaultUI': {
        backgroundColor: theme => theme.palette.background.paper,
        border: theme => `1px solid ${theme.palette.divider}`,
      },
      '& .toastui-editor-toolbar': {
        backgroundColor: theme => theme.palette.background.paper,
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
      },
      '& .toastui-editor-defaultUI-toolbar, .toastui-editor-popup-add-heading': {
        backgroundColor: theme => theme.palette.background.paper,
      },
      '& .toastui-editor-popup-add-heading': {
        marginLeft: 0
      },
      '& .toastui-editor-main': {
        color: theme => theme.palette.text.primary,
      },
      '& .toastui-editor-contents': {
        color: theme => theme.palette.text.primary,
        '& h1, & h2, & h3, & h4, & h5, & h6, & p': {
          color: theme => theme.palette.text.primary,
        },
        fontFamily: theme => theme.typography.fontFamily,
      },
      '& .toastui-editor-main-container .ProseMirror': {
        color: theme => theme.palette.text.primary,
      },
      '& .toastui-editor-ww-container': {
        backgroundColor: theme => theme.palette.background.paper,
      },
      }
    }>
      <Editor
        ref={editorRef}
        initialValue={value}
        placeholder={placeholder}
        previewStyle="vertical"
        height="400px"
        initialEditType="wysiwyg"
        onChange={handleChange}
        toolbarItems={[
          ['heading', 'bold'],
          ['ul', 'ol', 'task'],
          ['link'],
        ]}
        theme={isDarkMode ? 'dark' : 'light'}
        autofocus={false}
        hideModeSwitch={!enableMarkdown}
      />
    </Box>
  );
};

export default RichTextEditor;