import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';

const propertyReviewSchema = z.object({
  propertyId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  review: z.string().min(3).max(1000),
});

const userReviewSchema = z.object({
  revieweeId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  review: z.string().min(3).max(1000),
});

export async function createPropertyReview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const payload = propertyReviewSchema.parse(req.body);

    const property = await prisma.property.findUnique({ where: { id: payload.propertyId } });
    if (!property) {
      return res.status(404).json({ success: false, error: { code: 'PROPERTY_NOT_FOUND', message: 'Property not found.' } });
    }

    const existing = await prisma.propertyReview.findFirst({
      where: { propertyId: payload.propertyId, userId },
    });

    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'DUPLICATE_REVIEW', message: 'You have already reviewed this property.' } });
    }

    const review = await prisma.propertyReview.create({
      data: {
        propertyId: payload.propertyId,
        userId,
        rating: payload.rating,
        review: payload.review,
      },
    });

    return res.status(201).json({ success: true, data: review, message: 'Property review submitted.' });
  } catch (error) {
    return next(error);
  }
}

export async function createUserReview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const payload = userReviewSchema.parse(req.body);

    if (userId === payload.revieweeId) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'You cannot review yourself.' } });
    }

    const review = await prisma.userReview.create({
      data: {
        reviewerId: userId,
        revieweeId: payload.revieweeId,
        rating: payload.rating,
        review: payload.review,
      },
    });

    return res.status(201).json({ success: true, data: review, message: 'User review submitted.' });
  } catch (error) {
    return next(error);
  }
}

export async function listPropertyReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const propertyId = String(req.params.propertyId);
    const reviews = await prisma.propertyReview.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true } } },
    });

    return res.json({ success: true, data: reviews });
  } catch (error) {
    return next(error);
  }
}

export async function listUserReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const revieweeId = String(req.params.userId);
    const reviews = await prisma.userReview.findMany({
      where: { revieweeId },
      orderBy: { createdAt: 'desc' },
      include: { reviewer: { select: { id: true, name: true } } },
    });

    return res.json({ success: true, data: reviews });
  } catch (error) {
    return next(error);
  }
}
