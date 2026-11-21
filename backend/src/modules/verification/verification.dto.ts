import { z } from 'zod';

export const verificationSchema = z.object({
  type: z.enum(['PHONE', 'EMAIL', 'COLLEGE', 'EMPLOYMENT', 'IDENTITY']),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']),
  rejectionReason: z.string().max(1000).optional(),
}).strict();

export const reviewVerificationSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']).optional(),
  rejectionReason: z.string().max(1000).optional(),
}).strict();
