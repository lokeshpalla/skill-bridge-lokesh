import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Wifi, WifiOff, Zap, Shield, Bell, BellRing, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isSupported, permission, requestPermission } = usePushNotifications();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const onlineHandler = () => setIsOnline(true);
    const offlineHandler = () => setIsOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "Loads instantly, even on slow networks" },
    { icon: WifiOff, title: "Works Offline", desc: "Access courses and problems without internet" },
    { icon: Bell, title: "Push Notifications", desc: "Challenge deadlines, mentor sessions & achievements" },
    { icon: Shield, title: "Secure", desc: "Same security as the web app" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg">
          <img src="/pwa-192x192.png" alt="SkillBridge" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Install SkillBridge</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Get the full app experience — fast, offline-ready, and always at your fingertips.
        </p>
      </motion.div>

      {/* Status */}
      <div className="flex items-center justify-center gap-4">
        <span className={`flex items-center gap-1.5 text-xs font-medium ${isOnline ? "text-success" : "text-destructive"}`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? "Online" : "Offline"}
        </span>
        <span className={`flex items-center gap-1.5 text-xs font-medium ${isInstalled ? "text-success" : "text-muted-foreground"}`}>
          <Smartphone className="w-3.5 h-3.5" />
          {isInstalled ? "Installed" : "Not installed"}
        </span>
        <span className={`flex items-center gap-1.5 text-xs font-medium ${permission === "granted" ? "text-success" : "text-muted-foreground"}`}>
          {permission === "granted" ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          {permission === "granted" ? "Notifications on" : permission === "denied" ? "Notifications blocked" : "Notifications off"}
        </span>
      </div>

      {/* Install Button */}
      <div className="text-center space-y-3">
        {isInstalled ? (
          <div className="space-y-3">
            <p className="text-sm text-success font-medium">✅ App is installed!</p>
            <Link to="/dashboard">
              <Button variant="hero" className="gap-2">
                <Zap className="w-4 h-4" /> Open Dashboard
              </Button>
            </Link>
          </div>
        ) : deferredPrompt ? (
          <Button variant="hero" size="lg" className="gap-2" onClick={handleInstall}>
            <Download className="w-4 h-4" /> Install App
          </Button>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card/60 p-6 max-w-md mx-auto">
            <Smartphone className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium">Install from your browser</p>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>iPhone:</strong> Tap Share → "Add to Home Screen"<br />
              <strong>Android:</strong> Tap the browser menu → "Install app"<br />
              <strong>Desktop:</strong> Click the install icon in the address bar
            </p>
          </div>
        )}
      </div>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border/50 bg-card/60 p-6 max-w-md mx-auto text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <QrCode className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold">Scan to Install</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Scan this QR code from any device to open and install SkillBridge
        </p>
        <div className="bg-white rounded-2xl p-4 inline-block shadow-md border border-border/30">
          <img
            src="/qr-install.png"
            alt="QR Code to install SkillBridge"
            className="w-[200px] h-[200px] rounded-lg"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Works on iPhone, Android, tablets & desktop
        </p>
      </motion.div>

      {/* Push Notifications CTA */}
      {isSupported && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border/50 bg-card/60 p-5 max-w-md mx-auto text-center"
        >
          {permission === "granted" ? (
            <div className="flex items-center justify-center gap-2 text-success">
              <Check className="w-5 h-5" />
              <p className="text-sm font-medium">Push notifications enabled</p>
            </div>
          ) : permission === "denied" ? (
            <>
              <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm font-medium">Notifications blocked</p>
              <p className="text-xs text-muted-foreground mt-1">
                Re-enable in your browser settings to get alerts for challenges, mentor sessions, and achievements.
              </p>
            </>
          ) : (
            <>
              <BellRing className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Enable Push Notifications</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Get reminded about challenge deadlines, mentor sessions, and new achievements.
              </p>
              <Button variant="hero" size="sm" className="gap-2" onClick={requestPermission}>
                <Bell className="w-3.5 h-3.5" /> Allow Notifications
              </Button>
            </>
          )}
        </motion.div>
      )}

      {/* Features */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="rounded-xl border border-border/50 bg-card/60 p-4 text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 mx-auto mb-2 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xs font-semibold">{f.title}</h3>
              <p className="text-[10px] text-muted-foreground mt-1">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default InstallPage;
