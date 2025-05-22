# Security Guidelines for KumustaKa App

## Implemented Security Measures

### 1. SQL Injection Prevention

- **Prisma ORM**: The application uses Prisma ORM which automatically prevents SQL injection by using parameterized queries.
- **Input Validation**: Express-validator is used to validate and sanitize user inputs.
- **Custom Security Middleware**: Additional middleware checks request parameters for SQL injection patterns.
- **Test Coverage**: SQL injection pattern detection has been tested with 100% pass rate.

### 2. XSS Attack Prevention

- **Custom XSS Protection**: Built-in middleware that sanitizes request bodies and checks for XSS patterns in URL/query parameters.
- **Helmet**: Sets appropriate HTTP headers to enhance application security including Content-Security-Policy.
- **Frontend Sanitization**: Automatic sanitization of API responses to prevent XSS when rendering data.
- **Test Coverage**: HTML sanitization has been tested with 100% pass rate.

### 3. Rate Limiting

- **Express-Rate-Limit**: Prevents brute force and DoS attacks by limiting the number of requests from a single IP address.
- **Tiered Limits**: Different rate limits for sensitive routes (login) vs. read-heavy routes.
- **Environment-Specific**: More permissive limits in development, stricter in production.

### 4. Prototype Pollution Protection

- **Request Validation**: Middleware checks for potentially dangerous properties in request objects.
- **Test Coverage**: Prototype pollution detection has been tested with 100% pass rate.

### 5. Other Security Measures

- **Helmet**: Sets secure HTTP headers to protect against various attacks.
- **CORS**: Configured to only allow requests from trusted origins.
- **Payload Limiting**: Restricts request body size to prevent DoS attacks.
- **Error Handling**: Prevents leaking sensitive information in error responses.

## Security Testing

A comprehensive security test suite has been implemented to validate the security measures:

- **HTML Sanitization Tests**: Ensures that HTML content is properly sanitized to prevent XSS attacks.
- **SQL Injection Pattern Tests**: Validates that SQL injection patterns are properly detected.
- **Prototype Pollution Tests**: Confirms that prototype pollution attempts are detected.

Run the security tests with:

```bash
node scripts/test-security.js
```

## Security Best Practices

### For Developers

1. **Database Operations**:

   - Always use Prisma's query methods instead of raw SQL when possible.
   - For complex queries that require raw SQL, use the `safeQuery` or `safeExecute` functions from `utils/queryUtils.js`.

2. **Input Validation**:

   - Always validate user inputs using express-validator.
   - Example:
     ```javascript
     const validateInput = [
       body("field")
         .isLength({ min: 3 })
         .withMessage("Field must be at least 3 characters"),
     ];
     ```

3. **Route Protection**:

   - Protect sensitive routes with authentication middleware.
   - Use role-based middleware for authorization.
   - Example:
     ```javascript
     router.post(
       "/sensitive-route",
       auth,
       checkRole(["ADMIN"]),
       controllerFunction
     );
     ```

4. **Frontend Security**:
   - Always sanitize data received from the backend before rendering it.
   - Use the API utility functions in `frontend/src/utils/apiUtils.js` for all API calls.
   - Use the sanitization utilities from `frontend/src/utils/sanitizeUtils.js` when manually handling user-generated content.

### Regular Security Maintenance

1. **Dependency Updates**:

   - Regularly update dependencies to address security vulnerabilities.
   - Run `npm audit` periodically to check for vulnerabilities.

2. **Security Testing**:
   - Test for SQL injection by attempting to inject malicious SQL code.
   - Test for XSS vulnerabilities by attempting to inject malicious scripts.
   - Test authentication by attempting to access protected resources without proper authentication.

## Reporting Security Issues

If you discover a security vulnerability, please send an email to [security-report@kumustaka-app.com](mailto:security-report@kumustaka-app.com) rather than opening a public issue.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Prisma Security Best Practices](https://www.prisma.io/docs/concepts/components/prisma-client/secure-practices)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## Security Contacts

If you discover a security vulnerability, please report it to:

- Security Team: security@kumustaka.example.com
- Lead Developer: developer@kumustaka.example.com

## Regular Security Audits

The application should undergo regular security audits:

- Run the security test suite before each deployment.
- Perform a comprehensive security review quarterly.
- Update dependencies regularly to patch known vulnerabilities.
