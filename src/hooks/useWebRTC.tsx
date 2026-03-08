import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionState: (state: string) => void;
}

export function useWebRTC({ roomId, userId, onRemoteStream, onConnectionState }: UseWebRTCOptions) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: event.candidate.toJSON(), from: userId },
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      onConnectionState(pc.connectionState);
      setIsConnected(pc.connectionState === "connected");
    };

    pcRef.current = pc;
    return pc;
  }, [userId, onRemoteStream, onConnectionState]);

  const startCall = useCallback(async (audio: boolean, video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
      localStreamRef.current = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Join signaling channel
      const channel = supabase.channel(`webrtc-${roomId}`, {
        config: { broadcast: { self: false } },
      });

      channelRef.current = channel;

      channel
        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.from === userId) return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({
            type: "broadcast",
            event: "answer",
            payload: { answer, from: userId },
          });
        })
        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.from === userId) return;
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        })
        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          if (payload.from === userId) return;
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            // Ignore ICE errors
          }
        })
        .on("broadcast", { event: "join" }, async ({ payload }) => {
          if (payload.from === userId) return;
          // Someone joined, create offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({
            type: "broadcast",
            event: "offer",
            payload: { offer, from: userId },
          });
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Announce presence
            channel.send({
              type: "broadcast",
              event: "join",
              payload: { from: userId },
            });
          }
        });

      return stream;
    } catch (error) {
      console.error("Failed to start call:", error);
      return null;
    }
  }, [roomId, userId, createPeerConnection]);

  const toggleAudio = useCallback((enabled: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }, []);

  const toggleVideo = useCallback((enabled: boolean) => {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }, []);

  const endCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream: localStreamRef.current,
    isConnected,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
}
