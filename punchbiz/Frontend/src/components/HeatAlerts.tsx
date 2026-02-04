import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, Thermometer, Clock, Check } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface HeatAlert {
  id: string;
  cowId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  sensorType: string | null;
  optimalBreedingStart: string | null;
  optimalBreedingEnd: string | null;
  createdAt: string;
  cowInfo?: {
    name: string;
    tagNumber: string;
  };
}

interface HeatAlertsProps {
  onAlertCount?: (count: number) => void;
}

export function HeatAlerts({ onAlertCount }: HeatAlertsProps) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<HeatAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const response = await api.get('/alerts');
      const data = response.data.map((a: any) => ({
        id: a._id,
        cowId: a.cowId?._id || a.cowId,
        alertType: a.alertType,
        severity: a.severity,
        title: a.title,
        message: a.message,
        isRead: a.isRead,
        isDismissed: a.isDismissed,
        sensorType: a.sensorType,
        optimalBreedingStart: a.optimalBreedingStart,
        optimalBreedingEnd: a.optimalBreedingEnd,
        createdAt: a.createdAt,
        cowInfo: a.cowId && typeof a.cowId === 'object' ? {
          name: a.cowId.name,
          tagNumber: a.cowId.tagNumber
        } : undefined
      }));
      setAlerts(data);
      onAlertCount?.(data.filter((a: any) => !a.isRead).length);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAlerts();

      // Set up polling for new alerts every 60 seconds
      const interval = setInterval(fetchAlerts, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAsRead = async (alertId: string) => {
    try {
      await api.put(`/alerts/${alertId}/read`);
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, isRead: true } : a))
      );
      const updatedAlerts = alerts.map(a => (a.id === alertId ? { ...a, isRead: true } : a));
      onAlertCount?.(updatedAlerts.filter(a => !a.isRead).length);
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await api.put(`/alerts/${alertId}/dismiss`);
      const filtered = alerts.filter(a => a.id !== alertId);
      setAlerts(filtered);
      onAlertCount?.(filtered.filter(a => !a.isRead).length);
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-yellow-500',
      medium: 'bg-orange-500',
      high: 'bg-red-500',
      critical: 'bg-red-600 animate-pulse',
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getAlertIcon = (type: string) => {
    if (type === 'heat_detected') return Thermometer;
    if (type === 'optimal_breeding') return Clock;
    return Bell;
  };

  if (loading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Heat Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-secondary/50 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Heat Alerts
          {alerts.filter(a => !a.isRead).length > 0 && (
            <Badge className="bg-red-500">
              {alerts.filter(a => !a.isRead).length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const Icon = getAlertIcon(alert.alertType);
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-all ${alert.isRead
                      ? 'bg-secondary/30 border-border'
                      : 'bg-primary/5 border-primary/20'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-lg ${getSeverityColor(alert.severity)} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          {alert.cowInfo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                              {alert.cowInfo.tagNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                        {alert.optimalBreedingStart && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            Breed before: {format(new Date(alert.optimalBreedingEnd || alert.optimalBreedingStart), 'MMM d, h:mm a')}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => markAsRead(alert.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}