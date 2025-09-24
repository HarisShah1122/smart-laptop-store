import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      res.status(401);
      throw new Error("Authentication failed: Token not provided.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      res.status(401);
      throw new Error("Authentication failed: User not found.");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    next(error);
  }
};

export const admin = (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403);
      throw new Error("Authorization failed: Not authorized as an admin.");
    }
    next();
  } catch (error) {
    next(error);
  }
};