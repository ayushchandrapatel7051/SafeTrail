import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { auth, setAuthToken } from "@/lib/api";

export default function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SafeTrail Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline font-semibold">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-gray-600">
            <p className="font-semibold mb-1">Test Credentials:</p>
            <p>Email: user@safetrail.com</p>
            <p>Password: password123</p>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            <Link to="/admin-login" className="text-gray-600 hover:text-gray-800">
              Admin Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
