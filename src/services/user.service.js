import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

export const getAllUsers = async () => {
  try {
    const allUsers = await db.select().from(users);
    return allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Error fetching users');
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    if (error.message === 'User not found') {
      throw error;
    }
    console.error('Error fetching user:', error);
    throw new Error('Error fetching user');
  }
};

export const updateUser = async (id, data) => {
  try {
    const [existingUser] = await db.select().from(users).where(eq(users.id, id));
    if (!existingUser) {
      throw new Error('User not found');
    }

    const updateData = { ...data, updated_at: new Date().toISOString() };
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    };
  } catch (error) {
    if (error.message === 'User not found') {
      throw error;
    }
    console.error('Error updating user:', error);
    throw new Error('Error updating user');
  }
};

export const deleteUser = async id => {
  try {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    if (!deletedUser) {
      throw new Error('User not found');
    }
    return { message: 'User deleted successfully' };
  } catch (error) {
    if (error.message === 'User not found') {
      throw error;
    }
    console.error('Error deleting user:', error);
    throw new Error('Error deleting user');
  }
};
