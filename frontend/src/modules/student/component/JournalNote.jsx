import { FaStickyNote } from "react-icons/fa";

const JournalNote = ({ journal, onClick, onEdit, onDelete, isSelected }) => {
  const previewText =
    journal.content.replace(/<[^>]*>/g, "").substring(0, 100) + "...";

  return (
    <div
      className={`journal-note-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="note-icon">
        <FaStickyNote />
      </div>
      <div className="note-content">
        <h6>{new Date(journal.createdAt).toLocaleDateString()}</h6>
        <p>{previewText}</p>
      </div>
      {isSelected && (
        <div className="note-actions">
          <button
            className="btn btn-sm btn-outline-primary me-2"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default JournalNote;
