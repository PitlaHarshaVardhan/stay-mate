import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import {
  createProperty,
  getProperty,
  getPropertyAdmin,
  listMyProperties,
  listProperties,
  matchGroupToProperties,
  requestPropertyInterest,
  reviewProperty,
  toggleSavedProperty,
  updateProperty,
} from './properties.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { propertyInterestSchema, propertyListQuerySchema, propertyReviewSchema, propertySchema } from './properties.dto';

const router = Router();

router.get('/search', validate(propertyListQuerySchema, 'query'), asyncHandler(listProperties));
router.get('/group/:groupId/matches', requireAuth, asyncHandler(matchGroupToProperties));
router.get('/admin', requireAuth, requireAdmin, asyncHandler(getPropertyAdmin));
router.get('/my', requireAuth, asyncHandler(listMyProperties));
router.post('/', requireAuth, validate(propertySchema), asyncHandler(createProperty));
router.get('/:id', asyncHandler(getProperty));
router.put('/:id', requireAuth, validate(propertySchema.partial()), asyncHandler(updateProperty));
router.post('/:id/save', requireAuth, asyncHandler(toggleSavedProperty));
router.post('/:id/interest', requireAuth, validate(propertyInterestSchema), asyncHandler(requestPropertyInterest));
router.post('/:id/verify', requireAuth, requireAdmin, validate(propertyReviewSchema), asyncHandler(reviewProperty));

export default router;
