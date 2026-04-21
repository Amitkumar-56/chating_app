'use client';
import { useEffect } from 'react';

export default function NotificationManager() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker Registered', reg))
        .catch((err) => console.error('Service Worker Registration Failed', err));
    }

    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  return null;
}
