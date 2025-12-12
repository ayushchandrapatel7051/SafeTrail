import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem('verificationEmail') || '');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Failed to verify OTP');
        toast.error(data.error || 'Verification failed');
      } else {
        setVerificationStatus('success');
        localStorage.removeItem('verificationEmail');
        toast.success('Email verified successfully!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setErrorMessage('An error occurred during verification');
      toast.error('Verification error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to resend OTP');
      } else {
        toast.success('OTP sent! Check your email.');
        setOtp('');
        setTimeLeft(600); // Reset timer
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-green-500" />
            <span className="text-2xl font-bold text-white">SafeTrail</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-gray-400">Enter the code we sent to your email</p>
        </div>

        {/* Verification Status */}
        {verificationStatus === 'success' && (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-lg font-semibold text-green-600 mb-2">Email Verified!</h2>
                  <p className="text-gray-600">Your email has been successfully verified. Redirecting to login...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {verificationStatus === 'error' && errorMessage && (
          <Alert className="border-red-500/50 bg-red-500/10 mb-6">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {verificationStatus === 'idle' && (
          <Card className="border-gray-700 bg-gray-800">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center space-y-2">
                <Mail className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-gray-300 text-sm">
                  We've sent a 6-digit verification code to your email address.
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-300 mb-2 block">Email Address</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    disabled={isVerifying}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-gray-300">Verification Code</label>
                    <span className={`text-xs font-semibold ${timeLeft < 60 ? 'text-red-400' : 'text-gray-400'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 text-center text-2xl tracking-widest font-mono"
                    disabled={isVerifying}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isVerifying || otp.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify OTP
                    </>
                  )}
                </Button>
              </form>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-sm font-semibold text-white mb-4">Didn't receive the code?</h3>

                <Button
                  onClick={handleResendOTP}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Login */}
        {verificationStatus !== 'success' && (
          <div className="mt-6 text-center">
            <p className="text-gray-400">Already have an account? {' '}
              <Link to="/login" className="text-green-500 hover:text-green-400 font-semibold">
                Login here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
