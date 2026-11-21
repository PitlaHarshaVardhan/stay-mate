import { conflict, forbidden, notFound } from '../../errors/AppError';
import { groupsRepository } from './groups.repository';

export const groupsService = {
  create(ownerId: string, input: Record<string, unknown>) {
    return groupsRepository.create(ownerId, input);
  },
  list() {
    return groupsRepository.findMany();
  },
  async requestJoin(userId: string, groupId: string) {
    const group = await groupsRepository.findById(groupId);
    if (!group) throw notFound('Group not found.');
    if (await groupsRepository.findActiveMember(groupId, userId)) {
      throw conflict('You are already a member.', 'ALREADY_MEMBER');
    }
    return groupsRepository.createJoinRequest(groupId, userId);
  },
  listRequests(ownerId: string, groupId?: string) {
    return groupsRepository.findRequestsForOwner(ownerId, groupId);
  },
  async handleJoinRequest(ownerId: string, requestId: string, status: 'ACCEPTED' | 'REJECTED') {
    const request = await groupsRepository.findJoinRequest(requestId);
    if (!request) throw notFound('Request not found.');
    const group = await groupsRepository.findById(request.groupId);
    if (!group) throw notFound('Group not found.', 'GROUP_NOT_FOUND');
    if (group.ownerId !== ownerId) {
      throw forbidden('Only the group admin can manage requests.');
    }
    return groupsRepository.handleJoinRequest(requestId, status);
  },
};
