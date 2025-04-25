import { useState, useEffect } from "react";
import axios from "axios";
import CommentSection from "./CommentSection";
import EditPostForm from "./EditPostForm";

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = JSON.parse(localStorage.getItem("userData")) || {};

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/forum/allPosts",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Ensure all posts have author data
      const validatedPosts = (response.data.publishedPosts || []).map(
        (post) => ({
          ...post,
          author: post.author || {
            firstName: "Unknown",
            lastName: "User",
            avatar: "/default-avatar.png",
          },
        })
      );

      setPosts(validatedPosts);
      setError(null);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleUpdate = async (updatedPost) => {
    try {
      const formData = new FormData();
      formData.append("title", updatedPost.title);
      formData.append("content", updatedPost.content);

      // Handle images if they exist
      if (updatedPost.images) {
        if (Array.isArray(updatedPost.images)) {
          updatedPost.images.forEach((img) => {
            if (img instanceof File) {
              formData.append(`images`, img);
            } else if (typeof img === "string") {
              formData.append(`existingImages`, img);
            }
          });
        }
      }

      const response = await axios.put(
        `http://localhost:3000/api/forum/editPost/${updatedPost.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setPosts(
        posts.map((post) =>
          post.id === response.data.id
            ? {
                ...response.data,
                author: response.data.author || post.author,
              }
            : post
        )
      );
      setEditingPostId(null);
    } catch (error) {
      console.error("Error updating post:", error);
      setError("Failed to update post. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await axios.delete(
        `http://localhost:3000/api/forum/deletePost/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setPosts([]);
      setLoading(true);
      await fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  if (loading) return <div className="text-center my-4">Loading posts...</div>;
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }
  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <div className="alert alert-info">
          No posts yet. Be the first to share!
        </div>
      ) : (
        posts.map((post) => {
          const author = post.author || {
            firstName: "Unknown",
            lastName: "User",
            avatar: "/default-avatar.png",
          };

          return (
            <div key={post.id} className="card mb-4">
              <div className="card-header bg-white">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <img
                      src={author.avatar}
                      alt={`${author.firstName}'s avatar`}
                      className="rounded-circle me-2"
                      style={{
                        width: "40px",
                        height: "40px",
                        objectFit: "cover",
                      }}
                    />
                    <div>
                      <h6 className="mb-0">
                        {author.firstName} {author.lastName}
                      </h6>
                      <small className="text-muted">
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </small>
                    </div>
                  </div>

                  {user?.userId === post.authorId && !editingPostId && (
                    <div className="d-flex">
                      <button
                        onClick={() => setEditingPostId(post.id)}
                        className="btn btn-sm btn-outline-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="btn btn-sm btn-outline-danger"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-body">
                {editingPostId === post.id ? (
                  <EditPostForm
                    post={post}
                    onUpdate={handleUpdate}
                    onCancel={handleCancelEdit}
                  />
                ) : (
                  <>
                    <h5 className="card-title">{post.title}</h5>
                    <div
                      className="card-text"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                    {post.images?.length > 0 && (
                      <div className="post-images mt-3">
                        {post.images.map((img, i) => (
                          <a
                            key={i}
                            href={typeof img === "string" ? img : img?.url}
                            target="_blank"
                          >
                            <img
                              src={typeof img === "string" ? img : img?.url}
                              alt={`Post ${i}`}
                              className="img-fluid me-2 mb-2"
                              style={{ maxHeight: "200px" }}
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {editingPostId !== post.id && (
                <div className="card-footer bg-white">
                  <CommentSection postId={post.id} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default PostList;
