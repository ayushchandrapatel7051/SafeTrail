import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { auth, setAuthToken, getAuthToken } from "@/lib/api";
import { Shield, Lock, Mail, User, Globe, MapPin } from "lucide-react";

const COUNTRIES = ["India", "USA", "UK", "Canada", "Australia"];
const CITIES: Record<string, string[]> = {
  "India": ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"],
  "USA": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
  "UK": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
};

export default function UserSignup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const availableCities = country ? CITIES[country] || [] : [];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !country || !city) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await auth.register(email, password, fullName);
      setAuthToken(response.token);
      localStorage.setItem('userName', fullName);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userCountry', country);
      localStorage.setItem('userCity', city);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to create account. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left Sidebar - Brand Story (Hidden on mobile) */}
        <div className="hidden lg:block space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">SafeTrail</h1>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white">
              Travel <span className="text-green-400">Safely</span>
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Join thousands of travelers keeping each other safe
            </p>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4 pt-4">
            {/* Feature 1 */}
            <div className="flex gap-4 group cursor-default hover:translate-x-2 transition-transform">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Real-time Safety Scores</h3>
                <p className="text-gray-400 text-sm">Get accurate safety information for places</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4 group cursor-default hover:translate-x-2 transition-transform">
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/30 transition-colors">
                <Mail className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Community Reports</h3>
                <p className="text-gray-400 text-sm">Help and get warned by the community</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4 group cursor-default hover:translate-x-2 transition-transform">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Your Privacy Protected</h3>
                <p className="text-gray-400 text-sm">Anonymous reports and secure data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Card */}
        <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 px-8 py-6 space-y-2 lg:hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">SafeTrail</h1>
            </div>
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-white/80 text-sm">Join our community to report safety issues</p>
          </div>

          {/* Desktop Header (Visible only on lg) */}
          <div className="hidden lg:block bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 px-8 py-6 space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">SafeTrail</h1>
            </div>
            <h2 className="text-xl font-bold text-white">Create Account</h2>
            <p className="text-white/80 text-xs">Join our community to report safety issues</p>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-5">
            <form onSubmit={handleSignup} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Email *</label>
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

            {/* Country and City in one row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Country */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Country *</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
                  <Select value={city} onValueChange={setCity} disabled={!country}>
                    <SelectTrigger className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500 disabled:opacity-50">
                      <SelectValue placeholder={!country ? "Select country first" : "Select city"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Password *</label>
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Sign Up Button */}
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold text-base rounded-lg transition-all mt-6"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Already registered?</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center space-y-4">
            <Link to="/login">
              <Button 
                type="button"
                variant="outline"
                className="w-full h-11 border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 text-gray-900 hover:text-green-700 font-semibold rounded-lg transition-all"
              >
                Sign In Instead
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
