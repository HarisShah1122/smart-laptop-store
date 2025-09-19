import jwt from "jsonwebtoken";

/**
 * Generate JWT token for given user id.
 * @param {number|string} userId
 * @returns {string} token
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
