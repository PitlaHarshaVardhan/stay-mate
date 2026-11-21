import { prisma } from '../../prisma/client';

export const authRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findByPhone(phone: string) {
    return prisma.user.findUnique({ where: { phone } });
  },

  findForLogin(email: string, phone: string) {
    return prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
  },

  createUser(data: { name: string; email: string; phone: string; passwordHash: string }) {
    return prisma.user.create({ data });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  },

  replacePasswordResetTokens(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } }),
    ]);
  },

  findPasswordResetToken(tokenHash: string) {
    return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  },

  resetPassword(userId: string, passwordHash: string) {
    return prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
    ]);
  },
};
