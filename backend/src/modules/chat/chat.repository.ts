import { prisma } from '../../prisma/client';

export const chatRepository = {
  listConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },
  findMembership(conversationId: string, userId: string) {
    return prisma.conversationMember.findFirst({ where: { conversationId, userId } });
  },
  getConversation(conversationId: string) {
    return prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 25 },
      },
    });
  },
  createMessage(conversationId: string, senderId: string, content: string) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { conversationId, senderId, content, messageType: 'TEXT' },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      return message;
    });
  },
  findDirectConversation(userAId: string, userBId: string) {
    return prisma.conversation.findFirst({
      where: { type: 'DIRECT', members: { every: { userId: { in: [userAId, userBId] } } } },
      include: { members: true },
    });
  },
  createDirectConversation(userAId: string, userBId: string) {
    return prisma.conversation.create({
      data: {
        type: 'DIRECT',
        createdBy: userAId,
        members: { create: [{ userId: userAId }, { userId: userBId }] },
      },
      include: { members: true },
    });
  },
};
