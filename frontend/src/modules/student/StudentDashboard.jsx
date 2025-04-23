import { useState } from "react";
import CreatePostForm from "../../component/CreatePostForm";
import PostList from "../../component/PostList";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [refreshPosts, setRefreshPosts] = useState(false);

  const handlePostCreated = () => {
    setRefreshPosts((prev) => !prev); // Toggle to trigger useEffect in PostList
  };

  return (
    <div className="student-dashboard container mt-4">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3">
          <div className="profile-card p-3 mb-4 bg-white rounded shadow-sm">
            <img
              src={user.avatar || "/default-avatar.png"}
              alt={`${user.name}'s avatar`}
              className="rounded-circle mb-3"
              style={{ width: "80px", height: "80px", objectFit: "cover" }}
            />
            <h4>Hello, {user.name}!</h4>
            <p className="text-muted">Student Dashboard</p>
          </div>
          <div className="student-buttons">
            <button className="btn btn-primary mb-2 w-100">
              My Wellness Journal
            </button>
            <button className="btn btn-secondary mb-2 w-100">
              Mood Tracker
            </button>
            <button className="btn btn-success w-100">Resource Library</button>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          <CreatePostForm onPostCreated={handlePostCreated} />
          <PostList key={refreshPosts} />
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
