import { prisma } from '../../prisma/client';

export const reportsRepository = {
  create(data: Record<string, unknown>) {
    return prisma.report.create({ data: data as any });
  },
  findMany() {
    return prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: { reportedBy: { select: { id: true, name: true } }, reportedUser: { select: { id: true, name: true } } },
    });
  },
};
