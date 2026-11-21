import { profileRepository } from './profile.repository';

export const profileService = {
  get(userId: string) {
    return profileRepository.findByUserId(userId);
  },
  save(userId: string, data: Record<string, unknown>) {
    return profileRepository.upsert(userId, data);
  },
};
