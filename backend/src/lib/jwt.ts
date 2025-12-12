import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export const generateToken = (userId: number, email: string, role: string) => {
  const token = jwt.sign({ id: userId, email, role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  } as SignOptions);
  return token;
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};
