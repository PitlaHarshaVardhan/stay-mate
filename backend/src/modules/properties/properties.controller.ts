import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { propertiesService } from './properties.service';

export async function listProperties(req: Request, res: Response) {
  return success(res, await propertiesService.list(req.query as Record<string, unknown>));
}

export async function getProperty(req: Request, res: Response) {
  return success(res, await propertiesService.get(String(req.params.id)));
}

export async function listMyProperties(req: Request, res: Response) {
  return success(res, await propertiesService.listMine(req.user!.userId));
}

export async function createProperty(req: Request, res: Response) {
  const property = await propertiesService.create(req.user!.userId, req.user!.role, req.body);
  return success(res, property, 'Property listing created.', 201);
}

export async function updateProperty(req: Request, res: Response) {
  const property = await propertiesService.update(req.user!.userId, req.user!.role, String(req.params.id), req.body);
  return success(res, property, 'Property updated.');
}

export async function toggleSavedProperty(req: Request, res: Response) {
  const result = await propertiesService.toggleSaved(req.user!.userId, String(req.params.id));
  return success(res, result, result.saved ? 'Property saved.' : 'Property removed from saved list.', result.saved ? 201 : 200);
}

export async function requestPropertyInterest(req: Request, res: Response) {
  const interest = await propertiesService.requestInterest(req.user!.userId, String(req.params.id), req.body);
  return success(res, interest, 'Property interest submitted.', 201);
}

export async function reviewProperty(req: Request, res: Response) {
  const property = await propertiesService.review(req.user!.role, String(req.params.id), req.body);
  return success(res, property, 'Property status updated.');
}

export async function matchGroupToProperties(req: Request, res: Response) {
  return success(res, await propertiesService.matchGroup(String(req.params.groupId)));
}

export async function getPropertyAdmin(req: Request, res: Response) {
  return success(res, await propertiesService.adminList(req.user!.role));
}
