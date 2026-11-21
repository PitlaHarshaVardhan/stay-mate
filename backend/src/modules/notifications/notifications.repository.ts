import { prisma } from '../../prisma/client';

export const notificationsRepository = {
  findMany(userId: string) {
    return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  },
  markRead(id: string, userId: string) {
    return prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
  },
  markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  },
};
