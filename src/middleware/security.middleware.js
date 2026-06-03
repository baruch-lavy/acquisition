import aj from '#config/arcjet.js';
import { slidingWindow } from '@arcjet/node';
import logger from '#config/logger.js';

const isArcjetDisabled = () => {
  return process.env.NODE_ENV === 'development' || !process.env.ARCJET_KEY;
};

const securityMiddleware = async (req, res, next) => {
  try {
    if (isArcjetDisabled()) {
      return next();
    }

    const role = req.user?.role || 'guest';
    let limit;
    let message;

    switch (role) {
      case 'admin':
        limit = 20;
        message = 'Admin access granted';
        break;
      case 'user':
        limit = 10;
        message = 'User access granted';
        break;
      default:
        limit = 5;
        message = 'Guest access granted';
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `acquisition-${role}-limit`,
      })
    );
    const decision = await client.protect(req);
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn(
        `Blocked bot request from ${req.ip} with user-agent ${req.headers['user-agent']}`
      );
      return res
        .status(403)
        .json({ message: 'Access denied', error: 'Bot detected' });
    }
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn(
        `Blocked shield request from ${req.ip} with user-agent ${req.headers['user-agent']}`
      );
      return res
        .status(403)
        .json({ message: 'Access denied', error: 'Shield detected' });
    }
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn(
        `Blocked rate limit request from ${req.ip} with user-agent ${req.headers['user-agent']}`
      );
      return res
        .status(403)
        .json({ message: 'Access denied', error: 'Rate limit exceeded' });
    }

    next();
  } catch (error) {
    logger.error('Error in security middleware:', error);

    // Fail open so transient Arcjet/network issues do not take down the API.
    return next();
  }
};

export default securityMiddleware;
