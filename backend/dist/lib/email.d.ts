export declare const sendVerificationOTP: (email: string, otp: string, fullName: string) => Promise<any>;
export declare const sendPasswordResetEmail: (email: string, token: string, fullName: string) => Promise<any>;
export declare const sendEmail: (options: {
    to: string;
    subject: string;
    text?: string;
    html: string;
}) => Promise<any>;
export declare const sendEmergencyEmail: (options: {
    to: string;
    contactName: string;
    userName: string;
    userEmail: string;
    message: string;
    locationUrl: string;
    latitude: number;
    longitude: number;
}) => Promise<any>;
//# sourceMappingURL=email.d.ts.map