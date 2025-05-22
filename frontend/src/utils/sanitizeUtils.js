/**
 * Frontend utility functions for sanitizing data
 * Use these functions to protect against XSS when displaying user-generated content
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} content - The HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHtml = (content) => {
  if (!content) return "";
  if (typeof content !== "string") return String(content);

  // Basic HTML sanitization
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Sanitize text that will be inserted into a URL
 * @param {string} text - The text to sanitize
 * @returns {string} - URL-safe text
 */
export const sanitizeUrlParam = (text) => {
  if (!text) return "";
  if (typeof text !== "string") return encodeURIComponent(String(text));
  return encodeURIComponent(text);
};

/**
 * Sanitize data object recursively
 * @param {any} data - Data to sanitize (object, array, or primitive)
 * @returns {any} - Sanitized data
 */
export const sanitizeData = (data) => {
  if (!data) return data;

  if (typeof data === "string") {
    return sanitizeHtml(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  if (typeof data === "object" && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }

  return data;
};

export default {
  sanitizeHtml,
  sanitizeUrlParam,
  sanitizeData,
};
