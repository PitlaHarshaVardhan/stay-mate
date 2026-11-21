import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createGroup, handleJoinRequest, listGroupRequests, listGroups, requestJoinGroup } from './groups.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { groupSchema, handleJoinRequestSchema } from './groups.dto';

const router = Router();

router.use(requireAuth);
router.post('/', validate(groupSchema), asyncHandler(createGroup));
router.get('/', asyncHandler(listGroups));
router.post('/:groupId/join', asyncHandler(requestJoinGroup));
router.get('/requests', asyncHandler(listGroupRequests));
router.get('/:groupId/requests', asyncHandler(listGroupRequests));
router.put('/:groupId/requests/:requestId', validate(handleJoinRequestSchema), asyncHandler(handleJoinRequest));

export default router;
