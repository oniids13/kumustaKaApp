import { useState, useEffect } from "react";
import axios from "axios";
import "../../../styles/AdminResetPassword.css";

const AdminResetPassword = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [resetResult, setResetResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch users when component mounts
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(localStorage.getItem("userData"));

      if (!userData || !userData.token) {
        setError("You must be logged in as admin");
        setIsLoading(false);
        return;
      }

      const response = await axios.get(
        "http://localhost:3000/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );

      console.log("API Response:", response.data);

      if (response.data && response.data.users) {
        console.log("Setting users:", response.data.users);
        setUsers(response.data.users);
      } else {
        console.error("No users array found in API response:", response.data);
        setUsers([]);
        setError("No user data received from server");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.response?.data?.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!selectedUserId) {
      setError("Please select a user");
      return;
    }

    try {
      setIsLoading(true);
      setResetResult(null);
      setError(null);

      const userData = JSON.parse(localStorage.getItem("userData"));

      const response = await axios.post(
        "http://localhost:3000/api/password/admin-reset",
        {
          userId: selectedUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setResetResult({
        message: response.data.message,
        temporaryPassword: response.data.temporaryPassword,
        userName: response.data.userName,
        userEmail: response.data.userEmail,
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      setError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    console.log("Search term changed to:", e.target.value);
    setSearchTerm(e.target.value);
  };

  // Add console logs to debug filtering
  console.log("Current users array:", users);
  console.log("Current search term:", searchTerm);

  // Improved filtering logic with debugging
  let filteredUsers = [];
  if (Array.isArray(users)) {
    filteredUsers = users.filter((user) => {
      if (!user || typeof user !== "object") {
        console.warn("Invalid user object in array:", user);
        return false;
      }

      // Check if the necessary properties exist
      if (!user.firstName || !user.lastName || !user.email) {
        console.warn("User missing required properties:", user);
        return false;
      }

      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      const term = searchTerm.toLowerCase();

      const nameMatch = fullName.includes(term);
      const emailMatch = email.includes(term);

      // Debug individual search match
      if (term && (nameMatch || emailMatch)) {
        console.log(`Match found for "${term}":`, user);
      }

      return nameMatch || emailMatch;
    });
  }

  console.log("Filtered users count:", filteredUsers.length);

  return (
    <div className="admin-reset-password-container">
      <h2>Reset User Password</h2>

      {error && <div className="admin-reset-error">{error}</div>}

      <div className="search-container">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>

      {isLoading ? (
        <div className="loading-indicator">Loading users...</div>
      ) : (
        <div className="users-count">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}

      <form onSubmit={handleResetPassword} className="reset-form">
        <div className="form-group">
          <label htmlFor="userSelect">Select User:</label>
          <select
            id="userSelect"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="user-select"
            disabled={isLoading}
          >
            <option value="">-- Select a user --</option>
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email}) - {user.role}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="reset-button"
          disabled={isLoading || !selectedUserId}
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      {resetResult && (
        <div className="reset-result">
          <h3>Password Reset Successful</h3>
          <p>
            <strong>User:</strong> {resetResult.userName}
          </p>
          <p>
            <strong>Email:</strong> {resetResult.userEmail}
          </p>
          <div className="temporary-password">
            <p>
              <strong>Temporary Password:</strong>
            </p>
            <div className="password-display">
              {resetResult.temporaryPassword}
            </div>
            <p className="password-instructions">
              Please provide this temporary password to the user securely. They
              should change this password immediately after logging in.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResetPassword;
