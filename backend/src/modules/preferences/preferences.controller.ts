import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { preferencesService } from './preferences.service';

export async function upsertPreference(req: Request, res: Response) {
  const preference = await preferencesService.save(req.user!.userId, req.body);
  return success(res, preference, 'Preference saved');
}

export async function getPreference(req: Request, res: Response) {
  const preference = await preferencesService.get(req.user!.userId);
  return success(res, preference);
}
