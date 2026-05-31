import { io } from "socket.io-client";
import { SOCKET_URL } from "@/utils/constants.js";
import { storage } from "@/utils/storage.js";

class SocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this._listenersSetup = false; // prevent duplicate listener registration
    /** @type {Promise|null} */
    this._connectPromise = null;
    /** Pending listeners registered before socket connected */
    this._pendingListeners = new Map();
    /** Track wrapped callbacks per event so off() without arg only removes internally-registered ones */
    this._internalCallbacks = new Map();
  }

  /**
   * Connect to socket server.
   * Returns the socket immediately (connection is async — use the 'connect' event
   * or pending listeners for callbacks).
   */
  connect() {
    const token = storage.get("ACCESS_TOKEN");
    if (!token) return null;
    if (!this.socket) {
      this._listenersSetup = false;
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
      });
      this.setupEventListeners();
    }
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket || this._listenersSetup) return;
    this._listenersSetup = true;

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
      if (this._pendingListeners.size > 0) this._flushPendingListeners();
    });

    if (this.socket.connected && this._pendingListeners.size > 0) {
      this._flushPendingListeners();
    }

    this.socket.on("disconnect", (reason) => {
      this._connectPromise = null;
      this._pendingListeners.clear();
      this._listenersSetup = false;
      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect"
      )
        return;
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("❌ Max socket reconnection attempts reached");
      }
    });

    this.socket.on("error", (data) => {
      console.error("Socket error:", data);
    });
  }

  /**
   * Flush all pending listeners into the real socket (called on connect).
   */
  _flushPendingListeners() {
    if (!this.socket) return;
    for (const [event, callbacks] of this._pendingListeners.entries()) {
      for (const callback of callbacks) {
        this.socket.on(event, callback);
      }
    }
    this._pendingListeners.clear();
  }

  /**
   * Register a handler that fires NOW if socket is already connected,
   * or QUEUED and fired on the next connect.
   */
  _registerNowOrPending(event, callback) {
    if (this.socket?.connected) {
      this.socket.on(event, callback);
    } else {
      if (!this._pendingListeners.has(event)) {
        this._pendingListeners.set(event, []);
      }
      this._pendingListeners.get(event).push(callback);
      if (this.socket?.connected) this._flushPendingListeners();
    }
  }

  setupBaseListeners() {
    if (!this.socket) return;

    // Reset promise on disconnect so next connect() starts fresh
    this.socket.on("disconnect", (reason) => {
      this._connectPromise = null;
      this._pendingListeners.clear();
      this._listenersSetup = false;
      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect"
      )
        return;
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("error", (data) => {
      console.error("Socket error:", data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._connectPromise = null;
    this._pendingListeners.clear();
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected ?? false;
  }

  joinConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit("join_conversation", { conversationId });
    }
  }

  leaveConversation(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit("leave_conversation", { conversationId });
    }
  }

  sendMessage(data) {
    if (this.socket?.connected) {
      this.socket.emit("send_message", data);
    }
  }

  startTyping(conversationId, username) {
    if (this.socket?.connected) {
      this.socket.emit("typing_start", { conversationId, username });
    }
  }

  stopTyping(conversationId) {
    if (this.socket?.connected) {
      this.socket.emit("typing_stop", { conversationId });
    }
  }

  markSeen(conversationId, messageId) {
    if (this.socket?.connected) {
      this.socket.emit("mark_seen", { conversationId, messageId });
    }
  }

  markDelivered(conversationId, messageId) {
    if (this.socket?.connected) {
      this.socket.emit("mark_delivered", { conversationId, messageId });
    }
  }

  onNewMessage(callback) {
    this.socket?.on("new_message", callback);
  }

  offNewMessage(callback) {
    if (callback) {
      this.socket?.off("new_message", callback);
    } else {
      this.socket?.off("new_message");
    }
  }

  onMessageDelivered(callback) {
    this.socket?.on("message_delivered", callback);
  }

  offMessageDelivered(callback) {
    if (callback) {
      this.socket?.off("message_delivered", callback);
    } else {
      this.socket?.off("message_delivered");
    }
  }

  onMessageSeen(callback) {
    this.socket?.on("message_seen", callback);
  }

  offMessageSeen(callback) {
    if (callback) {
      this.socket?.off("message_seen", callback);
    } else {
      this.socket?.off("message_seen");
    }
  }

  onUserTyping(callback) {
    this.socket?.on("user_typing", callback);
  }

  offUserTyping(callback) {
    if (callback) {
      this.socket?.off("user_typing", callback);
    } else {
      this.socket?.off("user_typing");
    }
  }

  onUserStopTyping(callback) {
    this.socket?.on("user_stop_typing", callback);
  }

  offUserStopTyping(callback) {
    if (callback) {
      this.socket?.off("user_stop_typing", callback);
    } else {
      this.socket?.off("user_stop_typing");
    }
  }

  onUserOnline(callback) {
    this.socket?.on("user_online", callback);
  }

  offUserOnline(callback) {
    if (callback) {
      this.socket?.off("user_online", callback);
    } else {
      this.socket?.off("user_online");
    }
  }

  onUserConnected(callback) {
    this.socket?.on("user_connected", callback);
  }

  offUserConnected(callback) {
    if (callback) {
      this.socket?.off("user_connected", callback);
    } else {
      this.socket?.off("user_connected");
    }
  }

  onUserOffline(callback) {
    this.socket?.on("user_offline", callback);
  }

  offUserOffline(callback) {
    if (callback) {
      this.socket?.off("user_offline", callback);
    } else {
      this.socket?.off("user_offline");
    }
  }

  onMessageRecalled(callback) {
    this.socket?.on("message_recalled", callback);
  }

  offMessageRecalled(callback) {
    if (callback) {
      this.socket?.off("message_recalled", callback);
    } else {
      this.socket?.off("message_recalled");
    }
  }

  onConversationUpdated(callback) {
    this.socket?.on("conversation_updated", callback);
  }

  offConversationUpdated(callback) {
    if (callback) {
      this.socket?.off("conversation_updated", callback);
    } else {
      this.socket?.off("conversation_updated");
    }
  }

  onMessageStatus(callback) {
    this.socket?.on("message_status", callback);
  }

  offMessageStatus(callback) {
    if (callback) {
      this.socket?.off("message_status", callback);
    } else {
      this.socket?.off("message_status");
    }
  }

  onMessageSent(callback) {
    this.socket?.on("message_sent", callback);
  }

  offMessageSent(callback) {
    if (callback) {
      this.socket?.off("message_sent", callback);
    } else {
      this.socket?.off("message_sent");
    }
  }

  onJoinedConversation(callback) {
    this.socket?.on("joined_conversation", callback);
  }

  offJoinedConversation(callback) {
    if (callback) {
      this.socket?.off("joined_conversation", callback);
    } else {
      this.socket?.off("joined_conversation");
    }
  }

  onLeftConversation(callback) {
    this.socket?.on("left_conversation", callback);
  }

  offLeftConversation(callback) {
    if (callback) {
      this.socket?.off("left_conversation", callback);
    } else {
      this.socket?.off("left_conversation");
    }
  }

  onMessageUpdated(callback) {
    this.socket?.on("message_updated", callback);
  }

  offMessageUpdated(callback) {
    if (callback) {
      this.socket?.off("message_updated", callback);
    } else {
      this.socket?.off("message_updated");
    }
  }

  onConversationCreated(callback) {
    this.socket?.on("conversation_created", callback);
  }

  offConversationCreated(callback) {
    if (callback) {
      this.socket?.off("conversation_created", callback);
    } else {
      this.socket?.off("conversation_created");
    }
  }

  // ==================== CALL METHODS ====================

  /**
   * Initiate a call
   * @param {Object} data
   */
  initiateCall(data) {
    if (this.socket?.connected) {
      this.socket.emit("call_initiate", data);
    }
  }

  /**
   * Join a call room to receive WebRTC signaling messages.
   * @param {string} callId
   */
  joinCallRoom(callId) {
    if (this.socket?.connected) {
      this.socket.emit("join_call_room", { callId });
    }
  }

  /**
   * Accept a call
   * @param {string} callId
   */
  acceptCall(callId) {
    console.log('[DEBUG-A] socketService.acceptCall', {callId,socketConnected:this.socket?.connected,socketId:this.socket?.id});
    if (this.socket?.connected) {
      this.socket.emit("call_accept", { callId });
    }
  }

  /**
   * Decline a call
   * @param {string} callId
   */
  declineCall(callId) {
    if (this.socket?.connected) {
      this.socket.emit("call_decline", { callId });
    }
  }

  /**
   * End a call
   * @param {string} callId
   */
  endCall(callId) {
    if (this.socket?.connected) {
      this.socket.emit("call_end", { callId });
    }
  }

  /**
   * Mark call as missed
   * @param {string} callId
   */
  missCall(callId) {
    if (this.socket?.connected) {
      this.socket.emit("call_missed", { callId });
    }
  }

  /**
   * Emit WebRTC signal (handles offer / answer / ICE candidate automatically).
   * Called when simple-peer emits 'signal' event.
   * @param {string} callId
   * @param {Object} signalingData - { type, sdp } or { candidate, sdpMid, sdpMLineIndex }
   */
  emitCallSignal(callId, signalingData) {
    if (!this.socket?.connected) return
    if (!signalingData) return

    // ICE candidate
    if ('candidate' in signalingData) {
      this.socket.emit('call_ice_candidate', { callId, candidate: signalingData })
      return
    }

    // Offer
    if (signalingData.type === 'offer') {
      this.socket.emit('call_offer', { callId, offer: signalingData })
      return
    }

    // Answer
    if (signalingData.type === 'answer') {
      this.socket.emit('call_answer', { callId, answer: signalingData })
      return
    }
  }

  /**
   * Emit call offer (WebRTC)
   * @param {string} callId
   * @param {Object} offer
   */
  emitCallOffer(callId, offer) {
    if (this.socket?.connected) {
      this.socket.emit("call_offer", { callId, offer });
    }
  }

  /**
   * Emit call answer (WebRTC)
   * @param {string} callId
   * @param {Object} answer
   */
  emitCallAnswer(callId, answer) {
    if (this.socket?.connected) {
      this.socket.emit("call_answer", { callId, answer });
    }
  }

  /**
   * Emit ICE candidate (WebRTC)
   * @param {string} callId
   * @param {Object} candidate
   */
  emitCallIceCandidate(callId, candidate) {
    if (this.socket?.connected) {
      this.socket.emit("call_ice_candidate", { callId, candidate });
    }
  }

  // ==================== CALL EVENT LISTENERS ====================

  /**
   * Listen for incoming call
   * Returns the registered listener so it can be unregistered later.
   */
  onIncomingCall(callback) {
    const listener = (data) => {
      console.log("📞 [SOCKET] 🔔 incoming_call received:", data, "| socketId:", this.socket?.id);
      callback(data);
    }
    // Check if already registered (prevent duplicate on re-mount)
    if (this.socket?.connected && this._pendingListeners.get("incoming_call")?.includes(listener)) {
      console.log("📞 [REGISTER] incoming_call listener already pending, skipping");
      return listener;
    }
    this._registerNowOrPending("incoming_call", listener)
    return listener
  }

  offIncomingCall(listener) {
    if (listener) {
      this.socket?.off("incoming_call", listener);
    } else {
      this.socket?.off("incoming_call");
    }
    // Also remove from pending
    const pending = this._pendingListeners.get("incoming_call");
    if (pending) {
      if (listener) {
        const idx = pending.indexOf(listener);
        if (idx !== -1) pending.splice(idx, 1);
      } else {
        pending.length = 0;
      }
      if (pending.length === 0) this._pendingListeners.delete("incoming_call");
    }
  }

  /**
   * Listen for call ringing
   */
  onCallRinging(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_ringing received:', data);
      callback(data);
    };
    this.socket?.on("call_ringing", wrapped);
    return wrapped;
  }

  offCallRinging(wrapped) {
    if (wrapped) {
      this.socket?.off("call_ringing", wrapped);
    } else {
      const internal = this._internalCallbacks.get("call_ringing");
      if (internal) {
        this.socket?.off("call_ringing", internal);
        this._internalCallbacks.delete("call_ringing");
      }
    }
  }

  /**
   * Listen for call accepted
   */
  onCallAccepted(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_accepted received:', data);
      callback(data);
    };
    this.socket?.on("call_accepted", wrapped);
    return wrapped;
  }

  offCallAccepted(wrapped) {
    if (wrapped) {
      this.socket?.off("call_accepted", wrapped);
    } else {
      // Only remove the internal wrapped callback, not ALL listeners
      const internal = this._internalCallbacks.get("call_accepted");
      if (internal) {
        this.socket?.off("call_accepted", internal);
        this._internalCallbacks.delete("call_accepted");
      }
    }
  }

  /**
   * Listen for call declined
   */
  onCallDeclined(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_declined received:', data, '| socketId:', this.socket?.id);
      callback(data);
    };
    this.socket?.on("call_declined", wrapped);
    return wrapped;
  }

  offCallDeclined(wrapped) {
    if (wrapped) {
      this.socket?.off("call_declined", wrapped);
    } else {
      this.socket?.off("call_declined");
    }
  }

  /**
   * Listen for call ended
   */
  onCallEnded(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_ended received:', data);
      callback(data);
    };
    this.socket?.on("call_ended", wrapped);
    return wrapped;
  }

  offCallEnded(wrapped) {
    if (wrapped) {
      this.socket?.off("call_ended", wrapped);
    } else {
      this.socket?.off("call_ended");
    }
  }

  /**
   * Listen for call cancelled (caller hung up while ringing)
   */
  onCallCancelled(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_cancelled received:', data, '| socketId:', this.socket?.id);
      callback(data);
    };
    this.socket?.on("call_cancelled", wrapped);
    return wrapped;
  }

  offCallCancelled(wrapped) {
    if (wrapped) {
      this.socket?.off("call_cancelled", wrapped);
    } else {
      this.socket?.off("call_cancelled");
    }
  }

  /**
   * Listen for call missed notification
   */
  onCallMissed(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_missed_notify received:', data);
      callback(data);
    };
    this.socket?.on("call_missed_notify", wrapped);
    return wrapped;
  }

  offCallMissed(wrapped) {
    if (wrapped) this.socket?.off("call_missed_notify", wrapped);
    else this.socket?.off("call_missed_notify");
  }

  /**
   * Listen for no answer (caller side)
   */
  onCallNoAnswer(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_no_answer received:', data);
      callback(data);
    };
    this.socket?.on("call_no_answer", wrapped);
    return wrapped;
  }

  offCallNoAnswer(wrapped) {
    if (wrapped) {
      this.socket?.off("call_no_answer", wrapped);
    } else {
      const internal = this._internalCallbacks.get("call_no_answer");
      if (internal) {
        this.socket?.off("call_no_answer", internal);
        this._internalCallbacks.delete("call_no_answer");
      }
    }
  }

  /**
   * Listen for call rejected (callee is offline or unavailable)
   */
  onCallRejected(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_rejected received:', data);
      callback(data);
    };
    this.socket?.on("call_rejected", wrapped);
    return wrapped;
  }

  offCallRejected(wrapped) {
    if (wrapped) {
      this.socket?.off("call_rejected", wrapped);
    } else {
      const internal = this._internalCallbacks.get("call_rejected");
      if (internal) {
        this.socket?.off("call_rejected", internal);
        this._internalCallbacks.delete("call_rejected");
      }
    }
  }

  /**
   * Listen for incoming call offer (WebRTC)
   */
  onCallOfferReceived(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_offer_received received:', data);
      callback(data);
    };
    this.socket?.on("call_offer_received", wrapped);
    return wrapped;
  }

  offCallOfferReceived(wrapped) {
    if (wrapped) this.socket?.off("call_offer_received", wrapped);
    else this.socket?.off("call_offer_received");
  }

  /**
   * Listen for incoming call answer (WebRTC)
   */
  onCallAnswerReceived(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_answer_received received:', data);
      callback(data);
    };
    this.socket?.on("call_answer_received", wrapped);
    return wrapped;
  }

  offCallAnswerReceived(wrapped) {
    if (wrapped) {
      this.socket?.off("call_answer_received", wrapped);
    } else {
      const internal = this._internalCallbacks.get("call_answer_received");
      if (internal) {
        this.socket?.off("call_answer_received", internal);
        this._internalCallbacks.delete("call_answer_received");
      }
    }
  }

  /**
   * Listen for incoming ICE candidate (WebRTC)
   */
  onCallIceCandidateReceived(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_ice_candidate_received received:', data);
      callback(data);
    };
    this.socket?.on("call_ice_candidate_received", wrapped);
    return wrapped;
  }

  offCallIceCandidateReceived(wrapped) {
    if (wrapped) {
      this.socket?.off("call_ice_candidate_received", wrapped);
    } else {
      const internal = this._internalCallbacks.get("call_ice_candidate_received");
      if (internal) {
        this.socket?.off("call_ice_candidate_received", internal);
        this._internalCallbacks.delete("call_ice_candidate_received");
      }
    }
  }

  /**
   * Listen for custom call error events from server.
   */
  onCallError(callback) {
    const wrapped = (data) => {
      console.log('📞 [SOCKET] call_error received:', data);
      callback(data);
    };
    this.socket?.on("call_error", wrapped);
    return wrapped;
  }

  offCallError(wrapped) {
    if (wrapped) {
      this.socket?.off("call_error", wrapped);
    } else {
      const internal = this._internalCallbacks.get("call_error");
      if (internal) {
        this.socket?.off("call_error", internal);
        this._internalCallbacks.delete("call_error");
      }
    }
  }

  /**
   * Debug: listen to ALL socket events — useful for troubleshooting.
   * Run in browser console after page load.
   */
  enableOnAny() {
    if (!this.socket) {
      console.warn("[socketService] enableOnAny: socket not initialized yet");
      return;
    }
    this.socket.onAny((event, ...args) => {
      console.log(`[onAny] event="${event}"`, args);
    });
    console.log(`[socketService] onAny enabled on socket ${this.socket.id}`);
  }
}

export const socketService = new SocketService();
window.socketService = socketService;
export default socketService;
