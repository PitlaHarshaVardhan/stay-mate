import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createReport, listReports } from './reports.controller';

const router = Router();

router.use(requireAuth);
router.post('/', createReport);
router.get('/', listReports);

export default router;
