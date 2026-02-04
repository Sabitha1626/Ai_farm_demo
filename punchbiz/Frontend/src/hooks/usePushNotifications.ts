import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }

    // Check if already subscribed
    if (user && supported) {
      checkSubscription();
    }
  }, [user]);

  async function checkSubscription() {
    if (!user) return;

    try {
      const res = await api.get('/notifications/status');
      setIsSubscribed(res.data.isSubscribed);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  }

  async function requestPermission(): Promise<boolean> {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Notification permission granted');
        return true;
      } else if (result === 'denied') {
        toast.error('Notification permission denied');
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }

  async function subscribe(): Promise<boolean> {
    if (!user || !isSupported) return false;

    const granted = permission === 'granted' || await requestPermission();
    if (!granted) return false;

    try {
      // In production, you would use a service worker and real push subscription
      // For this implementation, we use a placeholder that mimics the VAPID flow
      await api.post('/notifications/subscribe', {
        endpoint: `https://placeholder-${user.id}`,
        p256dh_key: 'placeholder',
        auth_key: 'placeholder'
      });

      setIsSubscribed(true);
      toast.success('Push notifications enabled');
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to enable push notifications');
      return false;
    }
  }

  async function unsubscribe(): Promise<boolean> {
    if (!user) return false;

    try {
      await api.post('/notifications/unsubscribe');
      setIsSubscribed(false);
      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to disable push notifications');
      return false;
    }
  }

  function showLocalNotification(title: string, body: string, icon?: string) {
    if (permission !== 'granted') return;

    new Notification(title, {
      body,
      icon: icon || '/logo.png',
      badge: '/logo.png',
    });
  }

  return {
    isSupported,
    isSubscribed,
    permission,
    requestPermission,
    subscribe,
    unsubscribe,
    showLocalNotification,
  };
}