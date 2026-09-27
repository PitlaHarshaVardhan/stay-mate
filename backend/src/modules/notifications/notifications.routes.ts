import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from './notifications.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getNotifications);
router.put('/:id/read', markNotificationRead);
router.put('/read-all', markAllNotificationsRead);

export default router;
