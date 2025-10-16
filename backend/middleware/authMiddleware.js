import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { User } from '../models/userModel.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Token from Authorization header:', token); 
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
    console.log('Token from cookie:', token); 
  }

  if (!token) {
    console.error('No token provided in Authorization header or cookie');
    res.statusCode = 401;
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded); 

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'isAdmin']
    });

    if (!user) {
      console.error('User not found for ID:', decoded.id);
      res.statusCode = 401;
      throw new Error('Not authorized, user not found');
    }

    req.user = user.dataValues;
    console.log('Authenticated User:', req.user); 
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message, 'Stack:', error.stack);
    res.statusCode = 401;
    throw new Error('Not authorized, token failed');
  }
});

export const admin = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    console.error('Admin access denied for user:', req.user?.id);
    res.statusCode = 403;
    throw new Error('Not authorized as an admin');
  }
  console.log('Admin access granted for user:', req.user.id);
  next();
});