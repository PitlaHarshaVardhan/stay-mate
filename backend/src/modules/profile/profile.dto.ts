import { z } from 'zod';

export const profileSchema = z.object({
  profilePhoto: z.string().max(900_000).optional(),
  age: z.number().int().min(18).max(80).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  occupationType: z.enum(['STUDENT', 'EMPLOYEE', 'INTERN', 'OTHER']).optional(),
  college: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(250).optional(),
}).strict();
