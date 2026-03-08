import { useState, useEffect, useCallback } from "react";

type PermissionState = "default" | "granted" | "denied";

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const isSupported = typeof Notification !== "undefined";

  useEffect(() => {
    if (!isSupported) return;
    setPermission(Notification.permission);
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return "denied" as PermissionState;
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
    return result as PermissionState;
  }, [isSupported]);

  const showNotification = useCallback(
    (title: string, options?: { body?: string; icon?: string; tag?: string; data?: { url?: string } }) => {
      if (!isSupported || permission !== "granted") return;

      // Use service worker registration if available for better PWA support
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body: options?.body || "",
            icon: options?.icon || "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            tag: options?.tag || "skillbridge-notification",
            vibrate: [100, 50, 100],
            data: options?.data,
            requireInteraction: false,
          });
        });
      } else {
        // Fallback to basic Notification API
        const notification = new Notification(title, {
          body: options?.body || "",
          icon: options?.icon || "/pwa-192x192.png",
          tag: options?.tag || "skillbridge-notification",
        });
        if (options?.data?.url) {
          notification.onclick = () => {
            window.focus();
            window.location.href = options.data!.url!;
          };
        }
      }
    },
    [isSupported, permission]
  );

  return { isSupported, permission, requestPermission, showNotification };
}
