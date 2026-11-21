import { prisma } from '../../prisma/client';

export const preferencesRepository = {
  findByUserId(userId: string) {
    return prisma.preference.findUnique({ where: { userId } });
  },
  upsert(userId: string, data: Record<string, unknown>) {
    return prisma.preference.upsert({
      where: { userId },
      create: { userId, ...data } as any,
      update: data,
    });
  },
};
