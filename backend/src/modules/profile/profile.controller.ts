import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';

const profileSchema = z.object({
  profilePhoto: z.string().optional(),
  age: z.number().int().min(18).max(80).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  occupationType: z.enum(['STUDENT', 'EMPLOYEE', 'INTERN', 'OTHER']).optional(),
  college: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(250).optional(),
});

export async function upsertProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const payload = profileSchema.parse(req.body);
    const profile = await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...payload },
      update: payload,
    });

    return res.json({ success: true, data: profile, message: 'Profile saved' });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const profile = await prisma.profile.findUnique({ where: { userId } });
    return res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
}
