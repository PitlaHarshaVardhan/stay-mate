import { verificationRepository } from './verification.repository';

export const verificationService = {
  create(userId: string, input: { type: any; status: any; rejectionReason?: string }) {
    return verificationRepository.create({
      userId,
      type: input.type,
      status: input.status,
      rejectionReason: input.rejectionReason ?? null,
    });
  },
  list(userId: string) {
    return verificationRepository.findMany(userId);
  },
  review(id: string, input: { status?: any; rejectionReason?: string }) {
    return verificationRepository.update(id, {
      status: input.status ?? 'PENDING',
      rejectionReason: input.rejectionReason ?? null,
    });
  },
};
