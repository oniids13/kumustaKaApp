import { useState, useEffect } from "react";
import axios from "axios";
import CommentSection from "./CommentSection";
import EditPostForm from "./EditPostForm";

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    const fetchPosts = async () => {
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
        setPosts(response.data.publishedPosts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleUpdate = async (updatedPost) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/forum/editPost/${updatedPost.id}`,
        updatedPost,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setPosts(
        posts.map((post) =>
          post.id === response.data.id ? response.data : post
        )
      );
      setEditingPostId(null);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
  };

  if (loading) return <div className="text-center my-4">Loading posts...</div>;

  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <div className="alert alert-info">
          No posts yet. Be the first to share!
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card mb-4">
            <div className="card-header bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <img
                    src={post.author.avatar || "/default-avatar.png"}
                    alt={`${post.author.firstName}'s avatar`}
                    className="rounded-circle me-2"
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <h6 className="mb-0">
                      {post.author.firstName} {post.author.lastName}
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
                {user.id === post.authorId && !editingPostId && (
                  <button
                    onClick={() => setEditingPostId(post.id)}
                    className="btn btn-sm btn-outline-primary"
                  >
                    Edit
                  </button>
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
                        <img
                          key={i}
                          src={img.url || img}
                          alt={`Post ${i}`}
                          className="img-fluid me-2 mb-2"
                          style={{ maxHeight: "200px" }}
                        />
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
        ))
      )}
    </div>
  );
};

export default PostList;
