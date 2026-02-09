import { useState, useEffect } from "react";
import axios from "axios";
import CommentSection from "./CommentSection";
import EditPostForm from "./EditPostForm";
import SparkButton from "../SparkButton";
import { message } from "antd";

const PostList = ({ sectionId }) => {
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reactingPostId, setReactingPostId] = useState(null);
  const [noSectionAssigned, setNoSectionAssigned] = useState(false);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  const fetchPosts = async () => {
    setLoading(true);
    setNoSectionAssigned(false);
    try {
      const params = {};
      if (sectionId) {
        params.sectionId = sectionId;
      }

      const response = await axios.get(
        "http://localhost:3000/api/forum/allPosts",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          params,
        }
      );

      // Check if user needs to be assigned to a section
      if (response.data.message && response.data.message.includes("section")) {
        setNoSectionAssigned(true);
        setPosts([]);
        return;
      }

      const validatedPosts = response.data.publishedPosts.map((post) => ({
        ...post,
        author: post.author || {
          firstName: "Unknown",
          lastName: "User",
          avatar: "/default-avatar.png",
        },
        sparkCount: post.reactions?.length || 0,
        isSparked:
          post.reactions?.some(
            (r) =>
              (r.studentId === user.userId && user.role === "STUDENT") ||
              (r.teacherId === user.userId && user.role === "TEACHER")
          ) || false,
      }));

      setPosts(validatedPosts);
    } catch (error) {
      console.error("Fetch error:", error);
      // Check if error is about section assignment
      if (error.response?.data?.message?.includes("section")) {
        setNoSectionAssigned(true);
        setPosts([]);
      } else {
        setError("Failed to load posts");
      }
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
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axios.delete(
          `http://localhost:3000/api/forum/deletePost/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        message.success("Post deleted successfully");
        setPosts(posts.filter((post) => post.id !== postId));
      } catch (error) {
        console.error("Error deleting post:", error);
        message.error("Failed to delete post");
      }
    }
  };

  const handleSpark = async (postId) => {
    if (reactingPostId) return;
    setReactingPostId(postId);

    try {
      const { data } = await axios.post(
        `http://localhost:3000/api/forum/reaction/${postId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                sparkCount: data.sparkCount,
                isSparked: data.isSparkedByCurrentUser,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Reaction error:", error);
      alert(error.response?.data?.message || "Failed to update reaction");
    } finally {
      setReactingPostId(null);
    }
  };

  if (loading) return <div className="text-center my-4">Loading posts...</div>;
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Show message if user isn't assigned to a section
  if (noSectionAssigned) {
    return (
      <div className="alert alert-warning">
        <h5 className="alert-heading">
          <i className="fas fa-exclamation-triangle me-2"></i>
          No Section Assigned
        </h5>
        <p className="mb-0">
          You need to be assigned to a class section to view and create posts.
          Please contact your teacher or administrator for your section code.
        </p>
      </div>
    );
  }

  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <div className="alert alert-info">
          No posts yet in your section. Be the first to share!
        </div>
      ) : (
        posts.map((post) => {
          const author = post.author || {
            firstName: "Unknown",
            lastName: "User",
            avatar: "/default-avatar.png",
          };

          const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleString("en-PH", {
              timeZone: "Asia/Manila",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          };

          const canDeletePost =
            user.role === "TEACHER" || user.userId === post.authorId;

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
                    <div className="text-start">
                      <h6 className="mb-0">
                        {author.firstName} {author.lastName}
                        {post.author?.role === "TEACHER" && (
                          <span
                            className="badge bg-success ms-2"
                            style={{ fontSize: "10px" }}
                          >
                            Teacher
                          </span>
                        )}
                      </h6>
                      <div className="d-flex align-items-center gap-2">
                        <small className="text-muted">
                          {formatDate(post.createdAt)}
                        </small>
                        {post.section && (
                          <span
                            className="badge bg-purple"
                            style={{
                              fontSize: "10px",
                              backgroundColor: "#9b59b6",
                            }}
                          >
                            {post.section.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canDeletePost && !editingPostId && (
                    <div className="d-flex gap-3">
                      {user.userId === post.authorId && (
                        <button
                          onClick={() => setEditingPostId(post.id)}
                          className="btn btn-sm btn-primary"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleDeletePost(post.id);
                        }}
                        className="btn btn-sm btn-danger"
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

              <div className="border border-top">
                <SparkButton
                  initialCount={post.sparkCount || 0}
                  isSparked={post.isSparked}
                  onSpark={() => handleSpark(post.id)}
                  disabled={
                    reactingPostId === post.id ||
                    !["STUDENT", "TEACHER"].includes(user.role)
                  }
                />
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
