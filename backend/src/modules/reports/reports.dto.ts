import { z } from 'zod';

export const reportSchema = z.object({
  reportedUserId: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  reason: z.enum(['SPAM', 'FAKE_PROFILE', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FRAUD', 'OTHER']),
  description: z.string().max(2000).optional(),
}).strict().refine((data) => Boolean(data.reportedUserId || data.groupId), {
  message: 'A report must target a user or a group.',
  path: ['reportedUserId'],
});
