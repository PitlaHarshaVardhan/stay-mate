import { z } from 'zod';

export const groupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2),
  area: z.string().trim().min(2),
  budgetMin: z.number().int().min(0),
  budgetMax: z.number().int().min(0),
  moveInDate: z.coerce.date(),
  targetMembers: z.number().int().min(2).max(10),
  description: z.string().max(1000).optional(),
}).strict();

export const handleJoinRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
}).strict();
