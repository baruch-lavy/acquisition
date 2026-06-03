import { verifyToken } from '#utils/jwt.js';
import logger from '#config/logger.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Error in auth middleware:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
