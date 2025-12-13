import nodemailer from 'nodemailer';
let transporter = null;
const getTransporter = () => {
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
export const sendVerificationOTP = async (email, otp, fullName) => {
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
    }
    catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw new Error(`Failed to send verification OTP: ${error instanceof Error ? error.message : String(error)}`);
    }
};
export const sendPasswordResetEmail = async (email, token, fullName) => {
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
    }
    catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : String(error)}`);
    }
};
// Generic email sending function
export const sendEmail = async (options) => {
    try {
        const transporter = getTransporter();
        const mailOptions = {
            from: process.env.SMTP_FROM || 'SafeTrail <noreply@safetrail.com>',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
        };
        console.log(`📤 Sending email to: ${options.to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully. Message ID: ${info.messageId}`);
        return info;
    }
    catch (error) {
        console.error('❌ Error sending email:', error);
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
};
// Emergency SOS email
export const sendEmergencyEmail = async (options) => {
    try {
        const transporter = getTransporter();
        const mailOptions = {
            from: process.env.SMTP_FROM || 'SafeTrail Emergency <noreply@safetrail.com>',
            to: options.to,
            subject: `🚨 EMERGENCY ALERT: ${options.userName} needs help!`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 32px;">🚨 EMERGENCY ALERT</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; font-weight: bold;">Immediate Assistance Required</p>
          </div>
          
          <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; border: 3px solid #ef4444; border-top: none;">
            <div style="background: #fff; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 20px;">
              <h2 style="color: #dc2626; margin-top: 0; font-size: 22px;">Hi ${options.contactName},</h2>
              
              <p style="color: #333; line-height: 1.6; font-size: 16px;">
                <strong>${options.userName}</strong> has triggered an emergency SOS alert and needs your help!
              </p>
              
              <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #dc2626; font-size: 15px;">
                  <strong>📢 Message:</strong><br>
                  ${options.message}
                </p>
              </div>
            </div>

            <div style="background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px;">📍 Current Location</h3>
              
              <p style="color: #666; margin: 10px 0;">
                <strong>Coordinates:</strong><br>
                Latitude: ${options.latitude}<br>
                Longitude: ${options.longitude}
              </p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${options.locationUrl}" style="
                  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                  color: white;
                  padding: 15px 40px;
                  text-decoration: none;
                  border-radius: 8px;
                  display: inline-block;
                  font-weight: bold;
                  font-size: 16px;
                  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
                ">
                  🗺️ View Location on Google Maps
                </a>
              </div>
            </div>

            <div style="background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; margin-top: 0; font-size: 18px;">👤 User Information</h3>
              
              <p style="color: #666; margin: 5px 0;">
                <strong>Name:</strong> ${options.userName}
              </p>
              <p style="color: #666; margin: 5px 0;">
                <strong>Email:</strong> <a href="mailto:${options.userEmail}" style="color: #10b981; text-decoration: none;">${options.userEmail}</a>
              </p>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ What to do:</strong><br>
                1. Try to contact ${options.userName} immediately<br>
                2. Check their location on the map<br>
                3. If you cannot reach them, consider contacting local emergency services<br>
                4. Keep this email for reference
              </p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              This is an automated emergency alert from SafeTrail<br>
              Time sent: ${new Date().toLocaleString()}<br>
              <a href="${process.env.FRONTEND_URL}" style="color: #10b981; text-decoration: none;">Visit SafeTrail</a>
            </p>
          </div>
        </div>
      `,
            text: `
🚨 EMERGENCY ALERT

${options.contactName},

${options.userName} has triggered an emergency SOS alert and needs your help!

Message: ${options.message}

Current Location:
Latitude: ${options.latitude}
Longitude: ${options.longitude}

View on Google Maps: ${options.locationUrl}

User Information:
Name: ${options.userName}
Email: ${options.userEmail}

What to do:
1. Try to contact ${options.userName} immediately
2. Check their location on the map
3. If you cannot reach them, consider contacting local emergency services

Time: ${new Date().toLocaleString()}

This is an automated emergency alert from SafeTrail.
      `,
        };
        console.log(`🚨 Sending emergency alert to: ${options.to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Emergency email sent successfully to ${options.to}. Message ID: ${info.messageId}`);
        return info;
    }
    catch (error) {
        console.error(`❌ Error sending emergency email to ${options.to}:`, error);
        throw new Error(`Failed to send emergency email: ${error instanceof Error ? error.message : String(error)}`);
    }
};
//# sourceMappingURL=email.js.map