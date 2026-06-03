import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#services/user.service.js';
import logger from '#config/logger.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import { formatValidationErrors } from '#utils/format.js';

export async function fetchAllUsers(req, res, next) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
}

export async function fetchUserById(req, res, next) {
  try {
    const validationResult = userIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      logger.warn('Validation failed for getUserById', {
        errors: validationResult.error.errors,
      });
      return res.status(400).json({
        message: 'Invalid input',
        errors: formatValidationErrors(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    const user = await getUserById(id);
    logger.info(`User with ID ${id} fetched successfully`);
    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user with ID ${req.params.id}:`, error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    next(error);
  }
}

export async function updateUserById(req, res, next) {
  try {
    const paramsValidation = userIdSchema.safeParse(req.params);
    if (!paramsValidation.success) {
      logger.warn('Validation failed for updateUser params', {
        errors: paramsValidation.error.errors,
      });
      return res.status(400).json({
        message: 'Invalid input',
        errors: formatValidationErrors(paramsValidation.error),
      });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      logger.warn('Validation failed for updateUser body', {
        errors: bodyValidation.error.errors,
      });
      return res.status(400).json({
        message: 'Invalid input',
        errors: formatValidationErrors(bodyValidation.error),
      });
    }

    const { id } = paramsValidation.data;
    const updates = bodyValidation.data;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You can only update your own profile' });
    }

    if (updates.role !== undefined && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Forbidden: Only admins can change user roles' });
    }

    const updatedUser = await updateUser(id, updates);
    logger.info(`User with ID ${id} updated successfully`);
    res.json(updatedUser);
  } catch (error) {
    logger.error(`Error updating user with ID ${req.params.id}:`, error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    next(error);
  }
}

export async function deleteUserById(req, res, next) {
  try {
    const validationResult = userIdSchema.safeParse(req.params);
    if (!validationResult.success) {
      logger.warn('Validation failed for deleteUser', {
        errors: validationResult.error.errors,
      });
      return res.status(400).json({
        message: 'Invalid input',
        errors: formatValidationErrors(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res
        .status(403)
        .json({ message: 'Forbidden: You can only delete your own account' });
    }

    const result = await deleteUser(id);
    logger.info(`User with ID ${id} deleted successfully`);
    res.json(result);
  } catch (error) {
    logger.error(`Error deleting user with ID ${req.params.id}:`, error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    next(error);
  }
}
