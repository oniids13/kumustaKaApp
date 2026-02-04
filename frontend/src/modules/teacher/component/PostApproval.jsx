import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Card, Typography, Space, message } from "antd";
import { CheckOutlined, DeleteOutlined } from "@ant-design/icons";
import { refreshNotifications } from "../../../utils/notificationUtils";

const { Title, Text } = Typography;

const PostApproval = () => {
  const [unpublishedPosts, setUnpublishedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("userData"));

  const fetchUnpublishedPosts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/forum/allPosts",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setUnpublishedPosts(response.data.unpublishedPosts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching unpublished posts:", error);
      message.error("Failed to fetch unpublished posts");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpublishedPosts();
  }, []);

  const handleApprove = async (postId) => {
    try {
      await axios.patch(
        `http://localhost:3000/api/forum/publishPost/${postId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      message.success("Post approved successfully");
      fetchUnpublishedPosts();
      // Refresh notification counts
      refreshNotifications();
    } catch (error) {
      console.error("Error approving post:", error);
      message.error("Failed to approve post");
    }
  };

  const handleDelete = async (postId) => {
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
      fetchUnpublishedPosts();
      // Refresh notification counts
      refreshNotifications();
    } catch (error) {
      console.error("Error deleting post:", error);
      message.error("Failed to delete post");
    }
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <div className="alert alert-info">
        <Title level={2}>Post Approval</Title>
      </div>
      {unpublishedPosts.length === 0 ? (
        <Text>No posts pending approval</Text>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }}>
          {unpublishedPosts.map((post) => {
            const author = post.author || {
              firstName: "Unknown",
              lastName: "User",
              avatar: "/default-avatar.png",
            };

            return (
              <Card key={post.id} style={{ marginBottom: "16px" }}>
                <div className="d-flex align-items-center mb-3">
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
                    <div className="d-flex align-items-center gap-2">
                      <small className="text-muted">
                        {formatDate(post.createdAt)}
                      </small>
                      {post.section && (
                        <span
                          className="badge"
                          style={{
                            fontSize: "10px",
                            backgroundColor: "#9b59b6",
                            color: "white",
                          }}
                        >
                          {post.section.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Title level={4}>{post.title}</Title>
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
                {post.images?.length > 0 && (
                  <div className="post-images mt-3">
                    {post.images.map((img, i) => (
                      <a
                        key={i}
                        href={typeof img === "string" ? img : img?.url}
                        target="_blank"
                        rel="noopener noreferrer"
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
                <div style={{ marginTop: "16px" }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => handleApprove(post.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(post.id)}
                    >
                      Delete
                    </Button>
                  </Space>
                </div>
              </Card>
            );
          })}
        </Space>
      )}
    </div>
  );
};

export default PostApproval;
