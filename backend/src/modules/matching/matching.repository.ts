import { prisma } from '../../prisma/client';

export const matchingRepository = {
  findCurrentData(userId: string) {
    return Promise.all([
      prisma.preference.findUnique({ where: { userId } }),
      prisma.profile.findUnique({ where: { userId } }),
      prisma.blockedUser.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      }),
    ]);
  },
  findCandidates(excludedUserIds: string[]) {
    return prisma.preference.findMany({
      where: { userId: { notIn: excludedUserIds } },
      include: { user: { include: { profile: true } } },
    });
  },
};
