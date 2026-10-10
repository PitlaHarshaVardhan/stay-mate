import { Router } from 'express';
import { getCurrentUser, loginUser, logoutUser, registerUser, requestPasswordReset, resetPassword } from './auth.controller';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/logout', logoutUser);
router.get('/me', getCurrentUser);

export default router;
