import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { auth, setAuthToken, getAuthToken } from "@/lib/api";
import { Shield, Lock, Mail } from "lucide-react";

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await auth.login(email, password);
      if (!response || !response.token) {
        toast.error("Login failed: No token received");
        return;
      }
      setAuthToken(response.token);
      // Use the full_name from server response, fallback to email extraction
      const userName = response.user?.full_name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userEmail', email);
      toast.success("Login successful!");
      // Use window.location for immediate redirect
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Invalid credentials or server error");
    } finally {
      setLoading(false);
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
            <h2 className="text-4xl font-bold leading-tight">Travel <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">Safely</span></h2>
            <p className="text-lg text-gray-300">Join thousands of travelers keeping each other safe</p>
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
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
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
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Test Credentials */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-sm text-blue-900">Test Credentials:</p>
              <p className="text-xs text-blue-800">Email: <span className="font-mono">user@safetrail.com</span></p>
              <p className="text-xs text-blue-800">Password: <span className="font-mono">password123</span></p>
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
                <Link to="/admin-login" className="text-green-600 hover:text-green-700 font-semibold">
                  Admin Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
