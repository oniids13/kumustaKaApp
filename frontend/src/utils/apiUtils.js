import axios from "axios";
import { sanitizeData, sanitizeUrlParam } from "./sanitizeUtils";

// Create an axios instance with a base URL
const api = axios.create({
  baseURL: "http://localhost:3000",
});

// Add a response interceptor to sanitize all response data
api.interceptors.response.use(
  (response) => {
    // Sanitize the response data to prevent XSS
    if (response.data) {
      response.data = sanitizeData(response.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Make an API request with automatic retry on rate limit (429) errors
 * @param {Object} config - Axios request configuration
 * @param {Number} maxRetries - Maximum number of retries (default: 3)
 * @param {Number} initialDelay - Initial delay between retries in ms (default: 1000)
 * @returns {Promise} - Promise with the response
 */
export const apiRequest = async (
  config,
  maxRetries = 3,
  initialDelay = 1000
) => {
  let retries = 0;
  let delay = initialDelay;

  // Ensure URL parameters are properly sanitized
  if (config.params) {
    const sanitizedParams = {};
    for (const key in config.params) {
      if (typeof config.params[key] === "string") {
        sanitizedParams[key] = sanitizeUrlParam(config.params[key]);
      } else {
        sanitizedParams[key] = config.params[key];
      }
    }
    config.params = sanitizedParams;
  }

  while (true) {
    try {
      return await api(config);
    } catch (error) {
      // If we're not rate limited or have used all retries, throw the error
      if (
        (error.response?.status !== 429 && error.response?.status !== 503) ||
        retries >= maxRetries
      ) {
        throw error;
      }

      // Increment retries and wait before trying again
      retries++;
      console.log(
        `Rate limited. Retrying (${retries}/${maxRetries}) in ${delay}ms...`
      );

      // Wait for the delay period
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff - double the delay for the next retry
      delay *= 2;
    }
  }
};

/**
 * Get user data from localStorage
 * @returns {Object|null} The user data object or null if not available
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

/**
 * Check if the user is authenticated
 * @returns {Boolean} Whether the user is authenticated
 */
export const isAuthenticated = () => {
  const user = getUserData();
  return !!(user && user.token);
};

/**
 * Get the authentication header for API requests
 * @returns {Object} Authentication headers
 */
export const getAuthHeader = () => {
  const user = getUserData();
  return user && user.token ? { Authorization: `Bearer ${user.token}` } : {};
};

/**
 * Make an authenticated GET request
 * @param {String} url - The URL to request
 * @param {Object} params - Query parameters
 * @returns {Promise} - Promise with the response
 */
export const getWithAuth = async (url, params = {}) => {
  return apiRequest({
    method: "get",
    url,
    params,
    headers: getAuthHeader(),
  });
};

/**
 * Make an authenticated POST request
 * @param {String} url - The URL to request
 * @param {Object} data - The data to send
 * @returns {Promise} - Promise with the response
 */
export const postWithAuth = async (url, data = {}) => {
  return apiRequest({
    method: "post",
    url,
    data,
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
  });
};

/**
 * Make an authenticated PUT request
 * @param {String} url - The URL to request
 * @param {Object} data - The data to send
 * @returns {Promise} - Promise with the response
 */
export const putWithAuth = async (url, data = {}) => {
  return apiRequest({
    method: "put",
    url,
    data,
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    },
  });
};

/**
 * Make an authenticated DELETE request
 * @param {String} url - The URL to request
 * @returns {Promise} - Promise with the response
 */
export const deleteWithAuth = async (url) => {
  return apiRequest({
    method: "delete",
    url,
    headers: getAuthHeader(),
  });
};

export default {
  apiRequest,
  getUserData,
  isAuthenticated,
  getAuthHeader,
  getWithAuth,
  postWithAuth,
  putWithAuth,
  deleteWithAuth,
};
