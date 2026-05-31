import { useCallStore } from "@/stores/callStore.js";
import socketService from "./socketService.js";

let Peer = null;

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
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
    this.isInitiator = true;
    this.cleanupPeerOnly();
    this.pendingSignals = [];
    this.peerReady = false;

    const PeerCtor = await this._getPeerConstructor();

    this.peer = new PeerCtor({
      initiator: true,
      trickle: true,
      stream: localStream,
      config: DEFAULT_ICE_CONFIG,
    });

    this._setupPeerEvents(callId);
    this._startNetworkQualityMonitoring();
    this._flushPendingSignals();
  }

  async createPeerAsCallee(localStream, callId) {
    this.isInitiator = false;
    this.cleanupPeerOnly();
    this.pendingSignals = [];
    this.peerReady = false;

    const PeerCtor = await this._getPeerConstructor();

    this.peer = new PeerCtor({
      initiator: false,
      trickle: true,
      stream: localStream,
      config: DEFAULT_ICE_CONFIG,
    });

    this._setupPeerEvents(callId);
    this._startNetworkQualityMonitoring();
    this._flushPendingSignals();
  }

  /**
   * Setup các sự kiện chuẩn của simple-peer
   */
  _setupPeerEvents(callId) {
    if (!this.peer) return;

    this.peer.on("signal", (signalingData) => {
      console.log("WebRTC: Generated local signal data");
      socketService.emitCallSignal(callId, signalingData);
    });

    this.peer.on("connect", () => {
      console.log("WebRTC: Peer connected thành công!");
      this.peerReady = true;
      this._flushPendingSignals();
      useCallStore.getState().callAccepted();
    });

    this.peer.on("stream", (remoteStream) => {
      console.log("WebRTC: Received remote stream");
      useCallStore.getState().setRemoteStream(remoteStream);
    });

    this.peer.on("close", () => {
      console.log("WebRTC: Peer connection closed");
      this.cleanup();
    });

    this.peer.on("error", (error) => {
      console.error("WebRTC: Peer error:", error);
      this.cleanup();
      useCallStore.getState().setError(error.message || "Lỗi kết nối cuộc gọi");
    });
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
    if (!data) return;
    if (!this.peer || this.peer.destroyed) {
      this.pendingSignals.push(data);
      return;
    }

    try {
      this.peer.signal(data);
    } catch (error) {
      const message = String(error?.message || "").toLowerCase();
      if (
        message.includes("not ready") ||
        message.includes("set remote description") ||
        message.includes("signal")
      ) {
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
    if (this.peer) {
      this.peer.off("signal");
      this.peer.off("connect");
      this.peer.off("stream");
      this.peer.off("close");
      this.peer.off("error");

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
