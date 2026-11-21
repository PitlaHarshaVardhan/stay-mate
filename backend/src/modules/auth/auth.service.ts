import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { signJwt } from '../../utils/jwt';
import { config } from '../../config';
import { badRequest, conflict, unauthorized } from '../../errors/AppError';
import { authRepository } from './auth.repository';
import type { LoginInput, RegisterInput } from './auth.dto';
import { sendPasswordResetEmail } from './password-reset-email';

export const authService = {
  async register(input: RegisterInput) {
    if (await authRepository.findByEmail(input.email)) {
      throw conflict('Email already registered', 'EMAIL_EXISTS');
    }
    if (await authRepository.findByPhone(input.phone)) {
      throw conflict('Phone already registered', 'PHONE_EXISTS');
    }

    const passwordHash = await argon2.hash(input.password);
    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
    });
    const token = signJwt({ userId: user.id, role: user.role });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  },

  async login(input: LoginInput) {
    const user = await authRepository.findForLogin(input.email ?? '', input.phone ?? '');
    if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
      throw unauthorized('Invalid email/phone or password');
    }
    const token = signJwt({ userId: user.id, role: user.role });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  },

  async getCurrentUser(userId: string) {
    const user = await authRepository.findById(userId);
    if (!user) throw unauthorized('User not found');
    return user;
  },

  async requestPasswordReset(email: string) {
    const user = await authRepository.findByEmail(email);
    if (!user) return { resetUrl: undefined };

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await authRepository.replacePasswordResetTokens(user.id, tokenHash, expiresAt);

    const resetLink = new URL('/reset-password', config.clientUrl);
    resetLink.searchParams.set('token', token);
    await sendPasswordResetEmail(user.email, resetLink.toString());

    return {
      resetUrl: config.nodeEnv !== 'production' ? resetLink.toString() : undefined,
    };
  },

  async resetPassword(token: string, password: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetRecord = await authRepository.findPasswordResetToken(tokenHash);
    if (!resetRecord || resetRecord.expiresAt <= new Date()) {
      throw badRequest('This password reset link is invalid or expired.', 'INVALID_RESET_TOKEN');
    }
    const passwordHash = await argon2.hash(password);
    await authRepository.resetPassword(resetRecord.userId, passwordHash);
  },
};
