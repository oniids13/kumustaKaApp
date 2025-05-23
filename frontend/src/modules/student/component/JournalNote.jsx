import { FaStickyNote } from "react-icons/fa";

const JournalNote = ({ journal, onClick, onEdit, onDelete, isSelected }) => {
  const previewText =
    journal.content.replace(/<[^>]*>/g, "").substring(0, 100) + "...";

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

  return (
    <div
      className={`journal-note-card ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className="note-icon">
        <FaStickyNote />
      </div>
      <div className="note-content">
        <h6>{formatDate(journal.createdAt)}</h6>
        {journal.updatedAt && (
          <small>Last Update: {formatDate(journal.updatedAt)}</small>
        )}
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
