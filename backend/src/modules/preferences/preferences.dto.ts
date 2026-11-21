import { z } from 'zod';

export const preferenceSchema = z.object({
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
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
}).strict();
