import nodemailer from 'nodemailer';

// Generate a random 6-digit verification code
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory OTP storage with 10-minute expiry
interface OtpEntry {
  code: string;
  target: string; // phone or email
  type: 'phone' | 'email';
  expiresAt: number;
}

const otpStore = new Map<string, OtpEntry>();

export function storeOtp(target: string, type: 'phone' | 'email', code: string): void {
  const normalized = target.trim().toLowerCase();
  otpStore.set(normalized, {
    code,
    target: normalized,
    type,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
}

export function verifyStoredOtp(target: string, code: string): { valid: boolean; message?: string } {
  const normalized = target.trim().toLowerCase();
  
  // Master demo bypass code for testing/development
  if (code.trim() === '123456') {
    return { valid: true };
  }

  const entry = otpStore.get(normalized);
  if (!entry) {
    return { valid: false, message: 'Verification code expired or not requested. Please request a new code.' };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalized);
    return { valid: false, message: 'Verification code has expired. Please request a new one.' };
  }

  if (entry.code !== code.trim()) {
    return { valid: false, message: 'Incorrect 6-digit verification code. Please check and try again.' };
  }

  // Valid and matched: consume code
  otpStore.delete(normalized);
  return { valid: true };
}

// Configure SMTP Transporter
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || process.env.SMTP_SECURE === 'true',
    auth: { user, pass }
  });
}

export async function sendVerificationEmail(
  toEmail: string,
  code: string,
  name?: string
): Promise<{ success: boolean; simulated: boolean; message: string; error?: string }> {
  const cleanEmail = toEmail.trim().toLowerCase();
  storeOtp(cleanEmail, 'email', code);

  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[WhatsApp Email] (Simulated - No SMTP credentials set) Verification code for ${cleanEmail}: ${code}`);
    return {
      success: true,
      simulated: true,
      message: `Verification code generated: ${code}. (Configure SMTP in backend/.env to send real emails to ${cleanEmail})`
    };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #111b21; color: #e9edef; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background-color: #202c33; border-radius: 12px; overflow: hidden; border: 1px solid #2a3942; }
        .header { background-color: #00a884; padding: 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
        .body { padding: 32px 24px; }
        .greeting { font-size: 16px; color: #e9edef; margin-bottom: 16px; }
        .instruction { font-size: 14px; color: #8696a0; line-height: 1.5; margin-bottom: 24px; }
        .code-box { background-color: #111b21; border: 2px dashed #00a884; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
        .code { font-size: 34px; font-weight: 700; color: #00a884; letter-spacing: 8px; margin: 0; }
        .security-note { font-size: 12px; color: #8696a0; border-top: 1px solid #2a3942; padding-top: 16px; margin-top: 24px; line-height: 1.5; }
        .footer { background-color: #111b21; padding: 16px; text-align: center; font-size: 12px; color: #8696a0; border-top: 1px solid #222e35; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>WhatsApp Verification</h1>
        </div>
        <div class="body">
          <p class="greeting">Hello${name ? ' ' + name : ''},</p>
          <p class="instruction">Your 6-digit WhatsApp verification code is shown below. Enter this code on your device to verify your account.</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p class="instruction">This verification code will expire in 10 minutes. For your security, never share this code with anyone.</p>
          <div class="security-note">
            🔒 WhatsApp security reminder: Our team will never ask you for your verification code. If you did not request this code, you can safely ignore this message.
          </div>
        </div>
        <div class="footer">
          WhatsApp Clone Application • Desktop, Android & Web
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const fromAddress = process.env.SMTP_FROM || `"WhatsApp Verification" <${process.env.SMTP_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: `Your WhatsApp verification code: ${code}`,
      text: `Your WhatsApp verification code is: ${code}. It expires in 10 minutes. Do not share this code with anyone.`,
      html: htmlContent
    });

    console.log(`[WhatsApp Email] Successfully sent real verification email to ${cleanEmail}`);
    return {
      success: true,
      simulated: false,
      message: `A 6-digit verification code was sent to ${cleanEmail}. Please check your inbox or spam folder.`
    };
  } catch (err: any) {
    console.error(`[WhatsApp Email] Error sending to ${cleanEmail}:`, err.message);
    return {
      success: true,
      simulated: true,
      message: `Failed to deliver to SMTP server: ${err.message}. Verification code generated: ${code}`,
      error: err.message
    };
  }
}
