import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createConversation, getConversation, listConversations, sendMessage } from './chat.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { createConversationSchema, messageSchema } from './chat.dto';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listConversations));
router.post('/conversations', validate(createConversationSchema), asyncHandler(createConversation));
router.get('/:id', asyncHandler(getConversation));
router.post('/messages', validate(messageSchema), asyncHandler(sendMessage));

export default router;
