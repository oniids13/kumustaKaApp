import axios from "axios";

// Check for unread messages
export const checkUnreadMessages = async () => {
  try {
    const userData = localStorage.getItem("userData");
    if (!userData) return 0;

    const user = JSON.parse(userData);
    if (!user || !user.token) return 0;

    const response = await axios.get(
      "http://localhost:3000/api/communication/unread-count",
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    return response.data?.unreadCount || 0;
  } catch (error) {
    console.error("Error checking unread messages:", error);
    return 0;
  }
};

// Check for pending posts (for teachers)
export const checkPendingPosts = async () => {
  try {
    const userData = localStorage.getItem("userData");
    if (!userData) return 0;

    const user = JSON.parse(userData);
    if (!user || !user.token || user.role !== "TEACHER") return 0;

    const response = await axios.get(
      "http://localhost:3000/api/forum/pending-count",
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    return response.data?.pendingCount || 0;
  } catch (error) {
    console.error("Error checking pending posts:", error);
    return 0;
  }
};

// Set up periodic checks (call this on component mount)
export const setupNotificationChecks = (
  setUnreadMessages,
  setPendingPosts,
  userRole
) => {
  // Immediately check for notifications
  const checkNotifications = async () => {
    try {
      const unreadCount = await checkUnreadMessages();
      setUnreadMessages(unreadCount);

      if (userRole === "TEACHER") {
        const pendingCount = await checkPendingPosts();
        setPendingPosts(pendingCount);
      }
    } catch (error) {
      console.error("Error in notification check:", error);
    }
  };

  // Run initial check
  checkNotifications();

  // Set up interval (every 30 seconds)
  const intervalId = setInterval(checkNotifications, 30000);

  // Return cleanup function
  return () => clearInterval(intervalId);
};
