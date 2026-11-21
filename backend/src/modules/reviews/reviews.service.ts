import { badRequest, conflict, notFound } from '../../errors/AppError';
import { reviewsRepository } from './reviews.repository';

export const reviewsService = {
  async createPropertyReview(userId: string, input: { propertyId: string; rating: number; review: string }) {
    if (!await reviewsRepository.findProperty(input.propertyId)) {
      throw notFound('Property not found.', 'PROPERTY_NOT_FOUND');
    }
    if (await reviewsRepository.findPropertyReview(input.propertyId, userId)) {
      throw conflict('You have already reviewed this property.', 'DUPLICATE_REVIEW');
    }
    return reviewsRepository.createPropertyReview({ ...input, userId });
  },
  async createUserReview(reviewerId: string, input: { revieweeId: string; rating: number; review: string }) {
    if (reviewerId === input.revieweeId) throw badRequest('You cannot review yourself.');
    return reviewsRepository.createUserReview({ reviewerId, ...input });
  },
  listPropertyReviews(propertyId: string) {
    return reviewsRepository.findPropertyReviews(propertyId);
  },
  listUserReviews(revieweeId: string) {
    return reviewsRepository.findUserReviews(revieweeId);
  },
};
