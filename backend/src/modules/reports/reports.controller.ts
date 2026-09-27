import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';

const reportSchema = z.object({
  reportedUserId: z.string().optional(),
  groupId: z.string().optional(),
  reason: z.enum(['SPAM', 'FAKE_PROFILE', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'FRAUD', 'OTHER']),
  description: z.string().optional(),
}).refine((data) => Boolean(data.reportedUserId || data.groupId), {
  message: 'A report must target a user or a group.',
  path: ['reportedUserId'],
});

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const reportedById = req.user?.userId;
    if (!reportedById) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const body = reportSchema.parse(req.body);

    const report = await prisma.report.create({
      data: {
        reportedById,
        reportedUserId: body.reportedUserId ?? null,
        groupId: body.groupId ?? null,
        reason: body.reason,
        description: body.description ?? '',
      },
    });

    return res.status(201).json({ success: true, data: report, message: 'Report submitted.' });
  } catch (error) {
    return next(error);
  }
}

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reportedBy: { select: { id: true, name: true } },
        reportedUser: { select: { id: true, name: true } },
      },
    });

    return res.json({ success: true, data: reports });
  } catch (error) {
    return next(error);
  }
}
