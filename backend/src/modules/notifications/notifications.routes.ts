import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from './notifications.controller';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(getNotifications));
router.put('/:id/read', asyncHandler(markNotificationRead));
router.put('/read-all', asyncHandler(markAllNotificationsRead));

export default router;
