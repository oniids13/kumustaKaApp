import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
} from "react-icons/fa";

const JournalEditor = ({
  onSave,
  initialContent = "",
  onUpdate,
  isEditing,
  onCancel,
  autoFocus = false,
}) => {
  const editorRef = useRef(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        image: false,
        // Other configurations
        heading: false, // Disable headings if you don't need them
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Write your thoughts...",
      }),
    ],
    content: initialContent,
  });

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (autoFocus && editor) {
      setTimeout(() => {
        editor.commands.focus("end");
        editorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [autoFocus, editor]);

  const handleSubmit = () => {
    if (editor) {
      const content = editor.getHTML();
      if (content.trim() !== "<p></p>") {
        // Basic empty content check
        if (isEditing && onUpdate) {
          onUpdate(content);
        } else {
          onSave(content);
          editor.commands.clearContent();
        }
      }
    }
  };

  return (
    <div ref={editorRef} className="text-editor-container">
      <div className="journal-editor">
        <div className="editor-toolbar">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`bold ${editor.isActive("bold") ? "active" : ""}`}
            title="Bold"
          >
            <FaBold />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`italic ${editor.isActive("italic") ? "active" : ""}`}
            title="Italic"
          >
            <FaItalic />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`underline ${
              editor.isActive("underline") ? "active" : ""
            }`}
            title="Underline"
          >
            <FaUnderline />
          </button>
          <span className="divider"></span>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "active" : ""}
            title="Bullet List"
          >
            <FaListUl />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "active" : ""}
            title="Numbered List"
          >
            <FaListOl />
          </button>
        </div>
        <EditorContent editor={editor} className="editor-content" />
        <div className="editor-actions">
          <button onClick={handleSubmit} className="save-btn">
            {isEditing ? "Update Journal" : "Save Journal"}
          </button>
          {isEditing && (
            <button onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalEditor;
