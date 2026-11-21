import { badRequest, notFound } from '../../errors/AppError';
import { blocksRepository } from './blocks.repository';

export const blocksService = {
  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw badRequest('You cannot block yourself.');
    return blocksRepository.upsert(blockerId, blockedId);
  },
  async unblock(blockerId: string, blockedId: string) {
    try {
      await blocksRepository.delete(blockerId, blockedId);
    } catch {
      throw notFound('No block found.');
    }
  },
};
