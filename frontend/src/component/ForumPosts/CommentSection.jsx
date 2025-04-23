import { useState } from "react";
import axios from "axios";

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const user = JSON.parse(localStorage.getItem("userData"));

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/forum/posts/${postId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `/api/forum/posts/${postId}/comments`,
        { content: newComment },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  return (
    <div className="comment-section">
      <form onSubmit={handleSubmit} className="mb-3">
        <div className="input-group">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="form-control"
            required
          />
          <button className="btn btn-primary" type="submit">
            Comment
          </button>
        </div>
      </form>

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment mb-2">
            <div className="d-flex">
              <img
                src={comment.author.avatar || "/default-avatar.png"}
                alt={`${comment.author.firstName}'s avatar`}
                className="rounded-circle me-2"
                style={{ width: "32px", height: "32px", objectFit: "cover" }}
              />
              <div>
                <div className="comment-content bg-light p-2 rounded">
                  <strong>
                    {comment.author.firstName} {comment.author.lastName}
                  </strong>
                  <p className="mb-0">{comment.content}</p>
                </div>
                <small className="text-muted">
                  {new Date(comment.createdAt).toLocaleString()}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
