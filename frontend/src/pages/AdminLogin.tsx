import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Admin login failed');
        setLoading(false);
        return;
      }

      if (!data.token) {
        toast.error('No token received from server');
        setLoading(false);
        return;
      }

      // Store the JWT token from the server
      localStorage.setItem('adminToken', data.token);
      toast.success('Admin login successful!');
      navigate('/admin');
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Login request failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Access admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              {loading ? 'Logging in...' : 'Admin Login'}
            </Button>
          </form>

          <div className="mt-4 p-3 bg-red-50 rounded text-xs text-gray-600">
            <p className="font-semibold mb-1">Admin Credentials:</p>
            <p>Username: admin</p>
            <p>Password: admin</p>
          </div>

          <div className="mt-4 text-center text-xs text-gray-500">
            <Link to="/login" className="text-gray-600 hover:text-gray-800">
              User Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
