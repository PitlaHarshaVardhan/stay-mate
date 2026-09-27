import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';

const messageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const conversations = await prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json({ success: true, data: conversations });
  } catch (error) {
    return next(error);
  }
}

export async function getConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const conversationId = String(req.params.id);
    const membership = await prisma.conversationMember.findFirst({
      where: { conversationId, userId },
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this conversation.' } });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 25 },
      },
    });

    return res.json({ success: true, data: conversation });
  } catch (error) {
    return next(error);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const payload = messageSchema.parse(req.body);

    const member = await prisma.conversationMember.findFirst({
      where: { conversationId: payload.conversationId, userId },
    });

    if (!member) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not a member of this conversation.' } });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content,
        messageType: 'TEXT',
      },
    });

    await prisma.conversation.update({
      where: { id: payload.conversationId },
      data: { updatedAt: new Date() },
    });

    return res.status(201).json({ success: true, data: message, message: 'Message sent.' });
  } catch (error) {
    return next(error);
  }
}

const createConversationSchema = z.object({
  otherUserId: z.string().min(1),
});

export async function ensureDirectConversation(userAId: string, userBId: string) {
  if (userAId === userBId) {
    return null;
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      type: 'DIRECT',
      members: {
        every: {
          userId: { in: [userAId, userBId] },
        },
      },
    },
    include: {
      members: true,
    },
  });

  if (existing) {
    return existing;
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      createdBy: userAId,
      members: {
        create: [
          { userId: userAId },
          { userId: userBId },
        ],
      },
    },
    include: {
      members: true,
    },
  });

  return conversation;
}

export async function createConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const payload = createConversationSchema.parse(req.body);
    const conversation = await ensureDirectConversation(userId, payload.otherUserId);

    if (!conversation) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'A direct conversation cannot be created with the same user.' } });
    }

    return res.status(201).json({ success: true, data: conversation, message: 'Conversation ready.' });
  } catch (error) {
    return next(error);
  }
}
