import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";

// Student module components
import SidePanel from "./component/SidePanel";
import Journal from "./component/Journal";
import MoodTracker from "./component/MoodTracker";
import ResourceLibrary from "./component/ResourceLibrary";
import PrivacyConsentSection from "./component/ConsentSection";
import EmergencyContact from "./component/EmergencyContact";
import Quiz from "./component/Quiz";

// Forum Post Components
import CreatePostForm from "../../component/ForumPosts/CreatePostForm";
import PostList from "../../component/ForumPosts/PostList";

// CSS for student module
import "./styles/StudentModule.css";

const StudentDashboard = () => {
  const user = JSON.parse(localStorage.getItem("userData"));
  const [refreshPosts, setRefreshPosts] = useState(false);
  const [activeModule, setActiveModule] = useState("forum");

  const [quote, setQuote] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const handlePostCreated = () => {
    setRefreshPosts((prev) => !prev);
  };

  const renderMainContent = () => {
    switch (activeModule) {
      case "journal":
        return <Journal />;
      case "moodtracker":
        return <MoodTracker />;
      case "quiz":
        return <Quiz />;
      case "resources":
        return <ResourceLibrary />;
      case "consent":
        return <PrivacyConsentSection />;
      case "emergency":
        return <EmergencyContact />;
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

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const token = localStorage.getItem("token"); // Replace with your token key
        const response = await axios.get("http://localhost:3000/api/quotes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setQuote(response.data[0]); // Assuming response is an array from ZenQuotes
        setShowQuoteModal(true);
      } catch (error) {
        console.error("Failed to fetch quote:", error);
      }
    };

    fetchQuote();
  }, []);

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
      {/* Quote Modal */}
      <Modal
        show={showQuoteModal}
        onHide={() => setShowQuoteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>✨ Daily Motivation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {quote ? (
            <>
              <p className="fs-5 fst-italic">"{quote.q}"</p>
              <p className="text-end fw-bold">- {quote.a}</p>
            </>
          ) : (
            <p>Loading quote...</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowQuoteModal(false)}>
            Let's Start the Day!
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
