import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Beef, Thermometer, TrendingUp, AlertCircle, Activity, UserX, Package, Plus, Check, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface DashboardStats {
  totalCows: number;
  healthyCows: number;
  inHeatCows: number;
  recentHeatDetections: number;
}

interface AbsentStaff {
  id: string;
  name: string;
  role: string | null;
  absent_reason: string | null;
}

interface StockItem {
  id: string;
  name: string;
  is_purchased: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalCows: 0,
    healthyCows: 0,
    inHeatCows: 0,
    recentHeatDetections: 0,
  });
  const [absentStaff, setAbsentStaff] = useState<AbsentStaff[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const defaultFeedItems = [
    'Napier grass',
    'Guinea grass',
    'Maize (green)',
    'Sorghum',
    'Berseem',
    'Lucerne (alfalfa)',
  ];

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [cowsRes, heatRes, staffRes, stockRes] = await Promise.all([
          api.get('/cows'),
          api.get(`/events/heat?startDate=${last7Days}`),
          api.get('/staff?isAbsent=true'),
          api.get(`/stock?month=${currentMonth}&year=${currentYear}`)
        ]);

        const cows = cowsRes.data || [];
        const heatRecords = heatRes.data || [];
        const absent = (staffRes.data || []).map((s: any) => ({
          id: s._id,
          name: s.name,
          role: s.role,
          absent_reason: s.absentReason
        }));
        const stock = (stockRes.data || []).map((s: any) => ({
          id: s._id,
          name: s.name,
          is_purchased: s.isPurchased
        }));

        setStats({
          totalCows: cows.length,
          healthyCows: cows.filter((c: any) => c.status === 'Healthy').length,
          inHeatCows: cows.filter((c: any) => c.status === 'In Heat').length,
          recentHeatDetections: heatRecords.length,
        });
        setAbsentStaff(absent);
        setStockItems(stock);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, currentMonth, currentYear]);

  const addDefaultItems = async () => {
    if (!user) return;

    const itemsToAdd = defaultFeedItems.map(name => ({
      userId: user.id,
      name,
      month: currentMonth,
      year: currentYear,
      isPurchased: false,
    }));

    try {
      const res = await api.post('/stock', itemsToAdd);
      const newItems = res.data.map((s: any) => ({
        id: s._id,
        name: s.name,
        is_purchased: s.isPurchased
      }));
      setStockItems(newItems);
      toast.success(t('itemAdded'));
    } catch (error) {
      toast.error('Failed to add items');
    }
  };

  const addCustomItem = async () => {
    if (!user || !newItemName.trim()) return;

    try {
      const res = await api.post('/stock', {
        userId: user.id,
        name: newItemName.trim(),
        month: currentMonth,
        year: currentYear,
        isPurchased: false,
      });
      const data = res.data;
      setStockItems([...stockItems, {
        id: data._id,
        name: data.name,
        is_purchased: data.isPurchased
      }]);
      setNewItemName('');
      setShowAddItem(false);
      toast.success(t('itemAdded'));
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const togglePurchased = async (id: string, currentValue: boolean) => {
    try {
      await api.put(`/stock/${id}`, { isPurchased: !currentValue });
      setStockItems(stockItems.map(item => item.id === id ? { ...item, is_purchased: !currentValue } : item));
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await api.delete(`/stock/${id}`);
      setStockItems(stockItems.filter(item => item.id !== id));
      toast.success(t('itemDeleted'));
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const statCards = [
    {
      title: t('totalCows'),
      value: stats.totalCows,
      icon: Beef,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: t('healthy'),
      value: stats.healthyCows,
      icon: Activity,
      color: 'text-status-healthy',
      bgColor: 'bg-status-healthy/10',
    },
    {
      title: t('inHeat'),
      value: stats.inHeatCows,
      icon: Thermometer,
      color: 'text-status-heat',
      bgColor: 'bg-status-heat/10',
    },
    {
      title: t('heatDetections'),
      value: stats.recentHeatDetections,
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-foreground">{t('dashboard')}</h1>
          <p className="text-muted-foreground">{t('dashboardWelcome')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="font-display text-3xl font-bold text-foreground">
                      {loading ? '-' : stat.value}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Absent Staff Section */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <UserX className="h-5 w-5 text-destructive" />
              {t('absentStaff')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">{t('loading')}</p>
            ) : absentStaff.length === 0 ? (
              <p className="text-muted-foreground">{t('noAbsentStaff')}</p>
            ) : (
              <div className="space-y-3">
                {absentStaff.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div>
                      <p className="font-medium text-foreground">{staff.name}</p>
                      {staff.role && <p className="text-sm text-muted-foreground">{staff.role}</p>}
                    </div>
                    {staff.absent_reason && (
                      <span className="text-sm text-destructive">{staff.absent_reason}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Stock Items */}
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {t('monthlyStock')} - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              {stockItems.length === 0 && !loading && (
                <Button variant="outline" size="sm" onClick={addDefaultItems}>
                  {t('addRecommendedItems')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowAddItem(!showAddItem)}>
                <Plus className="h-4 w-4 mr-1" />
                {t('addItem')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAddItem && (
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder={t('enterItemName')}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
                />
                <Button onClick={addCustomItem} disabled={!newItemName.trim()}>
                  {t('add')}
                </Button>
              </div>
            )}
            {loading ? (
              <p className="text-muted-foreground">{t('loading')}</p>
            ) : stockItems.length === 0 ? (
              <p className="text-muted-foreground">{t('noStockItems')}</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stockItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${item.is_purchased
                        ? 'bg-status-healthy/10 border-status-healthy/30'
                        : 'bg-secondary/50 border-border'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={item.is_purchased}
                        onCheckedChange={() => togglePurchased(item.id, item.is_purchased)}
                      />
                      <span className={item.is_purchased ? 'line-through text-muted-foreground' : 'text-foreground'}>
                        {item.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Info */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent" />
                {t('quickTips')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <h4 className="font-semibold text-foreground mb-1">{t('tipOptimalBreedingTitle')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('tipOptimalBreedingBody')}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="font-semibold text-foreground mb-1">{t('tipAiAssistantTitle')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('tipAiAssistantBody')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display">{t('gettingStarted')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { text: t('gsAddFirstCow'), done: stats.totalCows > 0 },
                  { text: t('gsRecordHeat'), done: stats.recentHeatDetections > 0 },
                  { text: t('gsAskAi'), done: false },
                  { text: t('gsConfigureSettings'), done: false },
                ].map((task, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${task.done ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground'
                      }`}>
                      {task.done && <span className="text-xs">✓</span>}
                    </div>
                    <span className={`text-sm ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
