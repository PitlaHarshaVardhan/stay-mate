import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { calculateCompatibilityScore } from './matching.service';

export async function getMatchingPeople(req: Request, res: Response, next: NextFunction) {
  try {
    const currentUserId = req.query.userId as string;
    if (!currentUserId) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_USER_ID', message: 'userId query param is required' } });
    }

    const [currentPref, currentProfile, blockedRecords] = await Promise.all([
      prisma.preference.findUnique({ where: { userId: currentUserId } }),
      prisma.profile.findUnique({ where: { userId: currentUserId } }),
      prisma.blockedUser.findMany({
        where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
      }),
    ]);

    if (!currentPref) {
      return res.status(404).json({ success: false, error: { code: 'PREFERENCE_NOT_FOUND', message: 'User preference profile not found' } });
    }

    const blockedIds = blockedRecords.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId));
    const excludedUserIds = [currentUserId, ...blockedIds];

    const candidates = await prisma.preference.findMany({
      where: { userId: { notIn: excludedUserIds } },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    const prefWithProfile = { ...currentPref, occupationType: currentProfile?.occupationType };

    const results = candidates.map((candidate: any) => ({
      user: {
        id: candidate.user.id,
        name: candidate.user.name,
      },
      profile: candidate.user.profile,
      preference: candidate,
      compatibilityScore: calculateCompatibilityScore(prefWithProfile, {
        ...candidate,
        occupationType: candidate.user?.profile?.occupationType,
      }),
    })).sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore);

    return res.json({ success: true, data: results });
  } catch (error) {
    return next(error);
  }
}
