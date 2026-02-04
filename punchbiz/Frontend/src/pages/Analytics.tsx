import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  TrendingUp,
  Beef,
  Thermometer,
  Baby,
  Activity,
  Calendar,
  Milk
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, subDays } from 'date-fns';

interface Stats {
  totalCows: number;
  healthyCows: number;
  pregnantCows: number;
  inHeatCows: number;
  sickCows: number;
  totalHeatRecords: number;
  totalBreedingEvents: number;
  successfulInseminations: number;
  totalMilkProduction: number;
  avgDailyMilk: number;
}

interface MonthlyData {
  month: string;
  heatDetections: number;
  inseminations: number;
  calvings: number;
}

interface MilkData {
  date: string;
  liters: number;
}

const COLORS = ['hsl(var(--status-healthy))', 'hsl(var(--status-pregnant))', 'hsl(var(--status-heat))', 'hsl(var(--status-sick))'];

export default function Analytics() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalCows: 0,
    healthyCows: 0,
    pregnantCows: 0,
    inHeatCows: 0,
    sickCows: 0,
    totalHeatRecords: 0,
    totalBreedingEvents: 0,
    successfulInseminations: 0,
    totalMilkProduction: 0,
    avgDailyMilk: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [milkData, setMilkData] = useState<MilkData[]>([]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const thirtyDaysAgo = subDays(new Date(), 30);

      const [cowsRes, heatRes, breedingRes, milkRes] = await Promise.all([
        api.get('/cows'),
        api.get('/events/heat'),
        api.get('/events/breeding'),
        api.get(`/milk?startDate=${thirtyDaysAgo.toISOString()}`)
      ]);

      const cows = cowsRes.data;
      const heatRecords = heatRes.data;
      const breedingEvents = breedingRes.data;
      const milkProduction = milkRes.data;

      // Calculate milk stats
      const totalMilk = milkProduction?.reduce((sum: number, r: any) => sum + Number(r.quantityLiters), 0) || 0;
      const avgDailyMilk = milkProduction && milkProduction.length > 0
        ? totalMilk / 30
        : 0;

      // Calculate stats
      setStats({
        totalCows: cows.length,
        healthyCows: cows.filter((c: any) => c.status === 'Healthy').length,
        pregnantCows: cows.filter((c: any) => c.status === 'Pregnant').length,
        inHeatCows: cows.filter((c: any) => c.status === 'In Heat').length,
        sickCows: cows.filter((c: any) => c.status === 'Sick').length,
        totalHeatRecords: heatRecords?.length || 0,
        totalBreedingEvents: breedingEvents?.length || 0,
        successfulInseminations: breedingEvents?.filter((e: any) => e.eventType === 'Insemination' && e.status === 'Completed').length || 0,
        totalMilkProduction: totalMilk,
        avgDailyMilk,
      });

      // Calculate monthly data for the last 6 months
      const last6Months: MonthlyData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        const monthHeat = heatRecords?.filter((h: any) => {
          const date = new Date(h.detectedAt);
          return date >= monthStart && date <= monthEnd;
        }).length || 0;

        const monthInseminations = breedingEvents?.filter((e: any) => {
          const date = new Date(e.eventDate);
          return date >= monthStart && date <= monthEnd && e.eventType === 'Insemination';
        }).length || 0;

        const monthCalvings = breedingEvents?.filter((e: any) => {
          const date = new Date(e.eventDate);
          return date >= monthStart && date <= monthEnd && e.eventType === 'Calving';
        }).length || 0;

        last6Months.push({
          month: format(monthDate, 'MMM'),
          heatDetections: monthHeat,
          inseminations: monthInseminations,
          calvings: monthCalvings,
        });
      }
      setMonthlyData(last6Months);

      // Process milk data for chart
      const dailyMilk: Record<string, number> = {};
      milkProduction?.forEach((record: any) => {
        const date = format(new Date(record.recordedAt), 'MMM d');
        dailyMilk[date] = (dailyMilk[date] || 0) + Number(record.quantityLiters);
      });

      const milkChartData = Object.entries(dailyMilk)
        .slice(-14)
        .map(([date, liters]) => ({ date, liters }));
      setMilkData(milkChartData);

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: t('healthy'), value: stats.healthyCows },
    { name: t('pregnant'), value: stats.pregnantCows },
    { name: t('inHeat'), value: stats.inHeatCows },
    { name: t('sick'), value: stats.sickCows },
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t('analyticsDashboard')}</h1>
          <p className="text-muted-foreground">{t('analyticsDesc')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Beef className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCows}</p>
                  <p className="text-sm text-muted-foreground">{t('totalCowsLabel')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Thermometer className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalHeatRecords}</p>
                  <p className="text-sm text-muted-foreground">{t('heatDetectionsLabel')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Milk className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalMilkProduction.toFixed(0)}L</p>
                  <p className="text-sm text-muted-foreground">{t('thirtyDayMilk')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgDailyMilk.toFixed(1)}L</p>
                  <p className="text-sm text-muted-foreground">{t('avgPerDay')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Baby className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.successfulInseminations}</p>
                  <p className="text-sm text-muted-foreground">{t('inseminations')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Milk Production Chart */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Milk className="h-5 w-5 text-blue-500" />
              {t('dailyMilkProduction')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-64 bg-secondary/50 rounded" />
            ) : milkData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={milkData}>
                  <defs>
                    <linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(220, 80%, 60%)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(220, 80%, 60%)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)} Liters`, 'Milk']}
                  />
                  <Area
                    type="monotone"
                    dataKey="liters"
                    stroke="hsl(220, 80%, 60%)"
                    fillOpacity={1}
                    fill="url(#colorMilk)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                {t('noMilkData')}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Herd Status Pie Chart */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('herdStatusDistribution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse h-64 bg-secondary/50 rounded" />
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {t('noDataAvailable')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('monthlyBreedingTrends')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse h-64 bg-secondary/50 rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="heatDetections"
                      stroke="hsl(var(--status-heat))"
                      name={t('heatDetectionsLabel')}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="inseminations"
                      stroke="hsl(220, 80%, 60%)"
                      name={t('inseminations')}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="calvings"
                      stroke="hsl(var(--status-healthy))"
                      name={t('calvings')}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Bar Chart */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('activityOverview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-64 bg-secondary/50 rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="heatDetections" fill="hsl(var(--status-heat))" name={t('heatDetectionsLabel')} />
                  <Bar dataKey="inseminations" fill="hsl(220, 80%, 60%)" name={t('inseminations')} />
                  <Bar dataKey="calvings" fill="hsl(var(--status-healthy))" name={t('calvings')} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}