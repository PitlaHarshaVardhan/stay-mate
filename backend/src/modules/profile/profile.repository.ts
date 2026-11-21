import { prisma } from '../../prisma/client';

export const profileRepository = {
  findByUserId(userId: string) {
    return prisma.profile.findUnique({ where: { userId } });
  },
  upsert(userId: string, data: Record<string, unknown>) {
    return prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};
