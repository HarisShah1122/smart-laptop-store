import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  updateUser,
  getUserById,
  admins,
  resetPasswordRequest,
  resetPassword,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validator.js";
import { body, param } from "express-validator";

const router = express.Router();

/**
 * Validation schemas
 */
// For login
const checkLogin = [
  body("email").trim().notEmpty().withMessage("Email is required").bail().isEmail().withMessage("Please enter a valid email address"),
  body("password").trim().notEmpty().withMessage("Password is required"),
];

// For register
const checkNewUser = [
  body("email").trim().notEmpty().withMessage("Email is required").bail().isEmail().withMessage("Please enter a valid email address"),
  body("password").trim().notEmpty().withMessage("Password is required").bail().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("name").trim().notEmpty().withMessage("Name is required").escape(),
];

// For updating profile: fields optional but if present validated
const checkUpdateProfile = [
  body("email").optional().trim().isEmail().withMessage("Please enter a valid email address"),
  body("password").optional().trim().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").escape(),
];

// For id params (assumes numeric primary key)
const checkGetUserById = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID: Must be a positive integer"),
];

// For update user by admin
const checkUpdateUser = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID: Must be a positive integer"),
  body("email").optional().trim().isEmail().withMessage("Please enter a valid email address"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").escape(),
  body("isAdmin").optional().isBoolean().withMessage("isAdmin must be true/false"),
];

// Password reset validators
const resetPasswordRequestValidator = [
  body("email").trim().notEmpty().withMessage("Email is required").bail().isEmail().withMessage("Please enter a valid email address"),
];

const resetPasswordValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID: Must be a positive integer"),
  param("token").trim().notEmpty().withMessage("Token is required"),
  body("password").trim().isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

/**
 * Routes
 */
router.route("/").post(checkNewUser, validateRequest, registerUser).get(protect, admin, getUsers);

router.route("/admins").get(protect, admin, admins);

router.route("/reset-password/request").post(resetPasswordRequestValidator, validateRequest, resetPasswordRequest);

router.route("/reset-password/reset/:id/:token").post(resetPasswordValidator, validateRequest, resetPassword);

router.route("/login").post(checkLogin, validateRequest, loginUser);

router.route("/logout").post(protect, logoutUser);

// profile routes: GET and PUT are protected; PUT uses checkUpdateProfile validator
router.route("/profile").get(protect, getUserProfile).put(protect, checkUpdateProfile, validateRequest, updateUserProfile);

// admin user routes
router.route("/:id").get(checkGetUserById, validateRequest, protect, admin, getUserById)
  .put(checkUpdateUser, validateRequest, protect, admin, updateUser)
  .delete(checkGetUserById, validateRequest, protect, admin, deleteUser);

export default router;
