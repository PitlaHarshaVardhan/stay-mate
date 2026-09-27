import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createConversation, getConversation, listConversations, sendMessage } from './chat.controller';

const router = Router();

router.use(requireAuth);
router.get('/', listConversations);
router.post('/conversations', createConversation);
router.get('/:id', getConversation);
router.post('/messages', sendMessage);

export default router;
