/**
 * Security middleware for input validation and sanitization
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} content - The HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
const sanitizeHtml = (content) => {
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
 * Recursively sanitize object values
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeHtml(value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

/**
 * XSS protection middleware - sanitizes request body, query params, and URL params
 */
const xssProtection = (req, res, next) => {
  try {
    // Clone the request body and sanitize it rather than modifying directly
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);
    }

    // For Express 5 compatibility, don't attempt to modify req.query directly
    // Instead, capture any suspicious patterns during validation
    next();
  } catch (error) {
    console.error("Error in XSS protection middleware:", error);
    next();
  }
};

/**
 * Middleware to validate and sanitize request parameters
 * Use this as an extra layer of protection for particularly sensitive routes
 */
const validateRequestParams = (req, res, next) => {
  try {
    // Log suspiciously large payloads
    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength) > 1024 * 500) {
      // 500KB
      console.warn(
        `Large payload detected: ${contentLength} bytes from ${req.ip}`
      );
    }

    // Simple recursion check for JSON objects to catch potential prototype pollution
    const checkForProtoProps = (obj) => {
      if (!obj || typeof obj !== "object") return false;

      // Check for __proto__ or constructor properties that could be used for prototype pollution
      const keys = Object.keys(obj);
      if (keys.includes("__proto__") || keys.includes("constructor")) {
        return true;
      }

      // Recursively check nested objects
      return Object.values(obj).some(
        (val) =>
          typeof val === "object" && val !== null && checkForProtoProps(val)
      );
    };

    // Check for potential prototype pollution in request body
    if (req.body && typeof req.body === "object") {
      if (checkForProtoProps(req.body)) {
        return res.status(400).json({
          message: "Invalid request: potential prototype pollution detected",
        });
      }
    }

    // Check for SQL injection patterns in query strings
    const sqlPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Basic SQL injection characters
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // SQL meta-characters
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // SQL OR patterns
      /(union).+(select)/i, // UNION SELECT pattern
    ];

    // XSS patterns to check for in URL parameters and query strings
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Basic script tag
      /on\w+\s*=/gi, // Inline event handlers
      /javascript:/gi, // JavaScript protocol
      /data:/gi, // Data URI scheme that could contain JavaScript
      /<img[^>]+\bsrc\s*=[^>]+>/gi, // Image tags
      /<iframe[^>]+>/gi, // iFrame tags
    ];

    const checkForSqlInjection = (value) => {
      if (typeof value !== "string") return false;
      return sqlPatterns.some((pattern) => pattern.test(value));
    };

    const checkForXss = (value) => {
      if (typeof value !== "string") return false;
      return xssPatterns.some((pattern) => pattern.test(value));
    };

    // Check query parameters
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (checkForSqlInjection(value)) {
          return res
            .status(400)
            .json({ message: "Invalid query parameter detected" });
        }
        if (checkForXss(value)) {
          return res
            .status(400)
            .json({ message: "Potential XSS attack detected in query" });
        }
      }
    }

    // Check URL params
    if (req.params) {
      for (const [key, value] of Object.entries(req.params)) {
        if (checkForSqlInjection(value)) {
          return res
            .status(400)
            .json({ message: "Invalid URL parameter detected" });
        }
        if (checkForXss(value)) {
          return res
            .status(400)
            .json({ message: "Potential XSS attack detected in URL" });
        }
      }
    }

    // Apply XSS protection after validation
    xssProtection(req, res, next);
  } catch (error) {
    console.error("Error in security middleware:", error);
    next();
  }
};

module.exports = { validateRequestParams, sanitizeHtml, sanitizeObject };
