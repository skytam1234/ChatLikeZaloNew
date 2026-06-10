import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  AuthProvider,
  useAuthContext,
  SocketProvider,
  useSocketContext,
  ChatProvider,
  useChatContext,
} from "@/contexts/index.js";
import { ToastProvider } from "@/components/common/index.js";
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  AuthCallback,
} from "@/pages/auth/index.js";
import {
  ChatLayout,
  ConversationPage,
  NewConversationPage,
  CallHistoryPage,
} from "@/pages/chat/index.js";
import { AiChatPage } from "@/pages/ai/index.js";
import { SettingsPage } from "@/pages/settings/index.js";
import { MainLayout } from "@/components/layout/index.js";
import { PrivateRoute, AdminRoute } from "./PrivateRoute.jsx";
import { ROUTES } from "@/utils/constants.js";
import { IncomingCallModal, CallOverlay } from "@/components/call/index.js";
import { useCallStore, useAuthStore } from "@/stores/index.js";
import { webrtcService } from "@/services/webrtcService.js";
import { socketService } from "@/services/socketService.js";
import { AdminDashboard } from "@/pages/index.js";

const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {isAuthenticated ? (
        <Route element={<PrivateRoute />}>
          <Route
            element={
              <MainLayout
                sidebarOpen={sidebarOpen}
                onSidebarToggle={() => setSidebarOpen((v) => !v)}
              />
            }
          >
            <Route path={ROUTES.CHAT} element={<ChatLayout />} />
            <Route
              path={`${ROUTES.CHAT}/new`}
              element={<NewConversationPage />}
            />
            <Route path={ROUTES.CALL_HISTORY} element={<CallHistoryPage />} />
            <Route path={ROUTES.AI_CHAT} element={<AiChatPage />} />
            <Route
              path={`${ROUTES.CHAT}/:id`}
              element={
                <ConversationPage onMenuClick={() => setSidebarOpen(true)} />
              }
            />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path={ROUTES.ADMIN} element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.CHAT} replace />} />
        </Route>
      ) : (
        <>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
        </>
      )}
    </Routes>
  );
};

/**
 * CallModalHandler — root-level call UI coordinator.
 * Lives outside the router so it's always mounted for any authenticated user.
 *
 * Responsibilities:
 *  - Listen for 'incoming_call' socket event → show IncomingCallModal
 *  - Accept → init WebRTC stream, tell server, show CallOverlay
 *  - Decline → tell server, reset state
 *  - Listen for call-status events (accepted / declined / ended / …) → keep UI in sync
 *
 * All call-event listeners live HERE only.
 * ConversationPage must NOT listen to incoming_call or any call-status events —
 * it only emits the call_initiate event on behalf of the caller.
 */
