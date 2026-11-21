import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { chatService } from './chat.service';

export async function listConversations(req: Request, res: Response) {
  const conversations = await chatService.listConversations(req.user!.userId);
  return success(res, conversations);
}

export async function getConversation(req: Request, res: Response) {
  const conversation = await chatService.getConversation(req.user!.userId, String(req.params.id));
  return success(res, conversation);
}

export async function sendMessage(req: Request, res: Response) {
  const message = await chatService.sendMessage(req.user!.userId, req.body.conversationId, req.body.content);
  return success(res, message, 'Message sent.', 201);
}

export async function createConversation(req: Request, res: Response) {
  const conversation = await chatService.createConversation(req.user!.userId, req.body.otherUserId);
  return success(res, conversation, 'Conversation ready.', 201);
}
