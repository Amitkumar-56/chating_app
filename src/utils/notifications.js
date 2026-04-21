export const requestNotificationPermission = async () => {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return 'unsupported';
  }

  // Check if we're in a secure context (required for notifications)
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    console.warn('Notifications require HTTPS or localhost.');
    return 'insecure';
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    // Log the result for debugging
    console.log('Notification permission:', permission);
    
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'error';
  }
};

export const showNotification = async (title, body, options = {}) => {
  const defaultOptions = {
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjQiIGZpbGw9IiMwMGE4ODQiLz4KPHBhdGggZD0iTTEyIDI0SDE2VjIwSDEyVjI0Wk0yMCAyNEgyNFYyMEgyMFYyNFpNMjggMjRIMzJWMjBIMjhWMjRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMwMGE4ODQiLz4KPC9zdmc+',
    tag: 'mpcpl-chat',
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: { url: '/' },
    ...options
  };

  // Check if notifications are supported and permitted
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  try {
    // Try via Service Worker first for better background support
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if push manager is available
      if ('showNotification' in registration) {
        await registration.showNotification(title, {
          body,
          ...defaultOptions
        });
        return true;
      }
    }

    // Fallback to standard notification
    const notification = new Notification(title, {
      body,
      ...defaultOptions
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

export const checkNotificationSupport = () => {
  const support = {
    supported: 'Notification' in window,
    permission: 'Notification' in window ? Notification.permission : 'unsupported',
    secureContext: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: false
  };

  // Check for push manager support
  if (support.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(registration => {
      support.pushManager = 'pushManager' in registration;
    }).catch(() => {
      // Service worker not ready
    });
  }

  return support;
};

export const subscribeToPushNotifications = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported');
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!('pushManager' in registration)) {
      throw new Error('Push Manager not supported');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: null // You'll need to provide your VAPID public key here
    });

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
};