const CallModalHandler = () => {
  const { user } = useAuthContext();
  const { acceptCall, declineCall } = useChatContext();
  // Subscribe individually — prevents re-render when unrelated slices change
  const incomingCall = useCallStore((s) => s.incomingCall);
  const callState = useCallStore((s) => s.callState);
  const { callDeclined, resetCall, setIncomingCall: setIncomingCallStore, setCallId } = useCallStore.getState();

  // Stable ref to avoid stale-closure issues inside socket callbacks
  const incomingCallRef = useRef(null);
  incomingCallRef.current = incomingCall;
  // Ref-based guard — synchronous, works even before re-render
  const isAcceptingRef = useRef(false);
  // ── Accept handler ──────────────────────────────────────────────────────
  const handleAccept = async () => {
    // Synchronous guard check using ref
    if (isAcceptingRef.current) {
      console.log('[DEBUG-A] handleAccept guard - isAcceptingRef=true, skipping');
      return;
    }
    const call = incomingCallRef.current;
    console.log('[DEBUG-A] handleAccept entry', {callId:call?.callId,callType:call?.type,socketConnected:socketService.socket?.connected,socketId:socketService.socket?.id,isAccepting:isAcceptingRef.current});
    if (!call?.callId) {
      console.log('[DEBUG-A] handleAccept guard - no callId, skipping');
      return;
    }
    if (callState === 'connected') {
      console.log('[DEBUG-A] handleAccept guard - already connected, skipping');
      return;
    }

    isAcceptingRef.current = true;

    try {
      const isVideoCall = call.type === "video";
      await webrtcService.initLocalStream(call.type, isVideoCall);

      const localStream = webrtcService.getLocalStream();
      if (!localStream) {
        throw new Error("Không thể khởi tạo luồng âm thanh/hình ảnh cho cuộc gọi.");
      }

      socketService.joinCallRoom(call.callId);
      setCallId(call.callId);
      acceptCall(call.callId);
      setIncomingCallStore(null);
    } catch (error) {
      console.error("Failed to accept call:", error);
      webrtcService.cleanup();
      callDeclined();
      resetCall();
    } finally {
      isAcceptingRef.current = false;
    }
  };

  // ── Callee WebRTC signaling ───────────────────────────────────────────
  // Waits for offer from caller, creates non-initiator peer (generates answer),
  // then the peer.on('signal') auto-emits answer via emitCallSignal.
  useEffect(() => {
    console.log(`[FE-CALLEE] ★ CALLEE_SIGNALING useEffect MOUNTED | socketId=${socketService.socket?.id} | socketConnected=${socketService.socket?.connected}`);

    const handleOfferReceived = async (data) => {
      // Ignore our own offer (callee's offer was echoed back to us)
      const ourUserId = useAuthStore.getState().user?.id;
      if (data.from === ourUserId) {
        console.log(`[FE-CALLEE] ✗ IGNORED: own offer echoed back from=${data.from} | ourUserId=${ourUserId}`);
        return;
      }

      console.log(`[FE-CALLEE] ★ handleOfferReceived | data=`, data);
      const store = useCallStore.getState();
      console.log(`[FE-CALLEE]   callState=${store.callState} | currentCallId=${store.currentCallId} | peer=${!!webrtcService.peer}`);
      if (!['ringing', 'calling'].includes(store.callState)) {
        console.log(`[FE-CALLEE] ✗ IGNORED: callState not ringing/calling`);
        return;
      }

      const localStream = webrtcService.getLocalStream();
      if (!localStream) {
        console.log(`[FE-CALLEE] ✗ IGNORED: no localStream`);
        return;
      }

      const callId = data.callId || store.currentCallId;
      if (!callId) {
        console.log(`[FE-CALLEE] ✗ IGNORED: no callId`);
        return;
      }

      try {
        if (!webrtcService.peer) {
          console.log(`[FE-CALLEE] → Creating peer as callee (non-initiator)...`);
          await webrtcService.createPeerAsCallee(localStream, callId);
          console.log(`[FE-CALLEE] → peer created, checking peer.signal event setup...`);
        }
        if (webrtcService.peer && data.offer) {
          console.log(`[FE-CALLEE] → Signaling offer to peer...`);
          webrtcService.peer.signal(data.offer);
          console.log(`[FE-CALLEE] → peer.signal(offer) called successfully`);
        } else {
          console.log(`[FE-CALLEE] ✗ No peer or no offer to signal | peer=${!!webrtcService.peer} | hasOffer=${!!data.offer}`);
        }
      } catch (error) {
        console.error(`[FE-CALLEE] ✗ handleOfferReceived EXCEPTION:`, error.message || error);
      }
    };

    const handleIceCandidateReceived = (data) => {
      console.log(`[FE-CALLEE] handleIceCandidateReceived | peer=${!!webrtcService.peer}`, data);
      if (webrtcService.peer) {
        webrtcService.handleSignal(data.candidate);
      } else {
        console.log(`[FE-CALLEE] ✗ IGNORED: no peer to handle ICE`);
      }
    };

    socketService.onCallOfferReceived(handleOfferReceived);
    socketService.onCallIceCandidateReceived(handleIceCandidateReceived);

    return () => {
      socketService.offCallOfferReceived(handleOfferReceived);
      socketService.offCallIceCandidateReceived(handleIceCandidateReceived);
    };
  }, []);

  // ── Callee: listen for call_accepted to create peer (handles race where BE sends call_accepted before offer arrives) ──
  useEffect(() => {
    const handleCallAcceptedForCallee = async (data) => {
      console.log(`[FE-CALLEE] ★ handleCallAcceptedForCallee FIRED | data=`, data);
      const store = useCallStore.getState();
      console.log(`[FE-CALLEE]   callState=${store.callState} | currentCallId=${store.currentCallId} | peer=${!!webrtcService.peer}`);

      const localStream = webrtcService.getLocalStream();
      if (!localStream) {
        console.log(`[FE-CALLEE]   ✗ no localStream, skipping`);
        return;
      }

      const callId = data.callId || store.currentCallId;
      if (!callId) {
        console.log(`[FE-CALLEE]   ✗ no callId, skipping`);
        return;
      }

      try {
        if (!webrtcService.peer) {
          console.log(`[FE-CALLEE] → Creating peer as callee (non-initiator) after call_accepted...`);
          await webrtcService.createPeerAsCallee(localStream, callId);
        }
        console.log(`[FE-CALLEE] → Callee peer setup complete`);
      } catch (error) {
        console.error(`[FE-CALLEE] ✗ handleCallAcceptedForCallee EXCEPTION:`, error.message || error);
      }
    };

    socketService.onCallAccepted(handleCallAcceptedForCallee);
    return () => {
      socketService.offCallAccepted(handleCallAcceptedForCallee);
    };
  }, []);

  // ── Decline handler ─────────────────────────────────────────────────────
  const handleDecline = () => {
    const call = incomingCallRef.current;
    if (!call?.callId) {
      console.log(
        "📞 [DECLINE] FAIL: no callId, incomingCallRef:",
        incomingCallRef.current,
      );
      return;
    }
    console.log(
      "📞 [DECLINE] socketId:",
      socketService.socket?.id,
      "| emitting call_decline for callId:",
      call.callId,
    );
    webrtcService.cleanup();
    declineCall(call.callId);
    setIncomingCallStore(null);
    resetCall();
  };

  // ── Call-status listeners ───────────────────────────────────────────────
  useEffect(() => {
    const handleCallEnded = () => {
      console.log('[FE-REMOTE] handleCallEnded fired | resetting call');
      webrtcService.cleanup();
      resetCall();
    };
    const handleCallDeclined = () => {
      console.log('[FE-REMOTE] handleCallDeclined fired | resetting call');
      webrtcService.cleanup();
      resetCall();
    };
    const handleCallMissed = () => {
      console.log('[FE-REMOTE] handleCallMissed fired | resetting call');
      webrtcService.cleanup();
      resetCall();
    };
    const handleCallNoAnswer = () => {
      webrtcService.cleanup();
      resetCall();
    };
    const handleCallCancelled = () => {
      webrtcService.cleanup();
      resetCall();
    };
    const handleCallRejected = () => {
      webrtcService.cleanup();
      resetCall();
    };

    const handleAnswerReceived = (data) => {
      webrtcService.handleSignal(data.answer);
    };
    const handleIceCandidateReceived = (data) => {
      webrtcService.handleSignal(data.candidate);
    };

    socketService.onCallEnded(handleCallEnded);
    socketService.onCallDeclined(handleCallDeclined);
    socketService.onCallMissed(handleCallMissed);
    socketService.onCallNoAnswer(handleCallNoAnswer);
    socketService.onCallCancelled(handleCallCancelled);
    socketService.onCallRejected(handleCallRejected);
    socketService.onCallAnswerReceived(handleAnswerReceived);
    socketService.onCallIceCandidateReceived(handleIceCandidateReceived);

    return () => {
      socketService.offCallEnded();
      socketService.offCallDeclined();
      socketService.offCallMissed();
      socketService.offCallNoAnswer();
      socketService.offCallCancelled();
      socketService.offCallRejected();
      socketService.offCallAnswerReceived(handleAnswerReceived);
      socketService.offCallIceCandidateReceived(handleIceCandidateReceived);
    };
  }, [resetCall, callDeclined, setIncomingCallStore]);

  // Auto-dismiss IncomingCallModal when call leaves RINGING state
  // (e.g., accepted by remote, ended, declined — from any source)
  useEffect(() => {
    if (callState !== 'ringing' && incomingCall) {
      setIncomingCallStore(null);
    }
  }, [callState, incomingCall, setIncomingCallStore]);

  // ── Render ─────────────────────────────────────────────────────────────
  const showOverlay = callState !== 'idle' && callState !== 'ended' && callState !== 'rejected';
  const showIncomingModal = !!incomingCall;

  return (
    <>
      {showIncomingModal && (
        <IncomingCallModal
          isOpen={true}
          caller={incomingCall.caller}
          callType={incomingCall.type}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}
      {showOverlay && <CallOverlay onClose={() => resetCall()} />}
    </>
  );
};

export const AppRoutesWrapper = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <ToastProvider>
              <AppRoutes />
              <CallModalHandler />
            </ToastProvider>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
