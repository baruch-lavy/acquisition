import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1, 'Name is required').trim().optional(),
    email: z.string().email('Invalid email address').trim().optional(),
    role: z.enum(['admin', 'user']).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
