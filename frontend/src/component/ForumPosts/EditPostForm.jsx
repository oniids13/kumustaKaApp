import { useState, useRef } from "react";
import TextEditor from "./TextEditor";

const EditPostForm = ({ post, onUpdate, onCancel }) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [images, setImages] = useState(post.images || []);
  const fileInputRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...post,
      title,
      content,
      images,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      file, // Store the actual file for upload
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <TextEditor content={content} onUpdate={setContent} />
      </div>

      <div className="mb-3">
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleImageChange}
          style={{ display: "none" }}
          accept="image/*"
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary me-2"
          onClick={() => fileInputRef.current.click()}
        >
          Add Images
        </button>
      </div>

      {images.length > 0 && (
        <div className="mb-3 d-flex flex-wrap gap-2">
          {images.map((img, index) => (
            <div key={index} className="position-relative">
              <img
                src={img.url}
                alt={`Preview ${index}`}
                className="img-thumbnail"
                style={{ height: "100px" }}
              />
              <button
                type="button"
                className="btn btn-danger btn-sm position-absolute top-0 end-0"
                onClick={() => removeImage(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default EditPostForm;
