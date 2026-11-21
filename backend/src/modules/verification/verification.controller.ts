import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { verificationService } from './verification.service';

export async function createVerificationRequest(req: Request, res: Response) {
  const verification = await verificationService.create(req.user!.userId, req.body);
  return success(res, verification, 'Verification request created.', 201);
}

export async function listVerifications(req: Request, res: Response) {
  return success(res, await verificationService.list(req.user!.userId));
}

export async function reviewVerification(req: Request, res: Response) {
  const verification = await verificationService.review(String(req.params.id), req.body);
  return success(res, verification, 'Verification updated.');
}
