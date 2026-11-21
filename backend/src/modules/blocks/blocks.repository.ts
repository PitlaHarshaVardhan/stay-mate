import { prisma } from '../../prisma/client';

export const blocksRepository = {
  upsert(blockerId: string, blockedId: string) {
    return prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  },
  delete(blockerId: string, blockedId: string) {
    return prisma.blockedUser.delete({ where: { blockerId_blockedId: { blockerId, blockedId } } });
  },
};
