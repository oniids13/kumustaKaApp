import { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaPhone, FaUser } from "react-icons/fa";
import axios from "axios";
import "../styles/EmergencyContact.css";

const EmergencyContact = () => {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    phone: "",
    isPrimary: false,
  });

  const user = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/emergencycontact/allContact",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setContacts(response.data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editContact) {
        await axios.put(
          `http://localhost:3000/api/emergencycontact/updateContact/${editContact.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
      } else {
        await axios.post(
          "http://localhost:3000/api/emergencycontact/newContact",
          formData,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
      }
      setShowForm(false);
      setEditContact(null);
      setFormData({
        name: "",
        relationship: "",
        phone: "",
        isPrimary: false,
      });
      fetchContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
    }
  };

  const handleEdit = (contact) => {
    setEditContact(contact);
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      isPrimary: contact.isPrimary,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("Are you sure you want to delete this Contact?"))
        return;
      await axios.delete(
        `http://localhost:3000/api/emergencycontact/deleteContact/${id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  return (
    <div className="emergency-contact-container">
      <div className="ec-header">
        <h2>Emergency Contacts</h2>
        <button
          className="btn-add-contact"
          onClick={() => setShowForm(!showForm)}
        >
          <FaPlus /> {showForm ? "Cancel" : "Add Contact"}
        </button>
      </div>

      {showForm && (
        <div className="ec-form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Relationship</label>
              <input
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isPrimary"
                name="isPrimary"
                checked={formData.isPrimary}
                onChange={handleInputChange}
              />
              <label htmlFor="isPrimary">Set as primary contact</label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-save">
                {editContact ? "Update" : "Save"} Contact
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowForm(false);
                  setEditContact(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="ec-contacts-grid">
        {contacts.length === 0 ? (
          <div className="empty-state">
            <p>No emergency contacts added yet</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className={`ec-card ${contact.isPrimary ? "primary" : ""}`}
            >
              <div className="ec-card-header">
                <div className="ec-avatar">
                  <FaUser />
                </div>
                <h3>{contact.name}</h3>
                {contact.isPrimary && (
                  <span className="primary-badge">Primary</span>
                )}
              </div>
              <div className="ec-card-body">
                <p>
                  <strong>Relationship:</strong> {contact.relationship}
                </p>
                <p>
                  <FaPhone /> {contact.phone}
                </p>
              </div>
              <div className="ec-card-actions">
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(contact)}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(contact.id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmergencyContact;
