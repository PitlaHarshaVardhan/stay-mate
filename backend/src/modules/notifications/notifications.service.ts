import { notificationsRepository } from './notifications.repository';

export const notificationsService = {
  list(userId: string) {
    return notificationsRepository.findMany(userId);
  },
  markRead(userId: string, id: string) {
    return notificationsRepository.markRead(id, userId);
  },
  markAllRead(userId: string) {
    return notificationsRepository.markAllRead(userId);
  },
};
