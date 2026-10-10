import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM;

  if (!host || !from) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`Password reset link for ${email}: ${resetUrl}`);
      return;
    }
    throw new Error('SMTP_HOST and SMTP_FROM must be configured to send password reset email.');
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Reset your StayMate password',
    text: `Use this link to reset your StayMate password. It expires in 30 minutes: ${resetUrl}`,
    html: `<p>We received a request to reset your StayMate password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request a reset, you can ignore this email.</p>`,
  });
}