import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { auth, setAuthToken, getAuthToken } from '@/lib/api';
import { Shield, Lock, Mail, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [attempts, setAttempts] = useState(0);
  const [maxAttempts] = useState(5);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Timer for OTP expiration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && step === 'otp') {
      setStep('credentials');
      setOtp('');
      setAttempts(0);
      toast.error('OTP expired. Please log in again.');
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input with validation
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailNotVerified(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
          setEmailNotVerified(true);
          localStorage.setItem('verificationEmail', email);
          toast.error('Please verify your email before logging in');
        } else {
          toast.error(data.error || 'Invalid credentials');
        }
        return;
      }

      // OTP sent successfully, move to OTP step
      setOtpSent(true);
      setStep('otp');
      setTimer(600); // Reset 10-minute timer
      setAttempts(0);
      toast.success('OTP sent to your email!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/verify-login-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= maxAttempts) {
          setStep('credentials');
          setOtp('');
          setOtpSent(false);
          setAttempts(0);
          toast.error('Too many failed attempts. Please try logging in again.');
        } else {
          toast.error(
            `${data.error || 'Invalid OTP'}. ${maxAttempts - newAttempts} attempts remaining.`
          );
        }
        return;
      }

      // Login successful
      setAuthToken(data.token);
      const userName =
        data.user?.full_name ||
        email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userEmail', email);
      toast.success('Login successful!');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error instanceof Error ? error.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingEmail(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/resend-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to resend OTP');
      } else {
        setTimer(600);
        setAttempts(0);
        toast.success('OTP sent! Check your inbox.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend OTP');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl">
        {/* Left Side - Brand & Benefits */}
        <div className="hidden lg:flex flex-col justify-center items-center text-white space-y-8 pl-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold">SafeTrail</h1>
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Travel{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
                Safely
              </span>
            </h2>
            <p className="text-lg text-gray-300">
              Join thousands of travelers keeping each other safe
            </p>
          </div>

          <div className="space-y-6 w-full">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Real-time Safety Scores</h3>
                <p className="text-gray-400 text-sm">Get accurate safety information for places</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Mail className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Community Reports</h3>
                <p className="text-gray-400 text-sm">Help and get warned by the community</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                <Lock className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your Privacy Protected</h3>
                <p className="text-gray-400 text-sm">Anonymous reports and secure data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">SafeTrail Login</h2>
              <p className="text-gray-600">
                {step === 'credentials'
                  ? 'Sign in to your account'
                  : 'Enter the OTP sent to your email'}
              </p>
            </div>

            {step === 'credentials' ? (
              <>
                {/* Credentials Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Email Not Verified Alert */}
                  {emailNotVerified && (
                    <Alert className="border-amber-500/50 bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700">
                        <p className="font-semibold mb-3">Email not verified</p>
                        <p className="text-sm mb-3">
                          Your email address needs to be verified before you can log in.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={async () => {
                            setResendingEmail(true);
                            try {
                              const response = await fetch(
                                `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/resend-otp`,
                                {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email }),
                                }
                              );
                              const data = await response.json();
                              if (!response.ok) {
                                toast.error(data.error || 'Failed to resend verification code');
                              } else {
                                toast.success('Verification code sent! Check your inbox.');
                                localStorage.setItem('verificationEmail', email);
                                navigate('/verify-email');
                              }
                            } catch (error) {
                              console.error('Resend error:', error);
                              toast.error('Failed to resend verification email');
                            } finally {
                              setResendingEmail(false);
                            }
                          }}
                          disabled={resendingEmail}
                        >
                          {resendingEmail ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            'Resend Verification Email'
                          )}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold text-base rounded-lg transition-all mt-6"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Test Credentials */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm text-blue-900">Test Credentials:</p>
                  <p className="text-xs text-blue-800">
                    Email: <span className="font-mono">user@safetrail.com</span>
                  </p>
                  <p className="text-xs text-blue-800">
                    Password: <span className="font-mono">password123</span>
                  </p>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">New to SafeTrail?</span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center space-y-4">
                  <Link to="/signup">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 text-gray-900 hover:text-green-700 font-semibold rounded-lg transition-all"
                    >
                      Create Account
                    </Button>
                  </Link>
                  <p className="text-xs text-gray-500">
                    <Link
                      to="/admin-login"
                      className="text-green-600 hover:text-green-700 font-semibold"
                    >
                      Admin Login
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* OTP Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* OTP Input */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 block">
                      One-Time Password
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otp}
                      onChange={handleOtpChange}
                      maxLength={6}
                      required
                      className="text-center text-4xl font-bold tracking-widest border-gray-200 focus:border-green-500 focus:ring-green-500 h-16"
                    />
                    <p className="text-xs text-gray-500 text-center">
                      Enter the 6-digit code sent to {email}
                    </p>
                  </div>

                  {/* Timer */}
                  <div
                    className={`text-center font-semibold text-lg ${timer < 60 ? 'text-red-600' : 'text-gray-700'}`}
                  >
                    Time remaining: {formatTime(timer)}
                  </div>

                  {/* Attempts Display */}
                  {attempts > 0 && (
                    <Alert
                      className={`${attempts >= maxAttempts - 1 ? 'border-red-500/50 bg-red-500/10' : 'border-amber-500/50 bg-amber-500/10'}`}
                    >
                      <AlertCircle
                        className={`h-4 w-4 ${attempts >= maxAttempts - 1 ? 'text-red-600' : 'text-amber-600'}`}
                      />
                      <AlertDescription
                        className={attempts >= maxAttempts - 1 ? 'text-red-700' : 'text-amber-700'}
                      >
                        {maxAttempts - attempts} attempt{maxAttempts - attempts === 1 ? '' : 's'}{' '}
                        remaining
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Verify Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold text-base rounded-lg transition-all"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Login
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                    <Button
                      type="button"
                      variant="link"
                      className="text-green-600 hover:text-green-700 font-semibold p-0 h-auto"
                      onClick={handleResendOtp}
                      disabled={resendingEmail}
                    >
                      {resendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        'Resend OTP'
                      )}
                    </Button>
                  </div>

                  {/* Back Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 text-gray-900 hover:text-red-700"
                    onClick={() => {
                      setStep('credentials');
                      setOtp('');
                      setOtpSent(false);
                      setAttempts(0);
                      setPassword('');
                    }}
                  >
                    Back to Login
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
