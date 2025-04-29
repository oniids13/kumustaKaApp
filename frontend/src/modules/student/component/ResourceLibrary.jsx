import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaBookOpen,
  FaHeadphones,
  FaYoutube,
  FaNewspaper,
  FaRunning,
} from "react-icons/fa";
import "../styles/Resources.css";

const ResourcesLibrary = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/resources/allResources",
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        console.log(response.data.data);
        setResources(response.data.data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching resources:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const getIconForType = (type) => {
    switch (type) {
      case "MEDITAION":
        return <FaHeadphones className="text-purple" />;
      case "ARTICLE":
        return <FaBookOpen className="text-primary" />;
      case "VIDEO":
        return <FaYoutube className="text-danger" />;
      case "EXERCISE":
        return <FaRunning className="text-success" />;
      default:
        return <FaBookOpen className="text-secondary" />;
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">Error loading resources: {error}</div>
    );
  }

  return (
    <div className="container resources-container">
      <h1 className="resources-header">
        <FaBookOpen className="me-2" /> Wellness Resources
      </h1>

      <div className="row resource-grid">
        {resources.map((resource) => (
          <div key={resource.id} className="col-md-6 col-lg-4 mb-4">
            <div className="card resource-card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center resource-type">
                  {getIconForType(resource.type)}
                  <span className="ms-2 resource-type-label">
                    {resource.type.toLowerCase()}
                  </span>
                </div>

                <h3 className="resource-title">{resource.title}</h3>
                <p className="resource-description">{resource.description}</p>

                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary resource-link"
                >
                  View Resource
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourcesLibrary;
