import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Thermometer,
  Scale,
  Milk,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface SensorStatus {
  type: string;
  name: string;
  icon: React.ReactNode;
  status: 'online' | 'offline' | 'warning';
  lastReading: string | null;
  lastValue: string | null;
  count: number;
}

export default function SensorDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [sensors, setSensors] = useState<SensorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchSensorStatus = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [heatResult, weightResult, milkResult, attendanceResult] = await Promise.all([
        api.get('/events/heat'),
        api.get('/sensors/weight'),
        api.get('/milk'),
        api.get('/staff/attendance'),
      ]);

      const heatData = heatResult.data;
      const weightData = weightResult.data;
      const milkData = milkResult.data;
      const attendanceData = attendanceResult.data;

      // Process sensor data
      const sensorTypes: Record<string, SensorStatus> = {};
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Process heat detection sensors
      if (heatData) {
        heatData.forEach((record: any) => {
          const type = record.sensorType || 'activity';
          if (!sensorTypes[type]) {
            sensorTypes[type] = {
              type,
              name: getSensorDisplayName(type),
              icon: getSensorIcon(type),
              status: 'offline',
              lastReading: null,
              lastValue: null,
              count: 0
            };
          }
          sensorTypes[type].count++;
          const detectedAt = record.detectedAt || record.createdAt;
          if (!sensorTypes[type].lastReading || new Date(detectedAt) > new Date(sensorTypes[type].lastReading!)) {
            sensorTypes[type].lastReading = detectedAt;
            sensorTypes[type].lastValue = record.sensorReading?.toString() || 'N/A';
            sensorTypes[type].status = new Date(detectedAt) > oneHourAgo ? 'online' : 'warning';
          }
        });
      }

      // Process weight sensors
      if (weightData && weightData.length > 0) {
        const latestWeight = weightData[0];
        sensorTypes['weight'] = {
          type: 'weight',
          name: t('weightSensor') || 'Weight Sensor',
          icon: <Scale className="h-6 w-6" />,
          status: new Date(latestWeight.recordedAt) > oneHourAgo ? 'online' : 'warning',
          lastReading: latestWeight.recordedAt,
          lastValue: `${latestWeight.weight} kg`,
          count: weightData.length
        };
      }

      // Process milk sensors
      if (milkData && milkData.length > 0) {
        const automaticMilk = milkData.filter((m: any) => m.isAutomatic);
        if (automaticMilk.length > 0) {
          const latestMilk = automaticMilk[0];
          sensorTypes['milk'] = {
            type: 'milk',
            name: t('milkSensor') || 'Milk Sensor',
            icon: <Milk className="h-6 w-6" />,
            status: new Date(latestMilk.recordedAt) > oneHourAgo ? 'online' : 'warning',
            lastReading: latestMilk.recordedAt,
            lastValue: `${latestMilk.quantityLiters} L`,
            count: automaticMilk.length
          };
        }
      }

      // Process biometric sensors
      if (attendanceData && attendanceData.length > 0) {
        const biometricTypes = [...new Set(attendanceData.map((a: any) => a.biometricType).filter(Boolean))];
        biometricTypes.forEach((type: any) => {
          if (!type) return;
          const records = attendanceData.filter((a: any) => a.biometricType === type);
          const latest = records[0];
          sensorTypes[`biometric_${type}`] = {
            type: `biometric_${type}`,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)} Scanner`,
            icon: <Radio className="h-6 w-6" />,
            status: new Date(latest.checkIn) > oneHourAgo ? 'online' : 'warning',
            lastReading: latest.checkIn,
            lastValue: 'Active',
            count: records.length
          };
        });
      }

      // Add default sensors if no data
      if (Object.keys(sensorTypes).length === 0) {
        setSensors([
          {
            type: 'activity',
            name: t('activitySensor') || 'Activity Sensor',
            icon: <Activity className="h-6 w-6" />,
            status: 'offline',
            lastReading: null,
            lastValue: null,
            count: 0
          },
          {
            type: 'temperature',
            name: t('temperatureSensor') || 'Temperature Sensor',
            icon: <Thermometer className="h-6 w-6" />,
            status: 'offline',
            lastReading: null,
            lastValue: null,
            count: 0
          },
          {
            type: 'weight',
            name: t('weightSensor') || 'Weight Sensor',
            icon: <Scale className="h-6 w-6" />,
            status: 'offline',
            lastReading: null,
            lastValue: null,
            count: 0
          },
          {
            type: 'milk',
            name: t('milkSensor') || 'Milk Sensor',
            icon: <Milk className="h-6 w-6" />,
            status: 'offline',
            lastReading: null,
            lastValue: null,
            count: 0
          }
        ]);
      } else {
        setSensors(Object.values(sensorTypes));
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching sensor status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensorStatus();
  }, [user]);

  const getSensorDisplayName = (type: string): string => {
    const names: Record<string, string> = {
      'activity': t('activitySensor') || 'Activity Sensor',
      'pedometer': t('pedometerSensor') || 'Pedometer',
      'neck_collar': t('neckCollarSensor') || 'Neck Collar',
      'ear_tag': t('earTagSensor') || 'Ear Tag',
      'body_temperature': t('temperatureSensor') || 'Body Temp',
      'vaginal_temperature': t('vaginalTempSensor') || 'Vaginal Temp',
      'rumen_bolus': t('rumenBolusSensor') || 'Rumen Bolus',
      'mounting_pressure': t('mountingSensor') || 'Mounting Sensor',
      'tail_head': t('tailHeadSensor') || 'Tail-head Sensor',
      'rumination': t('ruminationSensor') || 'Rumination Sensor',
      'milk_progesterone': t('progesteroneSensor') || 'Progesterone Sensor'
    };
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  };

  const getSensorIcon = (type: string): React.ReactNode => {
    if (type.includes('temperature')) return <Thermometer className="h-6 w-6" />;
    if (type.includes('activity') || type.includes('pedometer')) return <Activity className="h-6 w-6" />;
    return <Radio className="h-6 w-6" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const onlineCount = sensors.filter(s => s.status === 'online').length;
  const warningCount = sensors.filter(s => s.status === 'warning').length;
  const offlineCount = sensors.filter(s => s.status === 'offline').length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t('sensorDashboard') || 'Sensor Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('lastUpdated') || 'Last Updated'}: {format(lastRefresh, 'HH:mm:ss')}
            </p>
          </div>
          <Button onClick={fetchSensorStatus} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh') || 'Refresh'}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('online') || 'Online'}</p>
                  <p className="text-3xl font-bold text-green-600 font-display">{onlineCount}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('warning') || 'Warning'}</p>
                  <p className="text-3xl font-bold text-yellow-600 font-display">{warningCount}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('offline') || 'Offline'}</p>
                  <p className="text-3xl font-bold text-red-600 font-display">{offlineCount}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full">
                  <WifiOff className="h-8 w-8 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => (
            <Card key={sensor.type} className="relative overflow-hidden shadow-soft hover:shadow-md transition-shadow">
              <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(sensor.status)}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      {sensor.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{sensor.name}</CardTitle>
                      <div className="flex items-center gap-1 mt-1">
                        {getStatusIcon(sensor.status)}
                        <span className="text-xs capitalize text-muted-foreground">
                          {t(sensor.status) || sensor.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={sensor.status === 'online' ? 'default' : 'secondary'} className="text-[10px]">
                    {sensor.count} {t('readings') || 'Readings'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {sensor.lastReading ? (
                  <div className="space-y-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('lastReading') || 'Last Reading'}:</span>
                      <span className="font-semibold text-foreground">{sensor.lastValue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('time') || 'Time'}:</span>
                      <span className="font-medium">
                        {format(new Date(sensor.lastReading), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    {t('noDataReceived') || 'No data received'}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
