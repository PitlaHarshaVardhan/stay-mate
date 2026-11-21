import { Request, Response } from 'express';
import { success } from '../../utils/response';
import { authService } from './auth.service';
import type { LoginInput, RegisterInput } from './auth.dto';

const isProduction = process.env.NODE_ENV === 'production';
const authCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' as const : 'lax' as const,
  secure: isProduction,
};

export async function registerUser(req: Request, res: Response) {
  const result = await authService.register(req.body as RegisterInput);
  res.cookie('token', result.token, authCookieOptions);
  return success(res, result.user, 'User registered successfully', 201);
}

export async function loginUser(req: Request, res: Response) {
  const result = await authService.login(req.body as LoginInput);
  res.cookie('token', result.token, authCookieOptions);
  return success(res, result.user, 'Login successful');
}

export async function requestPasswordReset(req: Request, res: Response) {
  const result = await authService.requestPasswordReset(req.body.email as string);
  return success(res, result.resetUrl ? { resetUrl: result.resetUrl } : undefined,
    'If an account exists for that email, a password reset link has been sent.');
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body.token as string, req.body.password as string);
  return success(res, undefined, 'Password reset successfully. You can now log in.');
}

export async function logoutUser(_req: Request, res: Response) {
  res.clearCookie('token', authCookieOptions);
  return success(res, undefined, 'Logged out successfully');
}

export async function getCurrentUser(req: Request, res: Response) {
  const user = await authService.getCurrentUser(req.user!.userId);
  return success(res, { user });
}
