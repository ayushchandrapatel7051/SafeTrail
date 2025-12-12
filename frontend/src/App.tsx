import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/api';
import Index from './pages/Index';
import MapView from './pages/MapView';
import ReportForm from './pages/ReportForm';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import UserLogin from './pages/UserLogin';
import UserSignup from './pages/UserSignup';
import VerifyEmail from './pages/VerifyEmail';
import TripPlan from './pages/TripPlanNew';
import Profile from './pages/Profile';
import Emergency from './pages/Emergency';
import EmergencyDetail from './pages/EmergencyDetail';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const PrivateRoute = ({ element }: { element: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    setToken(authToken);
    setLoading(false);
  }, []);

  if (loading) return null;
  return token ? element : <Navigate to="/login" replace />;
};

const AdminRoute = ({ element }: { element: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    setIsAdmin(!!adminToken);
    setLoading(false);
  }, []);

  if (loading) return null;
  return isAdmin ? element : <Navigate to="/admin-login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<UserSignup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Admin Routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />

          {/* Protected User Routes */}
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/map" element={<PrivateRoute element={<MapView />} />} />
          <Route path="/report" element={<PrivateRoute element={<ReportForm />} />} />
          <Route path="/trip-plan" element={<PrivateRoute element={<TripPlan />} />} />
          <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
          <Route path="/emergency" element={<PrivateRoute element={<Emergency />} />} />
          <Route
            path="/emergency/:placeId"
            element={<PrivateRoute element={<EmergencyDetail />} />}
          />

          {/* Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
