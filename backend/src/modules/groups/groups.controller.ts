import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';

const groupSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  area: z.string().min(2),
  budgetMin: z.number().int().min(0),
  budgetMax: z.number().int().min(0),
  moveInDate: z.coerce.date(),
  targetMembers: z.number().int().min(2).max(10),
  description: z.string().optional(),
});

export async function createGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const body = groupSchema.parse(req.body);

    const group = await prisma.group.create({
      data: {
        ownerId,
        name: body.name,
        city: body.city,
        area: body.area,
        budgetMin: body.budgetMin,
        budgetMax: body.budgetMax,
        moveInDate: body.moveInDate,
        targetMembers: body.targetMembers,
        description: body.description ?? '',
      },
    });

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: ownerId,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    return res.status(201).json({ success: true, data: group, message: 'Group created.' });
  } catch (error) {
    return next(error);
  }
}

export async function listGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const groups = await prisma.group.findMany({
      include: {
        members: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: groups });
  } catch (error) {
    return next(error);
  }
}

export async function requestJoinGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const groupId = String(req.params.groupId);
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Group not found.' } });
    }

    const alreadyMember = await prisma.groupMember.findFirst({ where: { groupId, userId, status: 'ACTIVE' } });
    if (alreadyMember) {
      return res.status(409).json({ success: false, error: { code: 'ALREADY_MEMBER', message: 'You are already a member.' } });
    }

    const request = await prisma.groupJoinRequest.create({
      data: {
        groupId,
        userId,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        userId: group.ownerId,
        type: 'GROUP_JOIN_REQUEST',
        title: 'New group request',
        message: 'Someone wants to join your group.',
      },
    });

    return res.status(201).json({ success: true, data: request, message: 'Join request sent.' });
  } catch (error) {
    return next(error);
  }
}

export async function listGroupRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const requests = await prisma.groupJoinRequest.findMany({
      where: { group: { ownerId: userId } },
      include: { user: { select: { id: true, name: true } } },
    });

    return res.json({ success: true, data: requests });
  } catch (error) {
    return next(error);
  }
}

export async function handleJoinRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const requestId = String(req.params.requestId);
    const { status } = z.object({ status: z.enum(['ACCEPTED', 'REJECTED']) }).parse(req.body);

    const request = await prisma.groupJoinRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found.' } });
    }

    const group = await prisma.group.findUnique({ where: { id: request.groupId } });
    if (!group) {
      return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Group not found.' } });
    }

    if (group.ownerId !== userId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only the group admin can manage requests.' } });
    }

    const updated = await prisma.groupJoinRequest.update({
      where: { id: requestId },
      data: { status },
    });

    if (status === 'ACCEPTED') {
      await prisma.groupMember.create({
        data: {
          groupId: request.groupId,
          userId: request.userId,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });

      await prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'GROUP_JOIN_ACCEPTED',
          title: 'Group request accepted',
          message: 'Your request to join the group was accepted.',
        },
      });
    } else {
      await prisma.notification.create({
        data: {
          userId: request.userId,
          type: 'GROUP_JOIN_REJECTED',
          title: 'Group request rejected',
          message: 'Your request to join the group was rejected.',
        },
      });
    }

    return res.json({ success: true, data: updated, message: 'Request handled.' });
  } catch (error) {
    return next(error);
  }
}
