import { prisma } from '../../prisma/client';

export const verificationRepository = {
  create(data: Record<string, unknown>) {
    return prisma.verification.create({ data: data as any });
  },
  findMany(userId: string) {
    return prisma.verification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  },
  update(id: string, data: Record<string, unknown>) {
    return prisma.verification.update({ where: { id }, data: data as any });
  },
};
