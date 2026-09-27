import { Router } from 'express';
import { getCurrentUser, loginUser, logoutUser, registerUser } from './auth.controller';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', getCurrentUser);

export default router;
