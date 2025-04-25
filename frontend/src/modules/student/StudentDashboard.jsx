import { useState } from "react";
import CreatePostForm from "../../component/ForumPosts/CreatePostForm";
import PostList from "../../component/ForumPosts/PostList";
import SidePanel from "./component/SidePanel";
import Journal from "./component/Journal";

import "../../styles/StudentModule.css";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [refreshPosts, setRefreshPosts] = useState(false);
  const [activeModule, setActiveModule] = useState("forum");

  const handlePostCreated = () => {
    setRefreshPosts((prev) => !prev);
  };

  const renderMainContent = () => {
    switch (activeModule) {
      case "journal":
        return <Journal />;
      case "forum":
      default:
        return (
          <>
            <CreatePostForm onPostCreated={handlePostCreated} />
            <PostList key={refreshPosts} />
          </>
        );
    }
  };

  return (
    <div className="student-dashboard container">
      <div className="row">
        <div className="col-lg-3 side-panel-container">
          <SidePanel
            user={user}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
          />
        </div>

        <div className="col-lg-9">
          <div className="main-content-container">{renderMainContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
