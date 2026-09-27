import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';

const verificationSchema = z.object({
  type: z.enum(['PHONE', 'EMAIL', 'COLLEGE', 'EMPLOYMENT', 'IDENTITY']),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']),
  rejectionReason: z.string().optional(),
});

export async function createVerificationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const payload = verificationSchema.parse(req.body);

    const verification = await prisma.verification.create({
      data: {
        userId,
        type: payload.type,
        status: payload.status,
        rejectionReason: payload.rejectionReason ?? null,
      },
    });

    return res.status(201).json({ success: true, data: verification, message: 'Verification request created.' });
  } catch (error) {
    return next(error);
  }
}

export async function listVerifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const verifications = await prisma.verification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: verifications });
  } catch (error) {
    return next(error);
  }
}

export async function reviewVerification(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } });
    }

    const verificationId = String(req.params.id);
    const payload = verificationSchema.partial().parse(req.body);

    const verification = await prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: payload.status ?? 'PENDING',
        rejectionReason: payload.rejectionReason ?? null,
      },
    });

    return res.json({ success: true, data: verification, message: 'Verification updated.' });
  } catch (error) {
    return next(error);
  }
}
