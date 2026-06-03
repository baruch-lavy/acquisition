import jwt from 'jsonwebtoken';
import logger from '#config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

export function generateToken(payload, expiresIn = '1h') {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  } catch (error) {
    logger.error('Error generating token:', error);
    return null;
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    logger.error('Error verifying token:', error);
    return null;
  }
}