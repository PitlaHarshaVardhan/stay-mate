import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { profileService } from './profile.service';

export async function upsertProfile(req: Request, res: Response) {
  const profile = await profileService.save(req.user!.userId, req.body);
  return success(res, profile, 'Profile saved');
}

export async function getProfile(req: Request, res: Response) {
  const profile = await profileService.get(req.user!.userId);
  return success(res, profile);
}
