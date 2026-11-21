import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { notificationsService } from './notifications.service';

export async function getNotifications(req: Request, res: Response) {
  return success(res, await notificationsService.list(req.user!.userId));
}

export async function markNotificationRead(req: Request, res: Response) {
  const result = await notificationsService.markRead(req.user!.userId, String(req.params.id));
  return success(res, result, 'Notification marked as read.');
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  const result = await notificationsService.markAllRead(req.user!.userId);
  return success(res, result, 'All notifications marked as read.');
}
