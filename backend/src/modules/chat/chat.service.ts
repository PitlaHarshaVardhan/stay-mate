import { badRequest, forbidden, notFound } from '../../errors/AppError';
import { chatRepository } from './chat.repository';

export const chatService = {
  listConversations(userId: string) {
    return chatRepository.listConversations(userId);
  },
  async getConversation(userId: string, conversationId: string) {
    const membership = await chatRepository.findMembership(conversationId, userId);
    if (!membership) throw forbidden('You do not have access to this conversation.');
    const conversation = await chatRepository.getConversation(conversationId);
    if (!conversation) throw notFound('Conversation not found.');
    return conversation;
  },
  async sendMessage(userId: string, conversationId: string, content: string) {
    const membership = await chatRepository.findMembership(conversationId, userId);
    if (!membership) throw forbidden('You are not a member of this conversation.');
    return chatRepository.createMessage(conversationId, userId, content);
  },
  async ensureDirectConversation(userAId: string, userBId: string) {
    if (userAId === userBId) return null;
    return await chatRepository.findDirectConversation(userAId, userBId)
      ?? await chatRepository.createDirectConversation(userAId, userBId);
  },
  async createConversation(userId: string, otherUserId: string) {
    if (userId === otherUserId) throw badRequest('A direct conversation cannot be created with the same user.');
    return chatRepository.findDirectConversation(userId, otherUserId)
      .then((existing) => existing ?? chatRepository.createDirectConversation(userId, otherUserId));
  },
};
