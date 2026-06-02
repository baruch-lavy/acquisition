import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(1, "Name is required").trim(),
    email: z.string().email("Invalid email address").trim(),
    password: z.string().min(6, "Password must be at least 6 characters long").trim(),
    role: z.enum(["admin", "user"]).default("user")
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address").trim(),
    password: z.string().min(6, "Password must be at least 6 characters long").trim()
});