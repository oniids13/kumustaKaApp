import { useEffect, useState } from "react";
import axios from "axios";

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [loadingStates, setLoadingStates] = useState({
    post: false,
    edit: {},
    delete: {},
  });
  const user = JSON.parse(localStorage.getItem("userData"));

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/forum/allComments/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setComments(response.data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingStates((prev) => ({ ...prev, post: true }));

    try {
      await axios.post(
        `http://localhost:3000/api/forum/comment/${postId}`,
        { content: newComment },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setNewComment("");
      await fetchComments();
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, post: false }));
    }
  };

  const handleEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const handleUpdate = async (commentId) => {
    setLoadingStates((prev) => ({
      ...prev,
      edit: { ...prev.edit, [commentId]: true },
    }));

    try {
      await axios.patch(
        `http://localhost:3000/api/forum/editComment/${commentId}`,
        { content: editedContent },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setEditingCommentId(null);
      await fetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        edit: { ...prev.edit, [commentId]: false },
      }));
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    setLoadingStates((prev) => ({
      ...prev,
      delete: { ...prev.delete, [commentId]: true },
    }));

    try {
      await axios.delete(
        `http://localhost:3000/api/forum/deleteComment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      await fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        delete: { ...prev.delete, [commentId]: false },
      }));
    }
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditedContent("");
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
            disabled={loadingStates.post}
          />
          <button
            className="btn btn-success"
            type="submit"
            disabled={loadingStates.post}
          >
            {loadingStates.post ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Posting...
              </>
            ) : (
              "Comment"
            )}
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
              <div className="flex-grow-1">
                <div className="comment-content bg-light p-2 rounded">
                  <strong>
                    {comment.author.firstName} {comment.author.lastName}
                  </strong>

                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="form-control mb-2"
                        rows="3"
                        disabled={loadingStates.edit[comment.id]}
                      />
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => handleUpdate(comment.id)}
                          className="btn btn-sm btn-success"
                          disabled={loadingStates.edit[comment.id]}
                        >
                          {loadingStates.edit[comment.id] ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                              ></span>
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="btn btn-sm btn-secondary"
                          disabled={loadingStates.edit[comment.id]}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mb-0">{comment.content}</p>
                  )}
                </div>
                <small className="text-muted">
                  {new Date(comment.createdAt).toLocaleString()}
                </small>
              </div>

              {user && user.userId === comment.author.id && (
                <div className="d-flex align-items-center gap-2 ms-2">
                  <button
                    onClick={() => handleEdit(comment)}
                    className="btn btn-sm btn-outline-primary"
                    disabled={
                      loadingStates.edit[comment.id] ||
                      loadingStates.delete[comment.id]
                    }
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="btn btn-sm btn-outline-danger"
                    disabled={loadingStates.delete[comment.id]}
                  >
                    {loadingStates.delete[comment.id] ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
