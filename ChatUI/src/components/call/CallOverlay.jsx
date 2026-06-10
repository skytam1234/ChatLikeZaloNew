import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/utils/cn.js";
import { Avatar, Button } from "@/components/common/index.js";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  Maximize2,
  Minimize2,
  MoreVertical,
} from "lucide-react";
import { useCallStore, CALL_STATES } from "@/stores/callStore.js";
import { socketService } from "@/services/socketService.js";

/**
 * Format duration in mm:ss
 */
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * CallOverlay - Full screen overlay for active call
 */
export const CallOverlay = ({ onClose }) => {
  // Subscribe individually — prevents full re-render when unrelated store slices change
  const callState = useCallStore((s) => s.callState);
  const currentCallType = useCallStore((s) => s.currentCallType);
  const callerInfo = useCallStore((s) => s.callerInfo);
  const calleeInfo = useCallStore((s) => s.calleeInfo);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const isMuted = useCallStore((s) => s.isMuted);
  const isVideoOff = useCallStore((s) => s.isVideoOff);
  const isSpeakerOn = useCallStore((s) => s.isSpeakerOn);
  const error = useCallStore((s) => s.error);
  const callDuration = useCallStore((s) => s.callDuration);
  const { setCallDuration, toggleMute, toggleVideo, resetCall } = useCallStore.getState();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const controlsTimeoutRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callTimerRef = useRef(null);
  const dialingAudioRef = useRef(null);
  const isDialingPlayingRef = useRef(false);
  const callTimeoutRef = useRef(null);
  const CALL_TIMEOUT_MS = 30000; // 30 seconds max ringing before auto-end

  const isVideoCall = currentCallType === "video";
  const isConnected = callState === CALL_STATES.CONNECTED;
  const isCalling = callState === CALL_STATES.CALLING;
  const isRinging = callState === CALL_STATES.RINGING;
  const isRejected = callState === CALL_STATES.REJECTED;

  // Setup local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Setup remote video + remote audio playback
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Handle speaker toggle — play audio through selected output device
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;
    if (isSpeakerOn) {
      audioEl.volume = 1;
    } else {
      audioEl.volume = 0;
    }
  }, [isSpeakerOn]);

  // Play dialing sound while ringing (caller side) or waiting to connect
  useEffect(() => {
    if ((isRinging || isCalling) && !isDialingPlayingRef.current) {
      try {
        dialingAudioRef.current = new Audio("/tiengChuong.mp3");
        dialingAudioRef.current.loop = true;
        dialingAudioRef.current.volume = 0.6;
        isDialingPlayingRef.current = true;
        dialingAudioRef.current.play().catch(() => {
          isDialingPlayingRef.current = false;
        });
      } catch {
        isDialingPlayingRef.current = false;
      }
    }

    // Stop when connected or call ended
    if ((isConnected || isRejected) && isDialingPlayingRef.current) {
      if (dialingAudioRef.current) {
        dialingAudioRef.current.pause();
        dialingAudioRef.current.src = "";
        dialingAudioRef.current = null;
      }
      isDialingPlayingRef.current = false;
    }

    return () => {
      if (dialingAudioRef.current) {
        dialingAudioRef.current.pause();
        dialingAudioRef.current.src = "";
        dialingAudioRef.current = null;
        isDialingPlayingRef.current = false;
      }
    };
  }, [isRinging, isCalling, isConnected, isRejected]);

  // Client-side timeout: auto-end call if no answer after 90s
  useEffect(() => {
    if (isRinging || isCalling) {
      // Start 90s countdown
      callTimeoutRef.current = setTimeout(() => {
        // Stop dialing sound
        if (dialingAudioRef.current) {
          dialingAudioRef.current.pause();
          dialingAudioRef.current.src = "";
          dialingAudioRef.current = null;
          isDialingPlayingRef.current = false;
        }
        // Notify server that call timed out (no answer)
        const currentCallId = useCallStore.getState().currentCallId;
        if (currentCallId) {
          socketService.endCall(currentCallId);
        }
        // Reset overlay and call state
        resetCall();
      }, CALL_TIMEOUT_MS);
    }

    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    };
  }, [isRinging, isCalling]);

  // Call timer
  useEffect(() => {
    if (isConnected) {
      const startTime = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [isConnected]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isConnected) {
          setShowControls(false);
        }
      }, 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isConnected]);

  const handleEndCall = () => {
    const currentCallId = useCallStore.getState().currentCallId;
    console.log(`[FE-END] handleEndCall | currentCallId=${currentCallId} | socketConnected=${socketService.socket?.connected} | socketId=${socketService.socket?.id}`);
    if (currentCallId) {
      socketService.endCall(currentCallId);
    } else {
      console.warn('[FE-END] No currentCallId in store, skip emit');
    }
    resetCall();
    onClose?.();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getStatusText = () => {
    if (isRejected) return error || "Người dùng hiện không liên lạc được";
    if (isRinging) return "Đang chuông...";
    if (isCalling) return "Đang gọi...";
    if (isConnected) return formatDuration(callDuration);
    return "";
  };

  const participantInfo = calleeInfo || callerInfo;
  const participantName = participantInfo?.displayName || "Người dùng";
  const participantAvatar = participantInfo?.avatarUrl;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col",
        isVideoCall
          ? "bg-gray-900"
          : "bg-gradient-to-br from-gray-800 to-gray-900",
      )}
    >
      {/* Hidden audio element for audio-only calls (controlled by speaker toggle) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
      {/* Remote video (full screen) */}
      {isVideoCall ? (
        <div className="relative flex-1 flex items-center justify-center">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Avatar
                src={participantAvatar}
                name={participantName}
                size="2xl"
                className={cn(
                  "w-32 h-32 mb-4",
                  isRejected && "border-4 border-red-500",
                )}
              />
              <h2 className="text-2xl font-semibold text-white mb-2">
                {participantName}
              </h2>
              <p
                className={cn(
                  "text-lg",
                  isConnected
                    ? "text-green-400"
                    : isRejected
                      ? "text-red-400"
                      : "text-gray-400",
                )}
              >
                {getStatusText()}
              </p>
              {isRejected && (
                <Button
                  variant="primary"
                  onClick={handleEndCall}
                  className="mt-6 px-8 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
                >
                  Đóng
                </Button>
              )}
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          <div className="absolute bottom-4 right-4 w-40 h-28 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover",
                  isVideoOff && "hidden",
                )}
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      ) : (
        // Audio call UI
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Avatar with animated ring */}
          <div className="relative mb-6">
            {isConnected && (
              <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping" />
            )}
            {isRinging && (
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse" />
            )}
            <Avatar
              src={participantAvatar}
              name={participantName}
              size="2xl"
              className={cn(
                "w-32 h-32 border-4",
                isRejected ? "border-red-500" : "border-white/20",
              )}
            />
          </div>

          <h2 className="text-2xl font-semibold text-white mb-2">
            {participantName}
          </h2>
          <p
            className={cn(
              "text-lg",
              isConnected
                ? "text-green-400"
                : isRejected
                  ? "text-red-400"
                  : "text-gray-400",
            )}
          >
            {getStatusText()}
          </p>

          {/* Auto-close button when rejected */}
          {isRejected && (
            <Button
              variant="primary"
              onClick={handleEndCall}
              className="mt-6 px-8 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full"
            >
              Đóng
            </Button>
          )}
        </div>
      )}

      {/* Control bar */}
      <div
        className={cn(
          "transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">
              {isVideoCall ? "Video call" : "Audio call"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInfo(!showInfo)}
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
            {isVideoCall && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFullscreen}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/50 to-transparent">
          {/* Mute button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={cn(
              "h-14 w-14 rounded-full transition-all",
              isMuted
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-white/10 hover:bg-white/20 text-white",
            )}
          >
            {isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>

          {/* Video toggle (video calls only) */}
          {isVideoCall && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVideo}
              className={cn(
                "h-14 w-14 rounded-full transition-all",
                isVideoOff
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-white/10 hover:bg-white/20 text-white",
              )}
            >
              {isVideoOff ? (
                <VideoOff className="w-6 h-6" />
              ) : (
                <Video className="w-6 h-6" />
              )}
            </Button>
          )}

          {/* Speaker button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => useCallStore.getState().toggleSpeaker()}
            title={isSpeakerOn ? "Tắt loa" : "Bật loa"}
            className={cn(
              "h-14 w-14 rounded-full transition-all",
              !isSpeakerOn
                ? "bg-white/10 hover:bg-white/20 text-white"
                : "bg-white/10 hover:bg-white/20 text-white",
            )}
          >
            <Volume2
              className={cn("w-6 h-6", !isSpeakerOn && "text-red-400")}
            />
          </Button>

          {/* End call button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEndCall}
            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all hover:scale-105 active:scale-95"
          >
            <PhoneOff className="w-6 h-6 rotate-[135deg]" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;
