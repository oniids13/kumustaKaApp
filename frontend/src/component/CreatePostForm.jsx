import TextEditor from "../../component/TextEditor";
import { useState, useRef } from "react";
import axios from "axios";

const ForumPostForm = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [images, setImages] = useState([]);
  const fileInputRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    images.forEach((img) => formData.append("images", img));

    try {
      await axios.post("/api/forum/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setContent("");
      setTitle("");
      setImages([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="forum-post-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <TextEditor value={content} onChange={setContent} />

        <div className="image-preview">
          {images.map((img, i) => (
            <img key={i} src={URL.createObjectURL(img)} alt="Preview" />
          ))}
        </div>

        <button type="button" onClick={() => fileInputRef.current.click()}>
          Add Images
        </button>

        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          onChange={(e) => setImages([...e.target.files])}
          hidden
        />

        <button type="submit">Post</button>
      </form>
    </div>
  );
};

export default ForumPostForm;
