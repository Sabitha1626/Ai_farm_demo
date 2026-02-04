import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, User, MapPin, Globe, Bell } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function Settings() {
  const { theme, toggleTheme, colorTheme, setColorTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  const [fullName, setFullName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [databaseName, setDatabaseName] = useState<string | null>(null);
  const [dbUserName, setDbUserName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      setLoading(true);

      try {
        const response = await api.get('/auth/profile');
        if (response.data) {
          setFullName(response.data.fullName || '');
          setFarmName(response.data.farmName || '');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }

      // Get farm location from localStorage for now
      const savedLocation = localStorage.getItem('farm-location');
      if (savedLocation) setFarmLocation(savedLocation);

      setLoading(false);
    }

    async function fetchDbDebug() {
      try {
        const response = await api.get('/auth/debug-db');
        if (response.data) {
          if (response.data.databaseName) setDatabaseName(response.data.databaseName);
          if (response.data.userName) setDbUserName(response.data.userName);
        }
      } catch (error) {
        console.error('Failed to fetch DB debug info:', error);
      }
    }

    fetchProfile();
    fetchDbDebug();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      await api.put('/auth/profile', {
        fullName: fullName,
        farmName: farmName
      });

      // Save farm location to localStorage
      localStorage.setItem('farm-location', farmLocation);
      toast.success(t('profileSaved') || 'Profile saved successfully');
    } catch (error) {
      toast.error('Failed to save profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t('settings')}</h1>
          <p className="text-muted-foreground">{t('settingsDesc')}</p>
        </div>

        {/* Profile Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profile')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('fullName')}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmName">{t('farmName')}</Label>
              <Input
                id="farmName"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Enter your farm name"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmLocation" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('farmLocation')}
              </Label>
              <Input
                id="farmLocation"
                value={farmLocation}
                onChange={(e) => setFarmLocation(e.target.value)}
                placeholder="Enter your farm location"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              disabled={saving || loading}
              className="w-full sm:w-auto"
            >
              {saving ? 'Saving...' : t('saveChanges')}
            </Button>
          </CardContent>
        </Card>

        {/* Language Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>{t('selectLanguage')}</Label>
              <Select value={language} onValueChange={(value: 'en' | 'es' | 'fr' | 'sw' | 'ta' | 'hi' | 'de' | 'pt' | 'zh' | 'ja') => setLanguage(value)}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="sw">Kiswahili</SelectItem>
                  <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                  <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                  <SelectItem value="de">Deutsch (German)</SelectItem>
                  <SelectItem value="pt">Português (Portuguese)</SelectItem>
                  <SelectItem value="zh">中文 (Chinese)</SelectItem>
                  <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('pushNotifications')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                <div>
                  <Label className="text-foreground font-medium">{t('enableNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {isSupported ? t('notificationsSupportedDesc') : t('notificationsNotSupported')}
                  </p>
                </div>
              </div>
              <Switch
                checked={isSubscribed}
                onCheckedChange={(checked) => checked ? subscribe() : unsubscribe()}
                disabled={!isSupported}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">{t('appearance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <Label className="text-foreground font-medium">{t('darkMode')}</Label>
                  <p className="text-sm text-muted-foreground">{t('toggleDarkTheme')}</p>
                </div>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            </div>

            <div className="mt-4 p-4 rounded-lg bg-secondary/50 space-y-3">
              <div>
                <Label className="text-foreground font-medium">Theme Color</Label>
                <p className="text-sm text-muted-foreground">Select your preferred accent color</p>
              </div>
              <div className="flex gap-3">
                {(['green', 'blue', 'purple', 'orange'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setColorTheme(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${colorTheme === color ? 'border-primary ring-2 ring-offset-2 ring-offset-background ring-primary' : 'border-transparent hover:scale-105'
                      } ${color === 'green' ? 'bg-[#1b6238]' :
                        color === 'blue' ? 'bg-[#2563eb]' :
                          color === 'purple' ? 'bg-[#7c3aed]' :
                            'bg-[#ea580c]'
                      }`}
                    aria-label={`Select ${color} theme`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Info Section (Separated Data) */}
        <Card className="shadow-soft border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2 text-primary">
              <Globe className="h-5 w-5" />
              Database Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Owner Name</Label>
                <div className="p-3 bg-background border rounded-md font-medium">
                  {dbUserName || 'Loading...'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Separated Database Name</Label>
                <div className="p-3 bg-background border rounded-md font-mono text-sm break-all">
                  {databaseName || 'Loading...'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                This database belongs to <strong>{dbUserName || 'you'}</strong> and is completely isolated from other users.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
