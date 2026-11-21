import { z } from 'zod';

export const connectionSchema = z.object({
  receiverId: z.string().trim().min(1),
}).strict();

export const updateConnectionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'BLOCKED']),
}).strict();
