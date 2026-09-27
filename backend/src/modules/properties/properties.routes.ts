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

const router = Router();

router.get('/search', listProperties);
router.get('/group/:groupId/matches', requireAuth, matchGroupToProperties);
router.get('/admin', requireAuth, requireAdmin, getPropertyAdmin);
router.get('/my', requireAuth, listMyProperties);
router.post('/', requireAuth, createProperty);
router.get('/:id', getProperty);
router.put('/:id', requireAuth, updateProperty);
router.post('/:id/save', requireAuth, toggleSavedProperty);
router.post('/:id/interest', requireAuth, requestPropertyInterest);
router.post('/:id/verify', requireAuth, requireAdmin, reviewProperty);

export default router;
