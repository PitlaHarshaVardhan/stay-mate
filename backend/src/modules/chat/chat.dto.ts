import { z } from 'zod';

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
}).strict();

export const createConversationSchema = z.object({
  otherUserId: z.string().min(1),
}).strict();
