export declare const sendVerificationOTP: (email: string, otp: string, fullName: string) => Promise<any>;
export declare const sendPasswordResetEmail: (email: string, token: string, fullName: string) => Promise<any>;
export declare const sendEmail: (options: {
    to: string;
    subject: string;
    text?: string;
    html: string;
}) => Promise<any>;
//# sourceMappingURL=email.d.ts.map