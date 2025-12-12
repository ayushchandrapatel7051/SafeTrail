import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  Shield,
  MapPin,
  FileText,
  Home,
  Compass,
  User,
  ChevronDown,
  Settings,
  LogOut as LogOutIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearAuthToken } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Check if mobile based on window width
const useMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

interface DashboardLayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
}

export default function DashboardLayout({ children, isAdmin = false }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'User';
    const email = localStorage.getItem('userEmail') || '';
    setUserName(name);
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    if (isAdmin) {
      localStorage.removeItem('adminToken');
    } else {
      clearAuthToken();
    }
    navigate('/');
  };

  const getUserInitials = () => {
    return userName.substring(0, 2).toUpperCase();
  };

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const navigationItems = isAdmin
    ? [{ icon: Home, label: 'Dashboard', href: '/admin' }]
    : [
        { icon: Home, label: 'Dashboard', href: '/dashboard' },
        { icon: MapPin, label: 'Safety Map', href: '/map' },
        { icon: FileText, label: 'Report Issue', href: '/report' },
        { icon: Compass, label: 'Trip Planner', href: '/trip-plan' },
        { icon: Phone, label: 'Emergency', href: '/emergency' },
        { icon: User, label: 'Profile', href: '/profile' },
      ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <aside
          className={`border-r border-border bg-card flex flex-col transition-all duration-300 ease-out ${sidebarCollapsed ? 'w-20' : 'w-64'} shadow-sm`}
        >
          {/* Header with Logo and Collapse Button */}
          <div className="h-16 border-b border-border/50 flex items-center px-4 flex-shrink-0 bg-gradient-to-r from-card to-background/50">
            <div className="flex items-center justify-between w-full">
              {!sidebarCollapsed ? (
                <>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Shield className="w-6 h-6 text-primary flex-shrink-0" />
                    <span className="text-lg font-bold truncate text-foreground">SafeTrail</span>
                  </div>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="p-1.5 hover:bg-primary/10 rounded-md transition-colors flex-shrink-0 ml-2 text-muted-foreground hover:text-foreground"
                    title="Collapse sidebar"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-full h-12 flex items-center justify-center hover:bg-primary/10 rounded-md transition-colors text-primary"
                  title="Expand sidebar"
                >
                  <Shield className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`w-full flex items-center rounded-lg transition-all duration-200 text-sm font-medium ${
                    sidebarCollapsed ? 'justify-center p-3 h-12 gap-0' : 'gap-3 px-3 py-2.5 h-auto'
                  } ${
                    active
                      ? 'bg-primary/20 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-border/50 flex-shrink-0 bg-gradient-to-t from-background/50 to-transparent">
            <Button
              onClick={handleLogout}
              className={`w-full transition-all duration-200 font-medium ${
                sidebarCollapsed
                  ? 'justify-center p-3 h-12'
                  : 'justify-start gap-2 px-3 py-2 h-auto'
              } bg-red-500/10 text-red-600 hover:bg-red-500/20`}
              variant="ghost"
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Logout</span>}
            </Button>
          </div>
        </aside>
      )}

      {/* Mobile Sidebar */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <aside className="w-64 border-r border-border bg-background flex flex-col">
            <div className="h-16 border-b border-border flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold">SafeTrail</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-secondary/50 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm font-medium text-foreground"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-border">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start gap-2"
                size="sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </aside>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 shadow-sm">
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-muted/60 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {!isMobile && sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 hover:bg-muted/60 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Profile Menu - Desktop and Mobile */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 cursor-pointer select-none

hover:bg-transparent
    hover:text-current
    active:bg-transparent

    focus-visible:ring-0
    focus:ring-0
    focus:outline-none

    data-[state=open]:bg-transparent"
                >
                  <Avatar className="w-8 h-8 border-2 border-primary/20">
                    <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {!isMobile && (
                    <>
                      <span className="text-sm font-medium hidden md:inline">{userName}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* User Info Header */}
                <div className="px-2 py-1.5 bg-muted/30 rounded-md mx-1 my-1">
                  <p className="text-sm font-semibold text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>

                <DropdownMenuSeparator />

                {/* Account Info */}
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer focus:bg-primary/10 focus:text-foreground transition-colors py-2"
                >
                  <User className="w-4 h-4 mr-2" />
                  <span>Account Info</span>
                </DropdownMenuItem>

                {/* Settings */}
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer focus:bg-primary/10 focus:text-foreground transition-colors py-2"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer focus:bg-red-500/10 focus:text-red-600 transition-colors py-2 text-red-600"
                >
                  <LogOutIcon className="w-4 h-4 mr-2" />
                  <span className="font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
