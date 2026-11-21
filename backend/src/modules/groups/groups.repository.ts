import { prisma } from '../../prisma/client';

export const groupsRepository = {
  create(ownerId: string, data: Record<string, unknown>) {
    return prisma.$transaction(async (tx) => {
      const group = await tx.group.create({ data: { ownerId, ...data, description: (data.description as string) ?? '' } as any });
      await tx.groupMember.create({ data: { groupId: group.id, userId: ownerId, role: 'ADMIN', status: 'ACTIVE' } });
      return group;
    });
  },
  findMany() {
    return prisma.group.findMany({
      include: {
        owner: { select: { id: true, name: true } },
        members: { where: { status: 'ACTIVE' }, include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
  findById(id: string) {
    return prisma.group.findUnique({ where: { id } });
  },
  findActiveMember(groupId: string, userId: string) {
    return prisma.groupMember.findFirst({ where: { groupId, userId, status: 'ACTIVE' } });
  },
  createJoinRequest(groupId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.groupJoinRequest.create({ data: { groupId, userId, status: 'PENDING' } });
      const group = await tx.group.findUnique({ where: { id: groupId } });
      if (group) {
        await tx.notification.create({
          data: { userId: group.ownerId, type: 'GROUP_JOIN_REQUEST', title: 'New group request', message: 'Someone wants to join your group.' },
        });
      }
      return request;
    });
  },
  findRequestsForOwner(ownerId: string, groupId?: string) {
    return prisma.groupJoinRequest.findMany({
      where: groupId ? { groupId, group: { ownerId } } : { group: { ownerId } },
      include: { user: { select: { id: true, name: true } } },
    });
  },
  findJoinRequest(id: string) {
    return prisma.groupJoinRequest.findUnique({ where: { id } });
  },
  handleJoinRequest(id: string, status: 'ACCEPTED' | 'REJECTED') {
    return prisma.$transaction(async (tx) => {
      const request = await tx.groupJoinRequest.update({ where: { id }, data: { status } });
      if (status === 'ACCEPTED') {
        await tx.groupMember.create({
          data: { groupId: request.groupId, userId: request.userId, role: 'MEMBER', status: 'ACTIVE' },
        });
        await tx.notification.create({
          data: { userId: request.userId, type: 'GROUP_JOIN_ACCEPTED', title: 'Join request accepted', message: 'Your request to join the group was accepted.' },
        });
      }
      return request;
    });
  },
};
