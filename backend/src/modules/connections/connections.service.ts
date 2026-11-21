import { badRequest, conflict, forbidden, notFound } from '../../errors/AppError';
import { AppError } from '../../errors/AppError';
import { chatService } from '../chat/chat.service';
import { connectionsRepository } from './connections.repository';

export const connectionsService = {
  async create(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw badRequest('You cannot connect with yourself.');
    if (await connectionsRepository.findExisting(senderId, receiverId)) {
      throw conflict('Connection already exists.', 'DUPLICATE_CONNECTION');
    }
    if (await connectionsRepository.findBlock(senderId, receiverId)) {
      throw new AppError(403, 'BLOCKED', 'This user is blocked or blocked you.');
    }
    return connectionsRepository.create(senderId, receiverId);
  },
  getMany(userId: string) {
    return connectionsRepository.findMany(userId);
  },
  async update(userId: string, id: string, status: 'ACCEPTED' | 'REJECTED' | 'BLOCKED') {
    const connection = await connectionsRepository.findById(id);
    if (!connection) throw notFound('Connection not found.');
    if (connection.receiverId !== userId) throw forbidden('Only the receiver can accept or reject.');
    const updated = await connectionsRepository.update(id, status);
    if (status === 'ACCEPTED') {
      await chatService.ensureDirectConversation(connection.senderId, connection.receiverId);
      await connectionsRepository.notifyAccepted(connection.senderId);
    }
    return updated;
  },
  async delete(userId: string, id: string) {
    const connection = await connectionsRepository.findById(id);
    if (!connection) throw notFound('Connection not found.');
    if (connection.senderId !== userId && connection.receiverId !== userId) {
      throw forbidden('You cannot delete this connection.');
    }
    await connectionsRepository.delete(id);
  },
};
