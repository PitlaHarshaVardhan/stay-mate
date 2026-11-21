import { prisma } from '../../prisma/client';

export const connectionsRepository = {
  findExisting(senderId: string, receiverId: string) {
    return prisma.connection.findFirst({
      where: { OR: [{ senderId, receiverId }, { senderId: receiverId, receiverId: senderId }] },
    });
  },
  findBlock(senderId: string, receiverId: string) {
    return prisma.blockedUser.findFirst({
      where: { OR: [{ blockerId: senderId, blockedId: receiverId }, { blockerId: receiverId, blockedId: senderId }] },
    });
  },
  create(senderId: string, receiverId: string) {
    return prisma.$transaction(async (tx) => {
      const connection = await tx.connection.create({ data: { senderId, receiverId, status: 'PENDING' } });
      await tx.notification.create({
        data: { userId: receiverId, type: 'CONNECTION_REQUEST', title: 'New connection request', message: 'Someone wants to connect with you.' },
      });
      return connection;
    });
  },
  findMany(userId: string) {
    return prisma.connection.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      include: { sender: { select: { id: true, name: true, profile: { select: { profilePhoto: true, occupationType: true } } } }, receiver: { select: { id: true, name: true, profile: { select: { profilePhoto: true, occupationType: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  },
  findById(id: string) {
    return prisma.connection.findUnique({ where: { id } });
  },
  update(id: string, status: 'ACCEPTED' | 'REJECTED' | 'BLOCKED') {
    return prisma.connection.update({ where: { id }, data: { status } });
  },
  delete(id: string) {
    return prisma.connection.delete({ where: { id } });
  },
  notifyAccepted(senderId: string) {
    return prisma.notification.create({
      data: { userId: senderId, type: 'CONNECTION_ACCEPTED', title: 'Connection accepted', message: 'Your connection request was accepted.' },
    });
  },
};
