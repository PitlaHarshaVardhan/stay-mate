import { preferencesRepository } from './preferences.repository';

export const preferencesService = {
  get(userId: string) {
    return preferencesRepository.findByUserId(userId);
  },
  save(userId: string, data: Record<string, unknown>) {
    return preferencesRepository.upsert(userId, data);
  },
};
