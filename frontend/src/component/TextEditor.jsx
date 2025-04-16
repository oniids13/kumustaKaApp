import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

const RichTextEditor = ({ content, onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Share your thoughts...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: content || "",
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
  });

  // Update content if prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={`rich-text-editor ${!editable ? "read-only" : ""}`}>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
