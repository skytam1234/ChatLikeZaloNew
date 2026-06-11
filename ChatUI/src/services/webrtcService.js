import { useCallStore } from "@/stores/callStore.js";
import socketService from "./socketService.js";

let Peer = null;

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  {
    urls: "turn:103.167.89.48:3478",
    username: "dongduongco",
    credential: "duong123456",
  },
];

const DEFAULT_ICE_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
};

class WebRTCService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.isInitiator = false;
    this.networkQualityInterval = null;
    this.pendingSignals = [];
    this.peerReady = false;
    this.isCreatingPeer = false;  // guard against duplicate peer creation
    this.isCalleeReady = false;   // true when callee has created peer (for offer guard)
    this.peerEventHandlers = {};  // track peer event handlers for cleanup
    this.signalTimeout = null;    // ICE gathering timeout handle
  }

  async _getPeerConstructor() {
    if (!Peer) {
      const module = await import("simple-peer");
      Peer = module.default || module.Peer;
    }

    if (typeof Peer !== "function") {
      throw new Error(
        "Không thể khởi tạo WebRTC peer do thiếu thư viện simple-peer.",
      );
    }

    return Peer;
  }

  async initLocalStream(type, videoEnabled = true) {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === "video" || videoEnabled ? true : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      setTimeout(() => {
        console.log("stream", this.localStream);
      }, 0);
      useCallStore.getState().setLocalStream(this.localStream);
      return this.localStream;
    } catch (error) {
      console.error("Error getting local stream:", error);
      const guidance = this._getPermissionGuidance(error);
      throw new Error(guidance);
    }
  }

  async createPeerAsInitiator(localStream, callId) {
    if (this.isCreatingPeer) {
      console.log(`[WEBRTC] createPeerAsInitiator SKIPPED — already creating peer`);
      return;
    }
    this.isCreatingPeer = true;
    console.log(`[WEBRTC] ★ createPeerAsInitiator called | callId=${callId} | hasStream=${!!localStream}`);
    try {
      this.isInitiator = true;
      this.cleanupPeerOnly();
      this.pendingSignals = [];
      this.peerReady = false;

      const PeerCtor = await this._getPeerConstructor();
      console.log(`[WEBRTC] ★ PeerCtor resolved, creating peer...`);

      this.peer = new PeerCtor({
        initiator: true,
        trickle: true,
        stream: localStream,
        config: DEFAULT_ICE_CONFIG,
      });
      console.log(`[WEBRTC] ★ Peer instance created (initiator=true) | peerId=${this.peer?._id}`);

      this._setupPeerEvents(callId);
      this._startNetworkQualityMonitoring();
      this._flushPendingSignals();
    } finally {
      this.isCreatingPeer = false;
    }
  }

  async createPeerAsCallee(localStream, callId) {
    if (this.isCreatingPeer) {
      console.log(`[WEBRTC] createPeerAsCallee SKIPPED — already creating peer`);
      return;
    }
    this.isCreatingPeer = true;
    console.log(`[WEBRTC] ★ createPeerAsCallee called | callId=${callId} | hasStream=${!!localStream}`);
    try {
      this.isInitiator = false;
      this.cleanupPeerOnly();
      this.pendingSignals = [];
      this.peerReady = false;
      this.isCalleeReady = true;

      const PeerCtor = await this._getPeerConstructor();
      console.log(`[WEBRTC] ★ PeerCtor resolved, creating peer...`);

      this.peer = new PeerCtor({
        initiator: false,
        trickle: true,
        stream: localStream,
        config: DEFAULT_ICE_CONFIG,
      });
      console.log(`[WEBRTC] ★ Peer instance created (initiator=false) | peerId=${this.peer?._id}`);

      this._setupPeerEvents(callId);
      this._startNetworkQualityMonitoring();
      this._flushPendingSignals();
    } finally {
      this.isCreatingPeer = false;
    }
  }

  /**
   * Setup các sự kiện chuẩn của simple-peer
   */
  _setupPeerEvents(callId) {
    if (!this.peer) {
      console.log(`[WEBRTC] ✗ _setupPeerEvents: peer is null!`);
      return;
    }
    console.log(`[WEBRTC] ◆ Setting up peer events for callId=${callId} | isInitiator=${this.isInitiator}`);

    // Clear old timeout if any
    if (this.signalTimeout) {
      clearTimeout(this.signalTimeout);
      this.signalTimeout = null;
    }

    // Remove any existing handlers to prevent duplicate registration
    const existingHandlers = this.peerEventHandlers[callId];
    if (existingHandlers) {
      this.peer.off("signal", existingHandlers.signal);
      this.peer.off("connect", existingHandlers.connect);
      this.peer.off("stream", existingHandlers.stream);
      this.peer.off("close", existingHandlers.close);
      this.peer.off("error", existingHandlers.error);
    }

    const signalHandler = (signalingData) => {
      clearTimeout(this.signalTimeout);
      const type = signalingData?.type || (signalingData?.candidate ? "ICE" : "unknown");
      console.log(`[WEBRTC] ◆ peer.on("signal") | type=${type} | callId=${callId}`, signalingData);
      socketService.emitCallSignal(callId, signalingData);
    };

    const connectHandler = () => {
      console.log(`[WEBRTC] ✓ peer.on("connect") — DATA CHANNEL OPENED | callId=${callId}`);
      this.peerReady = true;
      this._flushPendingSignals();
      const { callState } = useCallStore.getState();
      console.log(`[WEBRTC]   current callState=${callState}`);
      if (callState !== "connected") {
        console.log(`[WEBRTC] ✓ Calling callAccepted() from "connect" handler`);
        useCallStore.getState().callAccepted();
      } else {
        console.log(`[WEBRTC]   callState already "connected", skipping`);
      }
    };

    const streamHandler = (remoteStream) => {
      console.log(`[WEBRTC] ✓ peer.on("stream") — REMOTE STREAM RECEIVED | callId=${callId} | tracks=${remoteStream?.getTracks()?.length}`);
      useCallStore.getState().setRemoteStream(remoteStream);
      useCallStore.getState().callAccepted();
    };

    const closeHandler = () => {
      clearTimeout(this.signalTimeout);
      console.log(`[WEBRTC] ✗ peer.on("close") | callId=${callId}`);
      this.cleanup();
    };

    const errorHandler = (error) => {
      clearTimeout(this.signalTimeout);
      console.error(`[WEBRTC] ✗ peer.on("error") | callId=${callId} | error=`, error.message || error);
      this.cleanup();
      useCallStore.getState().setError(error.message || "Lỗi kết nối cuộc gọi");
    };

    // ICE gathering timeout — if no answer is generated within 10s, log warning
    this.signalTimeout = setTimeout(() => {
      if (this.peer && !this.peer.destroyed) {
        console.warn(`[WEBRTC] ◆ peer.on("signal") NOT fired within 10s | callId=${callId} | isInitiator=${this.isInitiator}`);
      }
    }, 10000);

    this.peer.on("signal", signalHandler);
    this.peer.on("connect", connectHandler);
    this.peer.on("stream", streamHandler);
    this.peer.on("close", closeHandler);
    this.peer.on("error", errorHandler);

    this.peerEventHandlers[callId] = {
      signal: signalHandler,
      connect: connectHandler,
      stream: streamHandler,
      close: closeHandler,
      error: errorHandler,
    };

    console.log(`[WEBRTC] ◆ All peer event listeners registered`);
  }

  _startNetworkQualityMonitoring() {
    this._stopNetworkQualityMonitoring();

    this.networkQualityInterval = setInterval(async () => {
      if (!this.peer || !this.peer._pc || this.peer.destroyed) {
        this._stopNetworkQualityMonitoring();
        return;
      }

      try {
        const stats = await this.peer._pc.getStats();
        let rtt = 0;
        let packetsLost = 0;
        let packetsReceived = 0;

        stats.forEach((report) => {
          if (
            report.type === "candidate-pair" &&
            report.state === "succeeded"
          ) {
            rtt = report.currentRoundTripTime
              ? report.currentRoundTripTime * 1000
              : 0;
          }
          if (report.type === "inbound-rtp" && report.kind === "audio") {
            packetsLost = report.packetsLost || 0;
            packetsReceived = report.packetsReceived || 0;
          }
        });

        if (rtt > 0) {
          const quality = rtt < 150 ? "good" : rtt < 300 ? "medium" : "poor";
          console.log(
            `WebRTC: Network Quality [${quality}] | RTT: ${rtt.toFixed(0)}ms`,
          );
        }
      } catch (err) {
        this._stopNetworkQualityMonitoring();
      }
    }, 5000);
  }

  _stopNetworkQualityMonitoring() {
    if (this.networkQualityInterval) {
      clearInterval(this.networkQualityInterval);
      this.networkQualityInterval = null;
    }
  }

  handleSignal(data) {
    if (!data) {
      console.log(`[WEBRTC] handleSignal: data is falsy, ignoring`);
      return;
    }
    if (!this.peer || this.peer.destroyed) {
      console.log(`[WEBRTC] handleSignal: peer null/destroyed, queueing signal | type=${data?.type || 'ICE'} | pendingLen=${this.pendingSignals.length}`);
      this.pendingSignals.push(data);
      return;
    }

    const signalType = data?.type || (data?.candidate ? "ICE" : "unknown");
    console.log(`[WEBRTC] handleSignal: applying | type=${signalType} | peerDestroyed=${this.peer.destroyed}`);
    try {
      this.peer.signal(data);
      console.log(`[WEBRTC] handleSignal: ✓ peer.signal() succeeded`);
    } catch (error) {
      console.error(`[WEBRTC] handleSignal: ✗ peer.signal() failed | error=`, error.message || error);
      const message = String(error?.message || "").toLowerCase();
      if (
        message.includes("not ready") ||
        message.includes("set remote description") ||
        message.includes("signal")
      ) {
        console.log(`[WEBRTC] handleSignal: queueing for retry`);
        this.pendingSignals.push(data);
        return;
      }
      throw error;
    }
  }

  _flushPendingSignals() {
    if (!this.peer || this.peer.destroyed || this.pendingSignals.length === 0) {
      return;
    }

    const queuedSignals = [...this.pendingSignals];
    this.pendingSignals = [];

    for (const signal of queuedSignals) {
      if (!this.peer || this.peer.destroyed) {
        this.pendingSignals.push(signal);
        break;
      }

      try {
        this.peer.signal(signal);
      } catch (error) {
        console.error("WebRTC: Failed to flush pending signal:", error);
        this.pendingSignals.push(signal);
      }
    }
  }

  getLocalStream() {
    return this.localStream;
  }

  toggleMute() {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      useCallStore.getState().toggleMute();
    }
  }

  toggleVideo() {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      useCallStore.getState().toggleVideo();
    }
  }

  cleanupPeerOnly() {
    this._stopNetworkQualityMonitoring();
    this.pendingSignals = [];
    this.peerReady = false;
    if (this.signalTimeout) {
      clearTimeout(this.signalTimeout);
      this.signalTimeout = null;
    }
    if (this.peer) {
      const callId = this.peer._id;
      const handlers = this.peerEventHandlers[callId];
      if (handlers) {
        this.peer.off("signal", handlers.signal);
        this.peer.off("connect", handlers.connect);
        this.peer.off("stream", handlers.stream);
        this.peer.off("close", handlers.close);
        this.peer.off("error", handlers.error);
        delete this.peerEventHandlers[callId];
      }
      this.peer.destroy();
      this.peer = null;
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
      useCallStore.getState().setLocalStream(null);
    }
  }

  cleanup() {
    this.cleanupPeerOnly();
    this.stopLocalStream();
    this.isInitiator = false;
  }

  _getPermissionGuidance(error) {
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      return "Quyền truy cập microphone/camera bị từ chối...";
    }
    return "Không thể truy cập camera/microphone.";
  }
}

export const webrtcService = new WebRTCService();
export default webrtcService;
