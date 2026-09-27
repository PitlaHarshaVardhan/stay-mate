import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../prisma/client';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: notifications });
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const notificationId = String(req.params.id);
    const notification = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });

    return res.json({ success: true, data: notification, message: 'Notification marked as read.' });
  } catch (error) {
    return next(error);
  }
}

export async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const updated = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return res.json({ success: true, data: updated, message: 'All notifications marked as read.' });
  } catch (error) {
    return next(error);
  }
}
