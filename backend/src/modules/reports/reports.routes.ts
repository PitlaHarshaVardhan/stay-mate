import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createReport, listReports } from './reports.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { reportSchema } from './reports.dto';

const router = Router();

router.use(requireAuth);
router.post('/', validate(reportSchema), asyncHandler(createReport));
router.get('/', asyncHandler(listReports));

export default router;
