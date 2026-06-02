import bcrypt from 'bcrypt';
import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { eq } from 'drizzle-orm';
import { users } from '#models/user.model.js';

export async function hashPassword(password) {
  try {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Failed to hash password', { cause: error });
  }
}

export async function comparePassword(plainPassword, hashedPassword) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new Error('Failed to compare password', { cause: error });
  }
}

export async function comparePasswords(plainPassword, hashedPassword) {
  return comparePassword(plainPassword, hashedPassword);
}

export const authenticateUser = async (email, password) => {
  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    return {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      createdAt: existingUser.created_at,
    };
  } catch (error) {
    if (
      error.message === 'User not found' ||
      error.message === 'Invalid credentials'
    ) {
      throw error;
    }

    logger.error('Error authenticating user', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    throw new Error('Failed to authenticate user', { cause: error });
  }
};
export const createUser = async userData => {
  try {
    const { name, email, password, role } = userData;
    console.log('Creating user with data:', { name, email, password, role });
    const now = new Date().toISOString();
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    console.log('Existing user check result:', existingUser);
    if (existingUser) {
      throw new Error('User already exists');
    }
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
        created_at: now,
        updated_at: now,
      })
      .returning({
        name: users.name,
        email: users.email,
        role: users.role,
        id: users.id,
        createdAt: users.created_at,
      });

    console.log('New user created:', newUser);

    logger.info('User created successfully', { name, email, role });
    return newUser;
  } catch (error) {
    if (error.message === 'User already exists') {
      throw error;
    }

    if (error?.code === '23505') {
      throw new Error('User already exists', { cause: error });
    }

    logger.error('Error creating user', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    throw new Error('Failed to create user', { cause: error });
  }
};
