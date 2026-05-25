// src/hooks/usePushNotifications.js
// Manages browser notification permission + service worker integration
import { useState, useEffect, useCallback } from 'react';

let swRegistration = null;

// ── Register service worker once ─────────────────────────────────────────
async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  if (swRegistration) return swRegistration;
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return swRegistration;
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
    return null;
  }
}

// ── Show a native browser notification via the service worker ─────────────
export async function showBrowserNotification({ title, body, icon, tag, url, urgent = false }) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const sw = await registerSW();
  if (sw?.active) {
    sw.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: { title, body, icon, tag, url, urgent },
    });
  } else {
    // Fallback: direct Notification API
    new Notification(title, { body, icon: icon || '/favicon.ico', tag });
  }
}

// ── Notification config per SSE event type ───────────────────────────────
const NOTIF_MAP = {
  new_blood_request: (data) => ({
    title: '🩸 Blood Needed!',
    body: `Urgent: ${data?.bloodGroup || ''} blood required at ${data?.hospital || 'a hospital'}`,
    tag: 'blood-request',
    urgent: data?.urgency === 'emergency',
    url: '/dashboard',
  }),
  request_accepted: (data) => ({
    title: '✅ Donor Found!',
    body: `A donor has accepted your blood request.`,
    tag: 'request-accepted',
    urgent: false,
    url: '/dashboard',
  }),
  request_fulfilled: (data) => ({
    title: '🎉 Donation Complete!',
    body: `Your blood donation has been confirmed. Thank you for saving a life!`,
    tag: 'fulfilled',
    urgent: false,
    url: '/dashboard',
  }),
  event_notification: (data) => ({
    title: '📅 New Blood Drive Event',
    body: data?.title || 'A new blood drive event has been posted.',
    tag: 'event',
    urgent: false,
    url: '/dashboard',
  }),
  event_reminder: (data) => ({
    title: '⏰ Event Reminder',
    body: data?.title || 'A blood drive event is coming up soon!',
    tag: 'event-reminder',
    urgent: false,
    url: '/dashboard',
  }),
};

// ── usePushNotifications hook ─────────────────────────────────────────────
export function usePushNotifications() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('Notification' in window && 'serviceWorker' in navigator);
    // Register SW on mount regardless of permission
    registerSW();
  }, []);

  // Request permission from user
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied';
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      await registerSW();
      // Welcome notification
      setTimeout(() => {
        showBrowserNotification({
          title: '🩸 BloodBridge Notifications On!',
          body: "You'll now get instant alerts for blood requests and updates.",
          tag: 'welcome',
          url: '/dashboard',
        });
      }, 500);
    }
    return result;
  }, []);

  // Trigger a notification for an SSE event
  const notifyFromSSE = useCallback((eventType, data) => {
    if (permission !== 'granted') return;
    const builder = NOTIF_MAP[eventType];
    if (!builder) return;
    const payload = builder(data);
    showBrowserNotification(payload);
  }, [permission]);

  return { permission, supported, requestPermission, notifyFromSSE };
}
