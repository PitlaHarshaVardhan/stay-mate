import { Router } from 'express';
import { getMatchingPeople } from './matching.controller';

const router = Router();

router.get('/people', getMatchingPeople);

export default router;
