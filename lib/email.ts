import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send');
    return;
  }

  try {
    await resend.emails.send({
      from: 'Radeya <noreply@radeya-app.vercel.app>',
      to,
      subject: 'Verifikasi Email Radeya Anda',
      html: `<p>Halo ${name},</p><p>Klik link berikut untuk verifikasi email Anda:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>Link berlaku 24 jam.</p>`,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}
