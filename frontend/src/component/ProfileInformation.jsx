import { useState, useEffect } from "react";
import axios from "axios";
import "./ProfileInformation.css";

const ProfileInformation = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("userData")) || {};

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3000/api/user/profile", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setProfile(response.data.profile);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile information");
    } finally {
      setLoading(false);
    }
  };

  const getGenderLabel = (gender) => {
    switch (gender) {
      case "MALE":
        return "Male";
      case "FEMALE":
        return "Female";
      case "OTHER":
        return "Other";
      case "PREFER_NOT_TO_SAY":
        return "Prefer not to say";
      default:
        return "Not specified";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="profile-info-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-info-container">
        <div className="profile-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={fetchProfile} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-info-container">
        <div className="profile-error">
          <p>No profile information available</p>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    // For students
    if (profile.student?.section) {
      return (
        <div className="profile-section-card">
          <div className="section-header">
            <i className="fas fa-users-class"></i>
            <h4>Class Section</h4>
          </div>
          <div className="section-details">
            <div className="section-info-row">
              <span className="label">Section Name:</span>
              <span className="value">{profile.student.section.name}</span>
            </div>
            {profile.student.section.gradeLevel && (
              <div className="section-info-row">
                <span className="label">Grade Level:</span>
                <span className="value">{profile.student.section.gradeLevel}</span>
              </div>
            )}
            <div className="section-info-row">
              <span className="label">Section Code:</span>
              <span className="value code">{profile.student.section.code}</span>
            </div>
          </div>
        </div>
      );
    }

    // For teachers
    if (profile.teacher?.section) {
      return (
        <div className="profile-section-card">
          <div className="section-header">
            <i className="fas fa-chalkboard-teacher"></i>
            <h4>Assigned Section</h4>
          </div>
          <div className="section-details">
            <div className="section-info-row">
              <span className="label">Section Name:</span>
              <span className="value">{profile.teacher.section.name}</span>
            </div>
            {profile.teacher.section.gradeLevel && (
              <div className="section-info-row">
                <span className="label">Grade Level:</span>
                <span className="value">{profile.teacher.section.gradeLevel}</span>
              </div>
            )}
            <div className="section-info-row">
              <span className="label">Section Code:</span>
              <span className="value code">{profile.teacher.section.code}</span>
            </div>
          </div>
        </div>
      );
    }

    // For counselors with multiple sections
    if (profile.counselor?.sections?.length > 0) {
      return (
        <div className="profile-section-card">
          <div className="section-header">
            <i className="fas fa-layer-group"></i>
            <h4>Assigned Sections ({profile.counselor.sections.length})</h4>
          </div>
          <div className="sections-list">
            {profile.counselor.sections.map((section) => (
              <div key={section.id} className="section-item">
                <div className="section-item-name">{section.name}</div>
                <div className="section-item-details">
                  {section.gradeLevel && (
                    <span className="grade-badge">{section.gradeLevel}</span>
                  )}
                  <span className="code-badge">{section.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // No section assigned
    if (profile.role === "STUDENT" || profile.role === "TEACHER") {
      return (
        <div className="profile-section-card no-section">
          <div className="section-header">
            <i className="fas fa-info-circle"></i>
            <h4>No Section Assigned</h4>
          </div>
          <p className="no-section-message">
            {profile.role === "STUDENT"
              ? "You haven't joined a class section yet. Contact your teacher or administrator for a section code."
              : "You haven't been assigned to a class section yet. Contact your administrator."}
          </p>
        </div>
      );
    }

    if (profile.role === "COUNSELOR") {
      return (
        <div className="profile-section-card no-section">
          <div className="section-header">
            <i className="fas fa-info-circle"></i>
            <h4>No Sections Assigned</h4>
          </div>
          <p className="no-section-message">
            You haven't joined any class sections yet. Contact your administrator for section codes.
          </p>
        </div>
      );
    }

    return null;
  };

  const renderEmergencyContacts = () => {
    if (!profile.student?.emergencyContacts?.length) return null;

    return (
      <div className="profile-card emergency-contacts">
        <div className="card-header">
          <i className="fas fa-phone-alt"></i>
          <h3>Emergency Contacts</h3>
        </div>
        <div className="contacts-list">
          {profile.student.emergencyContacts.map((contact) => (
            <div key={contact.id} className="contact-item">
              <div className="contact-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="contact-details">
                <div className="contact-name">
                  {contact.name}
                  {contact.isPrimary && (
                    <span className="primary-badge">Primary</span>
                  )}
                </div>
                <div className="contact-relationship">{contact.relationship}</div>
                <div className="contact-phone">
                  <i className="fas fa-phone"></i> {contact.phone}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="profile-info-container">
      {/* Basic Information */}
      <div className="profile-card basic-info">
        <div className="card-header">
          <i className="fas fa-user-circle"></i>
          <h3>Personal Information</h3>
        </div>
        <div className="profile-avatar-section">
          <img
            src={profile.avatar || "/default-avatar.png"}
            alt="Profile"
            className="profile-avatar"
          />
          <div className="profile-name-role">
            <h2>{profile.firstName} {profile.lastName}</h2>
            <span className={`role-badge role-${profile.role.toLowerCase()}`}>
              {profile.role}
            </span>
            <span className={`status-badge status-${profile.status.toLowerCase()}`}>
              {profile.status}
            </span>
          </div>
        </div>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-envelope"></i> Email
            </div>
            <div className="info-value">{profile.email}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-phone"></i> Phone
            </div>
            <div className="info-value">{profile.phone || "Not provided"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-venus-mars"></i> Gender
            </div>
            <div className="info-value">{getGenderLabel(profile.gender)}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-calendar-plus"></i> Member Since
            </div>
            <div className="info-value">{formatDate(profile.createdAt)}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-clock"></i> Last Login
            </div>
            <div className="info-value">{formatDateTime(profile.lastLogin)}</div>
          </div>
          <div className="info-item">
            <div className="info-label">
              <i className="fas fa-sync-alt"></i> Last Updated
            </div>
            <div className="info-value">{formatDateTime(profile.updatedAt)}</div>
          </div>
        </div>
      </div>

      {/* Section Information */}
      {renderSection()}

      {/* Emergency Contacts (for students) */}
      {renderEmergencyContacts()}
    </div>
  );
};

export default ProfileInformation;
