import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Thermometer,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  CalendarDays,
  BarChart3,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Natural cow SVG icon component
const CowIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 4C10.5 4 9.5 5 9 6C8.5 5 7.5 4 6 4C4 4 2.5 5.5 2.5 7.5C2.5 9 3.5 10 4 10.5C3 11 2 12.5 2 14.5C2 17.5 4.5 20 8 20H16C19.5 20 22 17.5 22 14.5C22 12.5 21 11 20 10.5C20.5 10 21.5 9 21.5 7.5C21.5 5.5 20 4 18 4C16.5 4 15.5 5 15 6C14.5 5 13.5 4 12 4Z"
      fill="currentColor"
    />
    <circle cx="8.5" cy="12" r="1.5" fill="hsl(var(--background))" />
    <circle cx="15.5" cy="12" r="1.5" fill="hsl(var(--background))" />
    <ellipse cx="12" cy="16" rx="2.5" ry="1.5" fill="hsl(var(--background))" opacity="0.6" />
  </svg>
);

// Use a wrapper component for CowIcon to match lucide interface
const CowNavIcon = ({ className }: { className?: string }) => (
  <CowIcon className={className} />
);

const getNavItems = (t: (key: string) => string) => [
  { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
  { icon: MessageSquare, label: t('aiAssistant'), path: '/chat' },
  { icon: CowNavIcon, label: t('cowManagement'), path: '/cows' },
  { icon: Thermometer, label: t('heatDetection'), path: '/heat' },
  { icon: CalendarDays, label: t('breedingCalendar'), path: '/calendar' },
  { icon: BarChart3, label: t('analytics'), path: '/analytics' },
  { icon: Radio, label: t('sensorDashboard'), path: '/sensors' },
  { icon: Users, label: t('staffAttendance'), path: '/staff' },
  { icon: Settings, label: t('settings'), path: '/settings' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = getNavItems(t);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    signOut();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden">
              <img src="/logo.png" alt="Breeding App logo" className="h-full w-full object-contain logo-adaptive" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-foreground">{t('appName')}</h1>
              <p className="text-xs text-muted-foreground">{t('authTagline')}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110",
                  isActive && "text-primary-foreground"
                )} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="mb-4 px-4 py-3 rounded-lg bg-secondary/50">
            <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Farmer</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {t('signOut')}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg overflow-hidden">
              <img src="/logo.png" alt="Breeding App logo" className="h-full w-full object-contain logo-adaptive" />
            </div>
            <span className="font-display font-bold text-foreground">{t('appName')}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="p-4 space-y-1 border-t border-border animate-slide-up">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive mt-4"
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
            >
              <LogOut className="h-5 w-5" />
              {t('signOut')}
            </Button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:overflow-auto">
        <div className="pt-[73px] lg:pt-0">
          {children}
        </div>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('signOut')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('signOutConfirmation') || 'Are you sure you want to sign out? You will need to sign in again to access your farm data.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              {t('signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
