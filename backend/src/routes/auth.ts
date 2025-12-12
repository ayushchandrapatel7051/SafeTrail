import { Router } from 'express';
import { query } from '../db/connection.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/jwt.js';
import { sendVerificationOTP } from '../lib/email.js';
import crypto from 'crypto';

const router = Router();

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  email: string;
  password: string;
  full_name: string;
}

// Generate random 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body as { username: string; password: string };

    // Hardcoded admin credentials for simplicity (in production, use database)
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'admin';

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Generate a token for the admin user (using a fake admin user id)
    const token = generateToken(0, 'admin@safetrail.com', 'admin');

    res.json({
      user: {
        id: 0,
        email: 'admin@safetrail.com',
        full_name: 'Admin User',
        role: 'admin',
      },
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body as RegisterBody;

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user (email_verified = false by default)
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role, email_verified',
      [email, passwordHash, full_name, 'user', false]
    );

    const user = result.rows[0];

    // Generate OTP (6 digits)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this user
    await query('DELETE FROM email_verification_otp WHERE user_id = $1', [user.id]);

    // Store OTP in database
    await query(
      'INSERT INTO email_verification_otp (user_id, otp, expires_at) VALUES ($1, $2, $3)',
      [user.id, otp, expiresAt]
    );

    // Send OTP email
    try {
      await sendVerificationOTP(user.email, otp, user.full_name);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Delete user if email sending fails
      await query('DELETE FROM users WHERE id = $1', [user.id]);
      return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
    }

    res.status(201).json({
      message: 'Registration successful. Verification code sent to your email.',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        email_verified: user.email_verified,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body as { email: string; otp: string };

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    // Find user
    const userResult = await query(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Find OTP record
    const otpResult = await query(
      'SELECT id, otp, expires_at, attempts FROM email_verification_otp WHERE user_id = $1',
      [user.id]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
    }

    const otpRecord = otpResult.rows[0];

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      await query('DELETE FROM email_verification_otp WHERE id = $1', [otpRecord.id]);
      return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    }

    // Check attempt limit
    if (otpRecord.attempts >= 5) {
      await query('DELETE FROM email_verification_otp WHERE id = $1', [otpRecord.id]);
      return res.status(400).json({ error: 'Too many failed attempts. Request a new OTP.' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await query(
        'UPDATE email_verification_otp SET attempts = attempts + 1 WHERE id = $1',
        [otpRecord.id]
      );
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // Mark email as verified
    await query(
      'UPDATE users SET email_verified = true, email_verified_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Delete the OTP record
    await query('DELETE FROM email_verification_otp WHERE id = $1', [otpRecord.id]);

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const userResult = await query(
      'SELECT id, email, full_name, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTP for this user
    await query('DELETE FROM email_verification_otp WHERE user_id = $1', [user.id]);

    // Store new OTP
    await query(
      'INSERT INTO email_verification_otp (user_id, otp, expires_at) VALUES ($1, $2, $3)',
      [user.id, otp, expiresAt]
    );

    // Send OTP email
    await sendVerificationOTP(user.email, otp, user.full_name);

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// Login - Send OTP
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const result = await query('SELECT id, email, password_hash, full_name, role, email_verified FROM users WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate login OTP
    const loginOtp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing login OTP for this user
    await query('DELETE FROM email_verification_otp WHERE user_id = $1', [user.id]);

    // Store login OTP
    await query(
      'INSERT INTO email_verification_otp (user_id, otp, expires_at) VALUES ($1, $2, $3)',
      [user.id, loginOtp, expiresAt]
    );

    // Send OTP email
    try {
      await sendVerificationOTP(user.email, loginOtp, user.full_name);
    } catch (emailError) {
      console.error('Failed to send login OTP:', emailError);
      return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }

    res.json({
      message: 'Login OTP sent to your email. Please enter the code to continue.',
      email: user.email,
      user_id: user.id,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify Login OTP - Get JWT Token
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body as { email: string; otp: string };

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    // Find user
    const userResult = await query(
      'SELECT id, email, full_name, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email' });
    }

    const user = userResult.rows[0];

    // Find OTP record
    const otpResult = await query(
      'SELECT id, otp, expires_at, attempts FROM email_verification_otp WHERE user_id = $1',
      [user.id]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No OTP found. Please login again.' });
    }

    const otpRecord = otpResult.rows[0];

    // Check if OTP has expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      await query('DELETE FROM email_verification_otp WHERE id = $1', [otpRecord.id]);
      return res.status(400).json({ error: 'OTP has expired. Please login again.' });
    }

    // Check attempt limit
    if (otpRecord.attempts >= 5) {
      await query('DELETE FROM email_verification_otp WHERE id = $1', [otpRecord.id]);
      return res.status(400).json({ error: 'Too many failed attempts. Please login again.' });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await query(
        'UPDATE email_verification_otp SET attempts = attempts + 1 WHERE id = $1',
        [otpRecord.id]
      );
      const remainingAttempts = 5 - (otpRecord.attempts + 1);
      return res.status(400).json({ 
        error: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
      });
    }

    // Delete the OTP record
    await query('DELETE FROM email_verification_otp WHERE id = $1', [otpRecord.id]);

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login OTP verification error:', error);
    res.status(500).json({ error: 'Login verification failed' });
  }
});

export default router;
