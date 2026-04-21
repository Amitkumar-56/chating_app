export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.error('This browser does not support notifications.');
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();
  return permission;
};

export const showNotification = (title, body, icon = '/favicon.ico') => {
  if (typeof window !== 'undefined' && Notification.permission === 'granted') {
    // Try via Service Worker first for better background support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          tag: 'mpcpl-mesh-alert',
          renotify: true
        });
      });
    } else {
      // Fallback to standard notification
      const notification = new Notification(title, { body, icon });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
};
