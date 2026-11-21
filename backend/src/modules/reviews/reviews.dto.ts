import { z } from 'zod';

export const propertyReviewSchema = z.object({
  propertyId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().min(3).max(1000),
}).strict();

export const userReviewSchema = z.object({
  revieweeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().min(3).max(1000),
}).strict();
