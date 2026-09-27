import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { ensureDirectConversation } from '../chat/chat.controller';

const connectionSchema = z.object({
  receiverId: z.string().min(1),
});

const updateConnectionSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'BLOCKED']),
});

export async function createConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const senderId = req.user?.userId;
    if (!senderId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const body = connectionSchema.parse(req.body);

    if (senderId === body.receiverId) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'You cannot connect with yourself.' } });
    }

    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId: body.receiverId },
          { senderId: body.receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE_CONNECTION', message: 'Connection already exists.' } });
    }

    const blocked = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: body.receiverId },
          { blockerId: body.receiverId, blockedId: senderId },
        ],
      },
    });

    if (blocked) {
      return res.status(403).json({ success: false, error: { code: 'BLOCKED', message: 'This user is blocked or blocked you.' } });
    }

    const connection = await prisma.connection.create({
      data: {
        senderId,
        receiverId: body.receiverId,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        userId: body.receiverId,
        type: 'CONNECTION_REQUEST',
        title: 'New connection request',
        message: 'Someone wants to connect with you.',
      },
    });

    return res.status(201).json({ success: true, data: connection, message: 'Connection request sent.' });
  } catch (error) {
    return next(error);
  }
}

export async function getConnections(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, profile: { select: { profilePhoto: true, occupationType: true } } } },
        receiver: { select: { id: true, name: true, profile: { select: { profilePhoto: true, occupationType: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: connections });
  } catch (error) {
    return next(error);
  }
}

export async function updateConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const id = String(req.params.id);
    const body = updateConnectionSchema.parse(req.body);

    const connection = await prisma.connection.findUnique({ where: { id } });
    if (!connection) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Connection not found.' } });
    }

    if (connection.receiverId !== userId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the receiver can accept or reject.' } });
    }

    const updated = await prisma.connection.update({
      where: { id },
      data: { status: body.status },
    });

    if (body.status === 'ACCEPTED') {
      await ensureDirectConversation(connection.senderId, connection.receiverId);
      await prisma.notification.create({
        data: {
          userId: connection.senderId,
          type: 'CONNECTION_ACCEPTED',
          title: 'Connection accepted',
          message: 'Your connection request was accepted.',
        },
      });
    }

    return res.json({ success: true, data: updated, message: 'Connection updated.' });
  } catch (error) {
    return next(error);
  }
}

export async function deleteConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const id = String(req.params.id);
    const connection = await prisma.connection.findUnique({ where: { id } });
    if (!connection) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Connection not found.' } });
    }

    if (connection.senderId !== userId && connection.receiverId !== userId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You cannot delete this connection.' } });
    }

    await prisma.connection.delete({ where: { id } });
    return res.json({ success: true, message: 'Connection deleted.' });
  } catch (error) {
    return next(error);
  }
}
