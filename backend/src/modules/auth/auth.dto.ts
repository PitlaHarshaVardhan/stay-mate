import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(8).max(128),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string().min(8).max(128),
}).strict().refine((value) => Boolean(value.email || value.phone), {
  message: 'Either email or phone is required',
  path: ['email'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
}).strict();

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(128),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
