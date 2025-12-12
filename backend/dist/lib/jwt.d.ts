import jwt from 'jsonwebtoken';
export declare const generateToken: (userId: number, email: string, role: string) => string;
export declare const verifyToken: (token: string) => string | jwt.JwtPayload | null;
//# sourceMappingURL=jwt.d.ts.map