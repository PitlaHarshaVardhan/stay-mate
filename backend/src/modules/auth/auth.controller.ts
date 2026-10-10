import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../../prisma/client';
import { signJwt } from '../../utils/jwt';
import { sendPasswordResetEmail } from './password-reset-email';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(8),
}).refine((value) => Boolean(value.email || value.phone), {
  message: 'Either email or phone is required',
  path: ['email'],
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8).max(128),
});

const isProduction = process.env.NODE_ENV === 'production';
const authCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' as const : 'lax' as const,
  secure: isProduction,
};

export async function registerUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);

    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailExists) {
      return res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } });
    }

    const phoneExists = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (phoneExists) {
      return res.status(409).json({ success: false, error: { code: 'PHONE_EXISTS', message: 'Phone already registered' } });
    }

    const passwordHash = await argon2.hash(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
      },
    });

    const token = signJwt({ userId: user.id, role: user.role });
    res.cookie('token', token, authCookieOptions);

    return res.status(201).json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email },
      message: 'User registered successfully',
    });
  } catch (error) {
    return next(error);
  }
}

export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email ?? '' }, { phone: data.phone ?? '' }],
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' } });
    }

    const valid = await argon2.verify(user.passwordHash, data.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' } });
    }

    const token = signJwt({ userId: user.id, role: user.role });
    res.cookie('token', token, authCookieOptions);

    return res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email },
      message: 'Login successful',
    });
  } catch (error) {
    return next(error);
  }
}

export async function requestPasswordReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
      ]);

      const resetUrl = new URL('/reset-password', process.env.CLIENT_URL ?? 'http://localhost:5173');
      resetUrl.searchParams.set('token', token);

      try {
        await sendPasswordResetEmail(user.email, resetUrl.toString());
      } catch (error) {
        console.error('Could not send password reset email:', error);
      }
    }

    return res.json({
      success: true,
      message: 'If an account exists for that email, password reset instructions will be sent shortly.',
    });
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const resetRecord = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetRecord || resetRecord.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RESET_TOKEN', message: 'This password reset link is invalid or expired.' },
      });
    }

    const passwordHash = await argon2.hash(password);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: resetRecord.userId } }),
    ]);

    return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    return next(error);
  }
}

export async function logoutUser(_req: Request, res: Response) {
  res.clearCookie('token', authCookieOptions);
  return res.json({ success: true, message: 'Logged out successfully' });
}

export async function getCurrentUser(req: Request, res: Response) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No authentication token' } });
  }

  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret') as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            profilePhoto: true,
            occupationType: true,
            bio: true,
            college: true,
            company: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }

    return res.json({ success: true, data: { user } });
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' } });
  }
}
