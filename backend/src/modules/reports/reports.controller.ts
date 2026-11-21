import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { reportsService } from './reports.service';

export async function createReport(req: Request, res: Response) {
  const report = await reportsService.create(req.user!.userId, req.body);
  return success(res, report, 'Report submitted.', 201);
}

export async function listReports(_req: Request, res: Response) {
  return success(res, await reportsService.list());
}
