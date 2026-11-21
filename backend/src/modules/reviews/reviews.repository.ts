import { prisma } from '../../prisma/client';

export const reviewsRepository = {
  findProperty(id: string) {
    return prisma.property.findUnique({ where: { id } });
  },
  findPropertyReview(propertyId: string, userId: string) {
    return prisma.propertyReview.findFirst({ where: { propertyId, userId } });
  },
  createPropertyReview(data: Record<string, unknown>) {
    return prisma.propertyReview.create({ data: data as any });
  },
  createUserReview(data: Record<string, unknown>) {
    return prisma.userReview.create({ data: data as any });
  },
  findPropertyReviews(propertyId: string) {
    return prisma.propertyReview.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });
  },
  findUserReviews(revieweeId: string) {
    return prisma.userReview.findMany({
      where: { revieweeId },
      orderBy: { createdAt: 'desc' },
      include: { reviewer: { select: { id: true, name: true } } },
    });
  },
};
