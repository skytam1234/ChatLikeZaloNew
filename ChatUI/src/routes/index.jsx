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
import { useCallStore } from "@/stores/index.js";
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
  const { callAccepted, callDeclined, resetCall, setIncomingCall: setIncomingCallStore, setCallId } = useCallStore.getState();

  const [isAccepting, setIsAccepting] = useState(false);

  // Stable ref to avoid stale-closure issues inside socket callbacks
  const incomingCallRef = useRef(null);
  incomingCallRef.current = incomingCall;
  // ── Accept handler ──────────────────────────────────────────────────────
  const handleAccept = async () => {
    const call = incomingCallRef.current;
    console.log(call);
    console.log('[DEBUG-A] handleAccept entry', {callId:call?.callId,callType:call?.type,socketConnected:socketService.socket?.connected,socketId:socketService.socket?.id,isAccepting});
    if (!call?.callId || isAccepting) {
      console.log('[DEBUG-A] handleAccept guard - early return', {reason:!call?.callId?'noCallId':'isAccepting',callId:call?.callId,isAccepting});
      return;
    }
    // Extra guard: don't re-accept if already connected
    if (callState === 'connected') {
      console.log('[DEBUG-A] handleAccept guard - already connected, skipping');
      return;
    }

    setIsAccepting(true);

    try {
      const isVideoCall = call.type === "video";

      await webrtcService.initLocalStream(call.type, isVideoCall);

      const localStream = webrtcService.getLocalStream();
      if (!localStream) {
        throw new Error(
          "Không thể khởi tạo luồng âm thanh/hình ảnh cho cuộc gọi.",
        );
      }

      await webrtcService.createPeerAsCallee(localStream, call.callId);
      console.log('[DEBUG-A] about to emit call_accept', {callId:call.callId,socketConnected:socketService.socket?.connected,socketId:socketService.socket?.id});

      // Update store — this callee is now connected
      setCallId(call.callId);
      callAccepted();

      acceptCall(call.callId);
      setIncomingCallStore(null);
    } catch (error) {
      console.error("Failed to accept call:", error);
      console.log('[DEBUG-A] handleAccept caught error', {error:error.message,callId:call?.callId});
      webrtcService.cleanup();
      callDeclined();
      resetCall();
    } finally {
      setIsAccepting(false);
    }
  };

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
      webrtcService.cleanup();
      resetCall();
    };
    const handleCallDeclined = () => {
      webrtcService.cleanup();
      resetCall();
    };
    const handleCallMissed = () => {
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

    const handleOfferReceived = (data) => {
      if (webrtcService.peer && data.offer) {
        webrtcService.peer.signal(data.offer);
      }
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
    socketService.onCallOfferReceived(handleOfferReceived);
    socketService.onCallAnswerReceived(handleAnswerReceived);
    socketService.onCallIceCandidateReceived(handleIceCandidateReceived);

    return () => {
      socketService.offCallEnded();
      socketService.offCallDeclined();
      socketService.offCallMissed();
      socketService.offCallNoAnswer();
      socketService.offCallCancelled();
      socketService.offCallRejected();
      socketService.offCallOfferReceived(handleOfferReceived);
      socketService.offCallAnswerReceived(handleAnswerReceived);
      socketService.offCallIceCandidateReceived(handleIceCandidateReceived);
    };
  }, [resetCall, callDeclined, setIncomingCallStore]);

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
