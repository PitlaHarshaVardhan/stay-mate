import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { getMatchingPeopleForUser } from './matching.service';

export async function getMatchingPeople(req: Request, res: Response) {
  const results = await getMatchingPeopleForUser(req.user!.userId);
  return success(res, results);
}
