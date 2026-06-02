import logger from '#config/logger.js';
import { generateToken } from '#utils/jwt.js';
import { loginSchema, registerSchema } from '#validations/auth.validation.js';
import { formatValidationErrors } from '#utils/format.js';
import { authenticateUser, createUser } from '#services/auth.service.js';
import { cookies } from '#utils/cookies.js';

export async function register(req, res, next) {
  try {
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn('Validation failed for registration', {
        errors: validationResult.error.errors,
      });
      return res.status(400).json({
        message: 'Invalid input',
        errors: formatValidationErrors(validationResult.error),
      });
    }

    const { name, email, role, password } = validationResult.data;
    const newUser = await createUser({ name, email, password, role });
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
    cookies.set(res, 'token', token);
    logger.info('User registered successfully', { name, email, role });

    res
      .status(201)
      .json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    logger.error('Error registering user', error);
    if (error.message === 'User already exists') {
      return res.status(409).json({ message: 'User already exists' });
    }
    next(error);
  }
}

export async function signOut(req, res, next) {
  try {
    cookies.clear(res, 'token');
    logger.info('User logged out successfully');
    res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    logger.error('Error logging out user', error);
    next(error);
  }
}

export async function logout(req, res, next) {
  return signOut(req, res, next);
}

export async function login(req, res, next) {
  return signIn(req, res, next);
}

export async function signIn(req, res, next) {
  try {
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      logger.warn('Validation failed for login', {
        errors: validationResult.error.errors,
      });
      return res.status(400).json({
        message: 'Invalid input',
        errors: formatValidationErrors(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;
    const user = await authenticateUser(email, password);
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    cookies.set(res, 'token', token);
    logger.info('User logged in successfully', { email, role: user.role });
    res.status(200).json({ message: 'User logged in successfully', user });
  } catch (error) {
    logger.error('Error logging in user', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    next(error);
  }
}
