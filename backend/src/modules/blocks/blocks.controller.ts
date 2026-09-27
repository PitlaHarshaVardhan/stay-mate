import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';

const blockSchema = z.object({
  blockedId: z.string().min(1),
});

export async function blockUser(req: Request, res: Response, next: NextFunction) {
  try {
    const blockerId = req.user?.userId;
    if (!blockerId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const body = blockSchema.parse(req.body);

    if (blockerId === body.blockedId) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'You cannot block yourself.' } });
    }

    const block = await prisma.blockedUser.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: body.blockedId,
        },
      },
      create: {
        blockerId,
        blockedId: body.blockedId,
      },
      update: {},
    });

    return res.status(201).json({ success: true, data: block, message: 'User blocked.' });
  } catch (error) {
    return next(error);
  }
}

export async function unblockUser(req: Request, res: Response, next: NextFunction) {
  try {
    const blockerId = req.user?.userId;
    if (!blockerId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const blockedId = String(req.params.userId);
    await prisma.blockedUser.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    }).catch(() => {
      throw new Error('No block found.');
    });

    return res.json({ success: true, message: 'User unblocked.' });
  } catch (error) {
    return next(error);
  }
}
