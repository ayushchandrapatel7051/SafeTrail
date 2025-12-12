import { Router } from 'express';
import { query } from '../db/connection.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/jwt.js';

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

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email, passwordHash, full_name, 'user']
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const result = await query('SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
