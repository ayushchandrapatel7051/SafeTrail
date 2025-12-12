import nodemailer, { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (transporter) {
    return transporter;
  }

  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // Use TLS (not SSL)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };

  console.log('📧 SMTP Configuration:');
  console.log(`   Host: ${smtpConfig.host}`);
  console.log(`   Port: ${smtpConfig.port}`);
  console.log(`   User: ${smtpConfig.auth.user}`);
  console.log(`   Pass: ${smtpConfig.auth.pass ? '***configured***' : 'NOT SET'}`);

  transporter = nodemailer.createTransport(smtpConfig);

  return transporter;
};

export const sendVerificationOTP = async (email: string, otp: string, fullName: string) => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || 'SafeTrail <noreply@safetrail.com>',
      to: email,
      subject: 'Your SafeTrail Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">SafeTrail</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Email Verification</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
            <h2 style="color: #333; margin-top: 0; font-size: 24px;">Welcome, ${fullName}!</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 15px;">
              Thank you for signing up with SafeTrail. Your verification code is:
            </p>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; border: 2px solid #10b981;">
              <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 2px;">Verification Code</p>
              <p style="margin: 10px 0 0 0; font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px;">${otp}</p>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⏱️ This code expires in 10 minutes.</strong> Do not share it with anyone.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you didn't request this code, you can ignore this email or <a href="${process.env.FRONTEND_URL}/contact" style="color: #10b981; text-decoration: none;">let us know</a>.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              SafeTrail Security • Never share your verification code with anyone<br>
              <a href="${process.env.FRONTEND_URL}" style="color: #10b981; text-decoration: none;">Visit SafeTrail</a>
            </p>
          </div>
        </div>
      `,
    };

    console.log(`📤 Sending OTP email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error(
      `Failed to send verification OTP: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const sendPasswordResetEmail = async (email: string, token: string, fullName: string) => {
  try {
    const transporter = getTransporter();
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'SafeTrail <noreply@safetrail.com>',
      to: email,
      subject: 'Reset Your SafeTrail Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">SafeTrail</h1>
            <p style="margin: 10px 0 0 0;">Password Reset</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${fullName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password. Click the button below to set a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="
                background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
                color: white;
                padding: 12px 40px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                font-weight: bold;
              ">
                Reset Password
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              This link expires in 1 hour.<br>
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    console.log(`📤 Sending password reset email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error(
      `Failed to send password reset email: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
