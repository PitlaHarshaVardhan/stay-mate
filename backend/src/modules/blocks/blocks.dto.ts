import { z } from 'zod';

export const blockSchema = z.object({
  blockedId: z.string().trim().min(1),
}).strict();
