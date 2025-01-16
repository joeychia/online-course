import { useRef, useEffect } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) => {
  const editorRef = useRef<Editor>(null);

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
    <div className="border rounded-lg overflow-hidden">
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
        theme="light"
        autofocus={false}
        hideModeSwitch={true}
      />
    </div>
  );
};

export default RichTextEditor; 