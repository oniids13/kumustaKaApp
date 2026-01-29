import { FaStickyNote } from "react-icons/fa";

const JournalNote = ({ journal, onClick, onEdit, onDelete, isSelected }) => {
  // Helper function to decode HTML entities and strip HTML tags
  const getPreviewText = (htmlContent) => {
    const tempDiv = document.createElement("div");
    // First pass: decode HTML entities (e.g., &lt;p&gt; becomes <p>)
    tempDiv.innerHTML = htmlContent;
    const decodedHtml = tempDiv.textContent || tempDiv.innerText || "";
    // Second pass: strip actual HTML tags (e.g., <p>Sample</p> becomes Sample)
    tempDiv.innerHTML = decodedHtml;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    // Return truncated preview
    return plainText.substring(0, 100) + (plainText.length > 100 ? "..." : "");
  };

  const previewText = getPreviewText(journal.content);

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
