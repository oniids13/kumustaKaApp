import { useState, useEffect } from "react";
import JournalEditor from "./JournalEditor";
import JournalNote from "./JournalNote";
import { FaStickyNote } from "react-icons/fa";
import "../styles/Journal.css";

const Journal = () => {
  const [journals, setJournals] = useState([]);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch journals from API
  const fetchJournals = async () => {
    try {
      const response = await fetch("/api/journals");
      const data = await response.json();
      setJournals(data);
    } catch (error) {
      console.error("Error fetching journals:", error);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  const handleSaveJournal = async (content) => {
    try {
      const response = await fetch("/api/journals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      const newJournal = await response.json();
      setJournals([newJournal, ...journals]);
    } catch (error) {
      console.error("Error saving journal:", error);
    }
  };

  const handleUpdateJournal = async (id, content) => {
    try {
      await fetch(`/api/journals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      setJournals(journals.map((j) => (j.id === id ? { ...j, content } : j)));
      setSelectedJournal(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating journal:", error);
    }
  };

  const handleDeleteJournal = async (id) => {
    try {
      await fetch(`/api/journals/${id}`, {
        method: "DELETE",
      });
      setJournals(journals.filter((j) => j.id !== id));
      if (selectedJournal?.id === id) {
        setSelectedJournal(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error deleting journal:", error);
    }
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

      <div className="journal-editor-section">
        <JournalEditor
          onSave={handleSaveJournal}
          initialContent={isEditing ? selectedJournal?.content : ""}
          onUpdate={
            isEditing
              ? (content) => handleUpdateJournal(selectedJournal.id, content)
              : null
          }
          isEditing={isEditing}
          onCancel={() => {
            setIsEditing(false);
            setSelectedJournal(null);
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
              onClick={() => {
                setSelectedJournal(journal);
                setIsEditing(false);
              }}
              onEdit={() => {
                setSelectedJournal(journal);
                setIsEditing(true);
              }}
              onDelete={() => handleDeleteJournal(journal.id)}
              isSelected={selectedJournal?.id === journal.id}
            />
          ))
        )}
      </div>

      {selectedJournal && !isEditing && (
        <div className="journal-detail-view">
          <div
            className="journal-detail-content"
            dangerouslySetInnerHTML={{ __html: selectedJournal.content }}
          />
          <div className="journal-detail-actions">
            <button
              className="btn btn-sm btn-primary me-2"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteJournal(selectedJournal.id)}
            >
              Delete
            </button>
            <button
              className="btn btn-sm btn-outline-secondary ms-auto"
              onClick={() => setSelectedJournal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
