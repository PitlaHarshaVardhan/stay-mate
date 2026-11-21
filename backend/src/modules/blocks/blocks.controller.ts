import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { blocksService } from './blocks.service';

export async function blockUser(req: Request, res: Response) {
  const block = await blocksService.block(req.user!.userId, req.body.blockedId);
  return success(res, block, 'User blocked.', 201);
}

export async function unblockUser(req: Request, res: Response) {
  await blocksService.unblock(req.user!.userId, String(req.params.userId));
  return success(res, undefined, 'User unblocked.');
}
