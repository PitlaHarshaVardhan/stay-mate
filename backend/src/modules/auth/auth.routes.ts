import { Router } from 'express';
import { getCurrentUser, loginUser, logoutUser, registerUser, requestPasswordReset, resetPassword } from './auth.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from './auth.dto';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(registerUser));
router.post('/login', validate(loginSchema), asyncHandler(loginUser));
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(requestPasswordReset));
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(resetPassword));
router.post('/logout', asyncHandler(logoutUser));
router.get('/me', requireAuth, asyncHandler(getCurrentUser));

export default router;
