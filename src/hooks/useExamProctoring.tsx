import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProctoringConfig {
  userId: string | undefined;
  courseId: number;
  isActive: boolean;
}

interface ProctoringState {
  tabSwitchCount: number;
  copyPasteAttempts: number;
  isFullscreen: boolean;
  isCameraOn: boolean;
  warnings: string[];
}

export const useExamProctoring = ({ userId, courseId, isActive }: ProctoringConfig) => {
  const [state, setState] = useState<ProctoringState>({
    tabSwitchCount: 0,
    copyPasteAttempts: 0,
    isFullscreen: false,
    isCameraOn: false,
    warnings: [],
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const warningCountRef = useRef(0);

  const logEvent = useCallback(async (eventType: string, eventData: Record<string, unknown> = {}) => {
    if (!userId) return;
    await supabase.from("exam_proctoring_logs" as any).insert({
      user_id: userId,
      course_id: courseId,
      event_type: eventType,
      event_data: eventData,
    } as any);
  }, [userId, courseId]);

  const addWarning = useCallback((msg: string) => {
    warningCountRef.current += 1;
    setState(s => ({ ...s, warnings: [...s.warnings.slice(-4), msg] }));
    toast.warning(msg);
  }, []);

  // --- Tab switch detection ---
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setState(s => {
          const count = s.tabSwitchCount + 1;
          return { ...s, tabSwitchCount: count };
        });
        addWarning(`⚠️ Tab switch detected! (${warningCountRef.current} warning${warningCountRef.current > 1 ? "s" : ""})`);
        logEvent("tab_switch", { timestamp: Date.now() });
      }
    };

    const handleBlur = () => {
      addWarning("⚠️ Window lost focus — stay on the exam page!");
      logEvent("window_blur", { timestamp: Date.now() });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isActive, logEvent, addWarning]);

  // --- Copy-paste prevention ---
  useEffect(() => {
    if (!isActive) return;

    const prevent = (e: Event) => {
      e.preventDefault();
      setState(s => ({ ...s, copyPasteAttempts: s.copyPasteAttempts + 1 }));
      addWarning("🚫 Copy/paste is disabled during the exam!");
      logEvent("copy_paste_attempt", { action: e.type, timestamp: Date.now() });
    };

    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("cut", prevent);

    // Disable right-click context menu
    const preventContext = (e: Event) => {
      e.preventDefault();
      addWarning("🚫 Right-click is disabled during the exam!");
      logEvent("right_click_attempt", { timestamp: Date.now() });
    };
    document.addEventListener("contextmenu", preventContext);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", preventContext);
    };
  }, [isActive, logEvent, addWarning]);

  // --- Fullscreen mode ---
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setState(s => ({ ...s, isFullscreen: true }));
      logEvent("fullscreen_entered", { timestamp: Date.now() });
    } catch {
      toast.error("Could not enter fullscreen. Please allow fullscreen.");
    }
  }, [logEvent]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setState(s => ({ ...s, isFullscreen: false }));
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive) {
        setState(s => ({ ...s, isFullscreen: false }));
        addWarning("⚠️ You exited fullscreen! Please return to fullscreen mode.");
        logEvent("fullscreen_exited", { timestamp: Date.now() });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isActive, logEvent, addWarning]);

  // --- Camera monitoring ---
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setState(s => ({ ...s, isCameraOn: true }));
      logEvent("camera_started", { timestamp: Date.now() });
      return true;
    } catch {
      toast.error("Camera access denied. Please allow camera for exam proctoring.");
      logEvent("camera_denied", { timestamp: Date.now() });
      return false;
    }
  }, [logEvent]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setState(s => ({ ...s, isCameraOn: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Log exam start/end
  useEffect(() => {
    if (isActive) {
      logEvent("exam_started", { timestamp: Date.now() });
    }
  }, [isActive]);

  return {
    state,
    videoRef,
    enterFullscreen,
    exitFullscreen,
    startCamera,
    stopCamera,
    logEvent,
  };
};
