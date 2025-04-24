import { useState, useRef } from "react";
import TextEditor from "./TextEditor";
import axios from "axios";

const EditPostForm = ({ post, onUpdate, onCancel }) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [currentImages, setCurrentImages] = useState(
    Array.isArray(post?.images) ? post.images : []
  );
  const [newImages, setNewImages] = useState([]);
  const [deletedImages, setDeletedImages] = useState([]);
  const fileInputRef = useRef();

  const user = JSON.parse(localStorage.getItem("userData"));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("deletedImages", JSON.stringify(deletedImages));

    newImages.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await axios.put(
        `http://localhost:3000/api/forum/editPost/${post.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      onUpdate(response.data);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post. Please try again.");
    }
  };

  const handleImageDelete = (index) => {
    const isCurrentImage = index < currentImages.length;

    if (isCurrentImage) {
      const img = currentImages[index];
      const publicId = typeof img === "string" ? img : img.publicId;
      setDeletedImages([...deletedImages, publicId]);
      setCurrentImages(currentImages.filter((_, i) => i !== index));
    } else {
      setNewImages(
        newImages.filter((_, i) => i !== index - currentImages.length)
      );
    }
  };

  const handleNewImages = (e) => {
    setNewImages([...newImages, ...Array.from(e.target.files)]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="form-control mb-3"
      />

      <TextEditor content={content} onUpdate={setContent} />

      {/* Image display */}
      <div className="image-grid">
        {(currentImages || []).concat(newImages || []).map((img, index) => {
          const src =
            typeof img === "string" ? img : img.url || URL.createObjectURL(img);
          return (
            <div key={index} className="image-preview">
              <img src={src} alt={`Preview ${index}`} />
              <button type="button" onClick={() => handleImageDelete(index)}>
                Delete
              </button>
            </div>
          );
        })}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        onChange={handleNewImages}
        style={{ display: "none" }}
      />
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={() => fileInputRef.current.click()}
      >
        Add Images
      </button>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-sm btn-success">
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default EditPostForm;
