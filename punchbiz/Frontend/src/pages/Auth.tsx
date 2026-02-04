import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

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

const emailSchema = z.string().email('Please enter a valid email').refine(email => {
  const domain = email.split('@')[1]?.toLowerCase();
  const blacklist = ['test.com', 'example.com', 'dummy.com', 'mailinator.com', 'yopmail.com'];
  return !blacklist.includes(domain);
}, { message: 'Dummy/test emails are not allowed' });
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string; newPassword?: string }>({});
  const { t } = useLanguage();
  const { signIn, signUp, resetPassword, verifyOtp, confirmPasswordReset, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; otp?: string; newPassword?: string } = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
      if (newErrors.email === 'Dummy/test emails are not allowed') {
        toast.error('Invalid email');
      }
    }

    if (!isForgotPassword) {
      if (isLogin) {
        const passwordResult = passwordSchema.safeParse(password);
        if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
      } else {
        if (!fullName) newErrors.password = 'Full name is required';
        const passwordResult = passwordSchema.safeParse(password);
        if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
      }
    } else {
      if (forgotPasswordStep === 'otp') {
        if (otp.length !== 6) newErrors.otp = 'OTP must be 6 digits';
      } else if (forgotPasswordStep === 'reset') {
        const passwordResult = passwordSchema.safeParse(newPassword);
        if (!passwordResult.success) newErrors.newPassword = passwordResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    if (isForgotPassword) {
      if (forgotPasswordStep === 'email') {
        const { error } = await resetPassword(email);
        if (!error) setForgotPasswordStep('otp');
      } else if (forgotPasswordStep === 'otp') {
        const { error } = await verifyOtp(email, otp);
        if (!error) setForgotPasswordStep('reset');
      } else if (forgotPasswordStep === 'reset') {
        const { error } = await confirmPasswordReset(email, otp, newPassword);
        if (!error) {
          setIsForgotPassword(false);
          setForgotPasswordStep('email');
          setIsLogin(true);
        }
      }
    } else if (isLogin) {
      const { error } = await signIn(email, password);
      if (!error) {
        navigate('/dashboard');
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (!error) {
        setIsLogin(true);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-hero flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden shadow-primary">
            <img src="/logo.png" alt="Breeding App logo" className="h-full w-full object-contain logo-adaptive" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">{t('appName')}</h1>
            <p className="text-sm text-muted-foreground">{t('authTagline')}</p>
          </div>
        </Link>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="font-display text-4xl font-bold text-foreground leading-tight">
              Revolutionize Your<br />
              <span className="text-primary">Cattle Breeding</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              AI-powered heat detection, breeding optimization, and herd management.
              Make smarter decisions for your farm.
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary">95%</p>
              <p className="text-sm text-muted-foreground">Detection Accuracy</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary">10K+</p>
              <p className="text-sm text-muted-foreground">Cows Managed</p>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Happy Farmers</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm text-muted-foreground">
          © 2024 AI-FARM APP. All rights reserved.
        </p>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden shadow-primary">
                <img src="/logo.png" alt="Breeding App logo" className="h-full w-full object-contain logo-adaptive" />
              </div>
              <span className="font-display font-bold text-2xl text-foreground">{t('appName')}</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="font-display text-3xl font-bold text-foreground">
              {isForgotPassword ? t('authResetPasswordTitle') : isLogin ? t('authWelcomeBackTitle') : t('authCreateAccountTitle')}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isForgotPassword
                ? t('authResetPasswordSubtitle')
                : isLogin
                  ? t('authLoginSubtitle')
                  : t('authSignupSubtitle')}
            </p>
          </div>


          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !isForgotPassword && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="name" className="text-foreground">{t('authFullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder={t('authFullNamePlaceholder')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 bg-card border-border focus:border-primary"
                  />
                </div>
              </div>
            )}

            {(!isForgotPassword || forgotPasswordStep === 'email') && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">{t('authEmail')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('authEmailPlaceholder')}
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setEmail(val);
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className="pl-10 h-12 bg-card border-border focus:border-primary"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            )}

            {isForgotPassword && forgotPasswordStep === 'otp' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="otp" className="text-foreground">Enter 6-Digit OTP</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, ''));
                      setErrors(prev => ({ ...prev, otp: undefined }));
                    }}
                    className="pl-10 h-12 bg-card border-border focus:border-primary tracking-[0.5em] text-center font-bold"
                  />
                </div>
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp}</p>
                )}
                <p className="text-xs text-muted-foreground text-center">Check your email for the code</p>
              </div>
            )}

            {isForgotPassword && forgotPasswordStep === 'reset' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors(prev => ({ ...prev, newPassword: undefined }));
                    }}
                    className="pl-10 h-12 bg-card border-border focus:border-primary"
                  />
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword}</p>
                )}
              </div>
            )}

            {/* Password field always visible for login and sign-up, but not for forgot password email/otp steps */}
            {(!isForgotPassword || forgotPasswordStep === 'reset') && (
              <div className="space-y-2">
                <Label htmlFor="password" title={t('authSetPassword') || 'Create Password'} className="text-foreground">
                  {isForgotPassword && forgotPasswordStep === 'reset' ? 'Confirm New Password' : t('authPassword')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('authPasswordPlaceholder')}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    className="pl-10 h-12 bg-card border-border focus:border-primary"
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
            )}

            {isLogin && !isForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setForgotPasswordStep('email');
                    setErrors({});
                  }}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {t('authForgotPassword')}
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isForgotPassword ? (forgotPasswordStep === 'email' ? t('authSending') : 'Verifying...') : isLogin ? t('authSigningIn') : t('authCreatingAccount')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isForgotPassword
                    ? (forgotPasswordStep === 'email' ? t('authSendResetLink') : forgotPasswordStep === 'otp' ? 'Verify OTP' : 'Reset Password')
                    : isLogin ? t('authSignIn') : t('authCreateAccountBtn')}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="text-center">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrors({});
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="font-semibold text-primary">{t('authBackToSignIn')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? (
                  <>
                    {t('authNoAccount')} <span className="font-semibold text-primary">{t('authSignUp')}</span>
                  </>
                ) : (
                  <>
                    {t('authHaveAccount')} <span className="font-semibold text-primary">{t('authSignIn')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
