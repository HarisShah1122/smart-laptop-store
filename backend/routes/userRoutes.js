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

// Validation schemas
const checkLogin = [
  body("email").trim().notEmpty().withMessage("Email is required").bail().isEmail().withMessage("Please enter a valid email address"),
  body("password").trim().notEmpty().withMessage("Password is required"),
];

const checkNewUser = [
  body("email").trim().notEmpty().withMessage("Email is required").bail().isEmail().withMessage("Please enter a valid email address"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/)
    .withMessage("Password must contain at least 6 characters, including one uppercase letter, one lowercase letter, and one number"),
  body("name").trim().notEmpty().withMessage("Name is required").escape(),
];

const checkUpdateProfile = [
  body("email").optional().trim().isEmail().withMessage("Please enter a valid email address"),
  body("password")
    .optional()
    .trim()
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/)
    .withMessage("Password must contain at least 6 characters, including one uppercase letter, one lowercase letter, and one number"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").escape(),
  body("confirmPassword")
    .optional()
    .trim()
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),
  body("oldPassword").optional().trim(),
];

const checkGetUserById = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID: Must be a positive integer"),
];

const checkUpdateUser = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID: Must be a positive integer"),
  body("email").optional().trim().isEmail().withMessage("Please enter a valid email address"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").escape(),
  body("isAdmin").optional().isBoolean().withMessage("isAdmin must be true/false"),
];

const resetPasswordRequestValidator = [
  body("email").trim().notEmpty().withMessage("Email is required").bail().isEmail().withMessage("Please enter a valid email address"),
];

const resetPasswordValidator = [
  param("id").isInt({ min: 1 }).withMessage("Invalid ID: Must be a positive integer"),
  param("token").trim().notEmpty().withMessage("Token is required"),
  body("password")
    .trim()
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/)
    .withMessage("Password must contain at least 6 characters, including one uppercase letter, one lowercase letter, and one number"),
];

// Routes
router.route("/").post(checkNewUser, validateRequest, registerUser).get(protect, admin, getUsers);
router.route("/admins").get(protect, admin, admins);
router.route("/reset-password/request").post(resetPasswordRequestValidator, validateRequest, resetPasswordRequest);
router.route("/reset-password/reset/:id/:token").post(resetPasswordValidator, validateRequest, resetPassword);
router.route("/login").post(checkLogin, validateRequest, loginUser);
router.route("/logout").post(protect, logoutUser);
router.route("/profile").get(protect, getUserProfile).put(protect, checkUpdateProfile, validateRequest, updateUserProfile);
router.route("/:id")
  .get(checkGetUserById, validateRequest, protect, admin, getUserById)
  .put(checkUpdateUser, validateRequest, protect, admin, updateUser)
  .delete(checkGetUserById, validateRequest, protect, admin, deleteUser);

export default router;