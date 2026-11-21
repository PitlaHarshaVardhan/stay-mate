import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { reviewsService } from './reviews.service';

export async function createPropertyReview(req: Request, res: Response) {
  const review = await reviewsService.createPropertyReview(req.user!.userId, req.body);
  return success(res, review, 'Property review submitted.', 201);
}

export async function createUserReview(req: Request, res: Response) {
  const review = await reviewsService.createUserReview(req.user!.userId, req.body);
  return success(res, review, 'User review submitted.', 201);
}

export async function listPropertyReviews(req: Request, res: Response) {
  return success(res, await reviewsService.listPropertyReviews(String(req.params.propertyId)));
}

export async function listUserReviews(req: Request, res: Response) {
  return success(res, await reviewsService.listUserReviews(String(req.params.userId)));
}
