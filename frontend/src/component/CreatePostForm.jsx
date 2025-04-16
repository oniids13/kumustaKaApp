// src/components/CreatePostForm.jsx
import { useState } from "react";
import RichTextEditor from "./RichTextEditor";

const CreatePostForm = ({ onSubmit }) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, content });
    setContent("");
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      <button type="submit" className="btn btn-primary">
        Create Post
      </button>
    </form>
  );
};

export default CreatePostForm;
