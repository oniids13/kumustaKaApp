import { useState, useEffect, useRef } from "react";
import JournalEditor from "./JournalEditor";
import JournalNote from "./JournalNote";
import { FaStickyNote, FaTimes } from "react-icons/fa";
import "../styles/Journal.css";
import axios from "axios";

const Journal = () => {
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const editorSectionRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("userData"));

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchJournals = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/journal/allJournal",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setJournals(response.data);
    } catch (error) {
      console.error("Error fetching journals:", error);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleSaveJournal = async (content) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/journal/newJournal",
        { content },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setJournals([response.data, ...journals]);
    } catch (error) {
      console.error("Error saving journal:", error);
    }
  };

  const handleUpdateJournal = async (id, content) => {
    try {
      await axios.patch(
        `http://localhost:3000/api/journal/editJournal/${id}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setJournals(journals.map((j) => (j.id === id ? { ...j, content } : j)));
      setSelectedJournal(null);
      setIsEditing(false);
      setShowModal(false);
    } catch (error) {
      console.error("Error updating journal:", error);
    }
  };

  const handleDeleteJournal = async (id) => {
    try {
      if (!window.confirm("Are you sure you want to delete this Journal?"))
        return;

      await axios.delete(
        `http://localhost:3000/api/journal/deleteJournal/${id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setJournals(journals.filter((j) => j.id !== id));
      if (selectedJournal?.id === id) {
        setSelectedJournal(null);
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error deleting journal:", error);
    }
  };

  const openJournalModal = (journal) => {
    setSelectedJournal(journal);
    setShowModal(true);
    setIsEditing(false);
  };

  const scrollToEditor = () => {
    const editorSection = document.querySelector(".journal-editor-section");
    if (editorSection) {
      const headerHeight = document.querySelector("header")?.offsetHeight || 80;
      window.scrollTo({
        top: editorSection.offsetTop - headerHeight - 20,
        behavior: "smooth",
      });
    }
  };

  const handleEditJournal = (journal) => {
    setSelectedJournal(journal);
    setIsEditing(true);
    setShowModal(false);
    setEditorKey((prev) => prev + 1);

    // Scroll to editor section after state updates
    setTimeout(scrollToEditor, 100);
  };

  return (
    <div className="journal-container">
      <div className="journal-header">
        <h2>
          <FaStickyNote className="me-2" />
          My Journal
        </h2>
        <p>Reflect on your thoughts and feelings in a private space</p>
      </div>

      <div className="journal-editor-section" ref={editorSectionRef}>
        <JournalEditor
          key={
            isEditing
              ? `edit-${selectedJournal?.id}-${editorKey}`
              : `create-${editorKey}`
          }
          onSave={handleSaveJournal}
          initialContent={isEditing ? selectedJournal?.content : ""}
          onUpdate={
            isEditing
              ? (content) => handleUpdateJournal(selectedJournal.id, content)
              : null
          }
          isEditing={isEditing}
          autoFocus={isEditing}
          onCancel={() => {
            setIsEditing(false);
            setSelectedJournal(null);
            setEditorKey((prev) => prev + 1);
          }}
        />
      </div>

      <div className="journal-notes-grid">
        {journals.length === 0 ? (
          <div className="empty-state">
            <FaStickyNote size={48} className="mb-3" />
            <h4>No journal entries yet</h4>
            <p>Start by writing your first reflection above</p>
          </div>
        ) : (
          journals.map((journal) => (
            <JournalNote
              key={journal.id}
              journal={journal}
              onClick={() => openJournalModal(journal)}
              onEdit={() => handleEditJournal(journal)}
              onDelete={() => handleDeleteJournal(journal.id)}
              isSelected={selectedJournal?.id === journal.id}
            />
          ))
        )}
      </div>

      {showModal && selectedJournal && (
        <div className="journal-modal">
          <div className="journal-modal-content">
            <button
              className="journal-modal-close"
              onClick={() => setShowModal(false)}
            >
              <FaTimes />
            </button>
            <div className="journal-modal-header">
              <h3>
                {new Date(selectedJournal.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </h3>
              {selectedJournal.updatedAt && (
                <small>
                  Updated at: {formatDate(selectedJournal.updatedAt)}
                </small>
              )}
            </div>
            <div
              className="journal-modal-body"
              dangerouslySetInnerHTML={{ __html: selectedJournal.content }}
            />
            <div className="journal-modal-footer">
              <button
                className="btn btn-primary me-2"
                onClick={() => handleEditJournal(selectedJournal)}
              >
                Edit
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={() => {
                  handleDeleteJournal(selectedJournal.id);
                  setShowModal(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
