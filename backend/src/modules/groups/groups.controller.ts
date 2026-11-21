import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { groupsService } from './groups.service';

export async function createGroup(req: Request, res: Response) {
  const group = await groupsService.create(req.user!.userId, req.body);
  return success(res, group, 'Group created.', 201);
}

export async function listGroups(_req: Request, res: Response) {
  return success(res, await groupsService.list());
}

export async function requestJoinGroup(req: Request, res: Response) {
  const request = await groupsService.requestJoin(req.user!.userId, String(req.params.groupId));
  return success(res, request, 'Join request sent.', 201);
}

export async function listGroupRequests(req: Request, res: Response) {
  const requests = await groupsService.listRequests(
    req.user!.userId,
    req.params.groupId ? String(req.params.groupId) : undefined,
  );
  return success(res, requests);
}

export async function handleJoinRequest(req: Request, res: Response) {
  const updated = await groupsService.handleJoinRequest(
    req.user!.userId,
    String(req.params.requestId),
    req.body.status,
  );
  return success(res, updated, 'Join request updated.');
}
