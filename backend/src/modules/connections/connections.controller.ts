import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { connectionsService } from './connections.service';

export async function createConnection(req: Request, res: Response) {
  const connection = await connectionsService.create(req.user!.userId, req.body.receiverId);
  return success(res, connection, 'Connection request sent.', 201);
}

export async function getConnections(req: Request, res: Response) {
  const connections = await connectionsService.getMany(req.user!.userId);
  return success(res, connections);
}

export async function updateConnection(req: Request, res: Response) {
  const connection = await connectionsService.update(req.user!.userId, String(req.params.id), req.body.status);
  return success(res, connection, 'Connection updated.');
}

export async function deleteConnection(req: Request, res: Response) {
  await connectionsService.delete(req.user!.userId, String(req.params.id));
  return success(res, undefined, 'Connection deleted.');
}
