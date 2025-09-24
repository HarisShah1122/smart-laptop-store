
import { User } from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateToken } from "../utils/generateToken.js";
import transporter from "../config/email.js";

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please provide both email and password.");
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password.");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(401);
      throw new Error("Invalid email or password.");
    }

    const token = generateToken(user.id);

    res.status(200).json({
      message: "Login successful.",
      userId: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Please provide name, email, and password.");
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      res.status(409);
      throw new Error("User already exists. Please choose a different email.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: "Registration successful. Welcome!",
      userId: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = (req, res, next) => {
  res.status(200).json({ message: "Logout successful" });
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(404);
      throw new Error("User not found!");
    }

    res.status(200).json({
      message: "User profile retrieved successfully",
      userId: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, oldPassword } = req.body;
    const user = req.user;

    if (!user) {
      res.status(404);
      throw new Error("User not found. Unable to update profile.");
    }

    if (password && password !== confirmPassword) {
      res.status(400);
      throw new Error("Passwords do not match.");
    }

    if (password && oldPassword) {
      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) {
        res.status(401);
        throw new Error("Current password is incorrect.");
      }
    }

    user.name = name ?? user.name;
    user.email = email ?? user.email;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();
    const token = generateToken(updatedUser.id);

    res.status(200).json({
      message: "User profile updated successfully.",
      userId: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const admins = async (req, res, next) => {
  try {
    const list = await User.findAll({ where: { isAdmin: true } });
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({ where: { isAdmin: false } });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found!");
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email, isAdmin } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found!");
    }
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    if (isAdmin !== undefined) user.isAdmin = Boolean(isAdmin);

    const updatedUser = await user.save();
    res.status(200).json({ message: "User updated", updatedUser });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found!");
    }
    await user.destroy();
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

const resetPasswordRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404);
      throw new Error("User not found!");
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const resetLink = `http://localhost:3000/reset-password/${user.id}/${token}`;

    await transporter.sendMail({
      from: `"MERN Shop" ${process.env.EMAIL_FROM}`,
      to: user.email,
      subject: "Password Reset",
      html: `<p>Hi ${user.name},</p><p>Click <a href="${resetLink}">${resetLink}</a> to reset your password.</p>`,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const { id, token } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404);
      throw new Error("User not found!");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.id !== user.id) {
      res.status(401);
      throw new Error("Invalid or expired token");
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.status(200).json({ message: "Password successfully reset" });
  } catch (error) {
    next(error);
  }
};

export {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  getUsers,
  getUserById,
  updateUser,
  updateUserProfile,
  deleteUser,
  admins,
  resetPasswordRequest,
  resetPassword,
};