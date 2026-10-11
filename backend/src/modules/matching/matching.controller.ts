import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { buildRankedMatches } from './matching.service';

// Preference fields exposed to the recommendations UI. Everything else on the
// raw Prisma row (id, userId, createdAt, updatedAt and the nested `user`
// relation with email/phone/passwordHash) is stripped so credentials and
// contact details can never reach the response.
function sanitizePreference(preference: any) {
  return {
    city: preference.city,
    area: preference.area,
    budgetMin: preference.budgetMin,
    budgetMax: preference.budgetMax,
    moveInDate: preference.moveInDate,
    roomType: preference.roomType,
    roommatesRequired: preference.roommatesRequired,
    smokingPreference: preference.smokingPreference,
    drinkingPreference: preference.drinkingPreference,
    foodPreference: preference.foodPreference,
    sleepSchedule: preference.sleepSchedule,
    cleanlinessPreference: preference.cleanlinessPreference,
    genderPreference: preference.genderPreference,
    latitude: preference.latitude,
    longitude: preference.longitude,
  };
}

// Profile fields the match cards render. Keeps age, gender, college, company
// and internal ids private — the UI does not need them.
function sanitizeProfile(profile: any) {
  if (!profile) return undefined;
  return {
    profilePhoto: profile.profilePhoto,
    occupationType: profile.occupationType,
    bio: profile.bio,
  };
}

export async function getMatchingPeople(req: Request, res: Response, next: NextFunction) {
  try {
    // Identity comes from the verified JWT (requireAuth) — never the query
    // string — so one user cannot pull another user's recommendation list (IDOR).
    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
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

    const currentMatchingProfile = { ...currentPref, gender: currentProfile?.gender };

    // Everyone is returned — real matches first (ranked by score), then people
    // who fail a hard gate or have too little data to score. buildRankedMatches
    // keeps them all and only sorts, so nobody is silently hidden.
    const results = buildRankedMatches(
      currentMatchingProfile,
      candidates.map((candidate: any) => ({
        userId: candidate.user.id,
        userName: candidate.user.name,
        // Whitelisted before it can reach the response: `candidate` is the raw
        // Prisma row and carries the nested `user` relation (email, phone,
        // passwordHash) plus internal ids/timestamps.
        preference: sanitizePreference(candidate),
        gender: candidate.user?.profile?.gender,
        profile: sanitizeProfile(candidate.user?.profile),
      })),
    );

    return res.json({ success: true, data: results });
  } catch (error) {
    return next(error);
  }
}
