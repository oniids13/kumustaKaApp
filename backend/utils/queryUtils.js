/**
 * Utility functions for database queries
 *
 * Note: Prisma already provides protection against SQL injection through parameterized queries.
 * These utilities are ONLY needed if you use raw queries via prisma.$queryRaw or prisma.$executeRaw
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Execute a raw SQL query safely with parameters
 * ONLY use this for complex queries that cannot be expressed through Prisma's API
 * @param {Array} sqlParts - Template string parts
 * @param  {...any} values - Values to be parameterized
 * @returns {Promise<any>} - Query result
 */
const safeQuery = async (sqlParts, ...values) => {
  // Using Prisma's built-in parameterized query mechanism
  return prisma.$queryRaw({ sql: sqlParts.join("?"), values });
};

/**
 * Execute a raw SQL command safely with parameters
 * ONLY use this for complex operations that cannot be expressed through Prisma's API
 * @param {Array} sqlParts - Template string parts
 * @param  {...any} values - Values to be parameterized
 * @returns {Promise<any>} - Execute result
 */
const safeExecute = async (sqlParts, ...values) => {
  // Using Prisma's built-in parameterized query mechanism
  return prisma.$executeRaw({ sql: sqlParts.join("?"), values });
};

module.exports = { safeQuery, safeExecute };
