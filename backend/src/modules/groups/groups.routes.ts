import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createGroup, handleJoinRequest, listGroupRequests, listGroups, requestJoinGroup } from './groups.controller';

const router = Router();

router.use(requireAuth);
router.post('/', createGroup);
router.get('/', listGroups);
router.post('/:groupId/join', requestJoinGroup);
router.get('/:groupId/requests', listGroupRequests);
router.put('/:groupId/requests/:requestId', handleJoinRequest);

export default router;
