import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { calculateCompatibilityScore } from './matching.service';

export async function getMatchingPeople(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUserId = req.query.userId as string;
    if (!currentUserId) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_USER_ID', message: 'userId query param is required' } });
    }

    const currentPref = await prisma.preference.findUnique({ where: { userId: currentUserId } });
    if (!currentPref) {
      return res.status(404).json({ success: false, error: { code: 'PREFERENCE_NOT_FOUND', message: 'User preference profile not found' } });
    }

    const candidates = await prisma.preference.findMany({
      where: { userId: { not: currentUserId } },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    const results = candidates.map((candidate: any) => ({
      user: {
        id: candidate.user.id,
        name: candidate.user.name,
      },
      profile: candidate.user.profile,
      preference: candidate,
      compatibilityScore: calculateCompatibilityScore(currentPref, candidate),
    })).sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore);

    return res.json({ success: true, data: results });
  } catch (error) {
    return next(error);
  }
}
