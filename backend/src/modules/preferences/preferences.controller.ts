import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';

const preferenceSchema = z.object({
  city: z.string().min(2),
  area: z.string().min(2),
  budgetMin: z.number().int().min(0),
  budgetMax: z.number().int().min(0),
  moveInDate: z.coerce.date(),
  roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_PLUS', 'ANY']),
  roommatesRequired: z.number().int().min(1).max(4),
  smokingPreference: z.enum(['SMOKER', 'NON_SMOKER', 'NO_PREFERENCE']),
  drinkingPreference: z.enum(['DRINKER', 'NON_DRINKER', 'NO_PREFERENCE']),
  foodPreference: z.enum(['VEG', 'NON_VEG', 'VEGAN', 'ANY']),
  sleepSchedule: z.enum(['EARLY', 'LATE', 'FLEXIBLE']),
  cleanlinessPreference: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  genderPreference: z.enum(['MALE', 'FEMALE', 'ANY']),
});

export async function upsertPreference(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const payload = preferenceSchema.parse(req.body);
    const preference = await prisma.preference.upsert({
      where: { userId },
      create: { userId, ...payload },
      update: payload,
    });

    return res.json({ success: true, data: preference, message: 'Preference saved' });
  } catch (error) {
    next(error);
  }
}

export async function getPreference(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });

    const preference = await prisma.preference.findUnique({ where: { userId } });
    return res.json({ success: true, data: preference });
  } catch (error) {
    next(error);
  }
}
