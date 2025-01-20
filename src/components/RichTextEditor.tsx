import { useRef, useEffect } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { useTheme } from '../contexts/ThemeContext';
import { Box } from '@mui/material';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) => {
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
    <Box className="border rounded-lg overflow-hidden" sx={{ 
      '& .toastui-editor-defaultUI': {
        backgroundColor: theme => theme.palette.background.paper,
        border: theme => `1px solid ${theme.palette.divider}`,
      },
      '& .toastui-editor-toolbar': {
        backgroundColor: theme => theme.palette.background.paper,
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
      },
      '& .toastui-editor-defaultUI-toolbar': {
        backgroundColor: theme => theme.palette.background.paper,
      },
      '& .toastui-editor-main': {
        color: theme => theme.palette.text.primary,
      },
      '& .toastui-editor-md-container': {
        backgroundColor: theme => theme.palette.background.paper,
      },
      '& .toastui-editor-ww-container': {
        backgroundColor: theme => theme.palette.background.paper,
      }
    }}>
      <Editor
        ref={editorRef}
        initialValue={value}
        placeholder={placeholder}
        previewStyle="vertical"
        height="400px"
        initialEditType="wysiwyg"
        useCommandShortcut={true}
        onChange={handleChange}
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          ['scrollSync'],
        ]}
        theme={isDarkMode ? 'dark' : 'light'}
        autofocus={false}
        hideModeSwitch={true}
      />
    </Box>
  );
};

export default RichTextEditor; 