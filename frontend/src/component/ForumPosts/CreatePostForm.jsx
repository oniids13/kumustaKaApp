import { useState, useRef } from "react";
import TextEditor from "./TextEditor";
import axios from "axios";

const CreatePostForm = ({ onPostCreated }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef();

  const user = JSON.parse(localStorage.getItem("userData"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      images.forEach((image) => formData.append("images", image));

      const response = await axios.post(
        "http://localhost:3000/api/forum/newPost",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      onPostCreated(response.data);
      setTitle("");
      setContent("");
      setImages([]);
      alert("Your post is pending for approval.");
    } catch (error) {
      console.error("Error creating post:", error);
      alert(error.response?.data?.error || "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-form">
      <h3>Create New Post</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="form-control mb-3"
        />

        <TextEditor content={content} onUpdate={setContent} />

        <div className="image-upload my-3">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            onChange={(e) => setImages([...e.target.files])}
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="btn btn-sm btn-outline-secondary me-2"
          >
            Add Images ({images.length})
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-success"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>

        {images.length > 0 && (
          <div className="image-previews mt-3">
            {images.map((file, index) => (
              <img
                key={index}
                src={URL.createObjectURL(file)}
                alt={`Preview ${index}`}
                className="img-thumbnail me-2 mb-2"
                style={{ maxHeight: "100px" }}
              />
            ))}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePostForm;
