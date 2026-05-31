import prisma from "../../config/prisma.js";
import socketService from "../services/socket.service.js";
import { SOCKET_EVENTS } from "../events.js";
import {
  isUserOccupied,
  setUserOccupied,
  releaseUserOccupation,
} from "../../services/callCleanup.service.js";

/**
 * In-memory rate limiter for call initiation.
 * Limits: max 5 call attempts per user per 60 seconds.
 * Key = userId, Value = array of timestamps.
 */
const callRateLimitMap = new Map();
const CALL_RATE_LIMIT = { windowMs: 60000, maxAttempts: 5 };

/**
 * In-memory per-call timers for 30s auto-terminate.
 * Map<callId, NodeJS.Timeout>
 */
const callTimers = new Map();

/**
 * Auto-terminate a ringing call after 30 seconds of no answer.
 * Called directly by per-call timers (not polling).
 */
async function autoTerminateCall(callId, io) {
  const timer = callTimers.get(callId);
  if (timer) {
    clearTimeout(timer);
    callTimers.delete(callId);
  }

  try {
    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (!call || !["pending", "ringing"].includes(call.status)) return;

    const now = new Date();
    await prisma.call.update({
      where: { id: callId },
      data: { status: "missed", endedAt: now },
    });
    await releaseUserOccupation(call.callerId);

    if (io) {
      io.to(`user:${call.callerId}`).emit(SOCKET_EVENTS.CALL_NO_ANSWER, {
        callId,
        conversationId: call.conversationId,
        calleeId: call.calleeId,
        timestamp: now.toISOString(),
      });
      io.to(`user:${call.calleeId}`).emit(SOCKET_EVENTS.CALL_CANCELLED, {
        callId,
        conversationId: call.conversationId,
        timestamp: now.toISOString(),
      });
    }
    console.log(
      `📞 [CALL] autoTerminateCall: call ${callId} terminated after 30s no-answer`,
    );
  } catch (error) {
    console.error(
      `📞 [CALL] autoTerminateCall: error for call ${callId}:`,
      error,
    );
  }
}

/**
 * Check and record a call attempt. Returns true if allowed, false if rate limited.
 */
const checkCallRateLimit = (userId) => {
  const now = Date.now();
  const windowStart = now - CALL_RATE_LIMIT.windowMs;
  const attempts = callRateLimitMap.get(userId) || [];
  const recentAttempts = attempts.filter((ts) => ts > windowStart);

  if (recentAttempts.length >= CALL_RATE_LIMIT.maxAttempts) {
    return false;
  }

  recentAttempts.push(now);
  callRateLimitMap.set(userId, recentAttempts);
  return true;
};

/**
 * Call Handler - Handle all call-related socket events
 */
class CallHandler {
  /**
   * Handle call initiation
   */
  async handleCallInitiate(socket, data) {
    try {
      const { conversationId, calleeId, type, callId: clientCallId } = data;
      const callerId = socket.userId;
      console.log("📞 [INIT] Server nhan duoc yeu cau tao cua nguoi goi", { callerId, calleeId, conversationId, type });

      if (!conversationId || !calleeId || !type) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Missing required fields" });
        console.log("📞 [INIT] FAIL: Missing required fields");
        return;
      }

      if (!["audio", "video"].includes(type)) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Invalid call type" });
        console.log("📞 [INIT] FAIL: Invalid call type");
        return;
      }

      if (!checkCallRateLimit(callerId)) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "Bạn đang gọi quá nhiều. Vui lòng chờ một chút rồi thử lại.",
        });
        console.log("📞 [INIT] FAIL: Rate limited");
        return;
      }

      const participant = await prisma.conversationUser.findFirst({
        where: { conversationId, userId: callerId },
      });
      if (!participant) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Not a participant of this conversation" });
        console.log("📞 [INIT] FAIL: Caller not participant");
        return;
      }

      const calleeParticipant = await prisma.conversationUser.findFirst({
        where: { conversationId, userId: calleeId },
      });
      if (!calleeParticipant) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Callee is not a participant of this conversation" });
        console.log("📞 [INIT] FAIL: Callee not participant");
        return;
      }

      const callerBusy = await isUserOccupied(callerId);
      console.log("📞 [INIT] Caller busy check:", callerBusy);
      if (callerBusy) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "Bạn đang trong một cuộc gọi khác. Vui lòng kết thúc cuộc gọi hiện tại trước.",
        });
        console.log("📞 [INIT] FAIL: Caller busy");
        return;
      }

      const calleeBusy = await isUserOccupied(calleeId);
      console.log("📞 [INIT] Callee busy check:", calleeBusy);
      if (calleeBusy) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "Người dùng đang trong một cuộc gọi khác. Vui lòng thử lại sau.",
        });
        console.log("📞 [INIT] FAIL: Callee busy");
        return;
      }

      const calleeOnline = socketService.isUserOnline(calleeId);
      console.log("📞 [INIT] Callee online:", calleeOnline,
        "— userSockets:", [...socketService.userSockets.entries()].map(([uid, sockets]) => `${uid}: ${sockets.size} socket(s)`)
      );

      if (!calleeOnline) {
        socket.emit(SOCKET_EVENTS.CALL_REJECTED, {
          calleeId,
          reason: "offline",
          message: "Người dùng hiện không liên lạc được",
        });
        console.log("📞 [INIT] FAIL: Callee offline");
        return;
      }

      // Check for stale active call
      const activeCall = await prisma.call.findFirst({
        where: {
          conversationId,
          status: { in: ["pending", "ringing", "accepted"] },
        },
        include: {
          caller: { select: { callOccupiedUntil: true } },
          callee: { select: { callOccupiedUntil: true } },
        },
      });
      if (activeCall) {
        const now = new Date();
        const callerOccupied = activeCall.caller.callOccupiedUntil && new Date(activeCall.caller.callOccupiedUntil) > now;
        const calleeOccupied = activeCall.callee.callOccupiedUntil && new Date(activeCall.callee.callOccupiedUntil) > now;
        if (callerOccupied || calleeOccupied) {
          socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "There is already an active call in this conversation" });
          console.log("📞 [INIT] FAIL: Active call exists");
          return;
        }
        await prisma.call.update({ where: { id: activeCall.id }, data: { status: "ended", endedAt: now } });
      }

      // Get caller info
      const caller = await prisma.user.findUnique({
        where: { id: callerId },
        select: { id: true, displayName: true, avatarUrl: true },
      });

      // Create call record — use client-provided callId if available
      const call = await prisma.call.create({
        data: {
          id: clientCallId || undefined,
          conversationId,
          callerId,
          calleeId,
          type,
          status: "pending",
          expiresAt: new Date(Date.now() + 120000),
        },
      });

      // Join caller to call room
      socket.join(`call:${call.id}`);

      // Send incoming_call to callee
      socketService.io.to(`user:${calleeId}`).emit(SOCKET_EVENTS.INCOMING_CALL, {
        callId: call.id,
        conversationId,
        caller: { id: caller.id, displayName: caller.displayName, avatarUrl: caller.avatarUrl },
        calleeId,
        type,
        timestamp: new Date().toISOString(),
      });

      // Update call status to ringing
      await prisma.call.update({ where: { id: call.id }, data: { status: "ringing" } });

      // Confirm to caller
      socket.emit(SOCKET_EVENTS.CALL_RINGING, { callId: call.id, conversationId, calleeId, type, calleeOnline: true });

      // Start 30s auto-terminate timer
      const timer = setTimeout(() => { autoTerminateCall(call.id, socketService.io); }, 30000);
      callTimers.set(call.id, timer);
      console.log("📞 [INIT] SUCCESS — callId:", call.id, "| caller socketId:", socket.id);
    } catch (error) {
      console.error("Error initiating call:", error);
      socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Failed to initiate call" });
    }
  }

  /**
   * Handle call acceptance
   */
  async handleCallAccept(socket, data) {
    try {
      const { callId } = data;
      const userId = socket.userId;
      console.log("📞 [CALL_ACCEPT] START", { callId, userId, socketId: socket.id });

      if (!callId) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Missing call ID" });
        console.log("📞 [CALL_ACCEPT] FAIL: missing callId");
        return;
      }

      const call = await prisma.call.findUnique({
        where: { id: callId },
      });
      console.log("📞 [CALL_ACCEPT] call from DB:", call ? { id: call.id, status: call.status, callerId: call.callerId, calleeId: call.calleeId } : "NOT FOUND");

      if (!call) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Call not found" });
        console.log("📞 [CALL_ACCEPT] FAIL: call not found");
        return;
      }

      if (call.calleeId !== userId) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "You are not the callee of this call",
        });
        console.log("📞 [CALL_ACCEPT] FAIL: callee mismatch", { callCalleeId: call.calleeId, userId });
        return;
      }

      if (!["pending", "ringing"].includes(call.status)) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Call is no longer active" });
        console.log("📞 [CALL_ACCEPT] FAIL: call status is", call.status);
        return;
      }

      // Cancel the 30s auto-terminate timer
      const acceptTimer = callTimers.get(callId);
      if (acceptTimer) {
        clearTimeout(acceptTimer);
        callTimers.delete(callId);
      }

      // Update call status
      await prisma.call.update({
        where: { id: callId },
        data: {
          status: "accepted",
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      // Set user occupation (both parties are now busy)
      await setUserOccupied(call.calleeId, callId);
      await setUserOccupied(call.callerId, callId);

      // Join callee to call room
      socket.join(`call:${callId}`);

      // Notify caller via direct socket emission (same pattern as handleCallDecline)
      const callerSockets = socketService.getSocketsInRoom(`user:${call.callerId}`);
      console.log("📞 [CALL_ACCEPT] callerSockets:", callerSockets, "| callerId:", call.callerId, "| io type:", typeof socketService.io.to);
      for (const sockId of callerSockets) {
        socketService.io.to(sockId).emit(SOCKET_EVENTS.CALL_ACCEPTED, {
          callId,
          acceptedBy: userId,
          timestamp: new Date().toISOString(),
        });
      }
      console.log("📞 [CALL_ACCEPT] SUCCESS — emitted to", callerSockets.length, "socket(s)");
    } catch (error) {
      console.error("Error accepting call:", error);
      socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Failed to accept call" });
    }
  }

  /**
   * Handle call decline
   */
  async handleCallDecline(socket, data) {
    try {
      const { callId } = data;
      const userId = socket.userId;
      console.log("📞 [CALL_DECLINE] socket.id:", socket.id, "| userId:", userId, "| callId:", callId);

      if (!callId) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Missing call ID" });
        return;
      }

      const call = await prisma.call.findUnique({
        where: { id: callId },
      });

      if (!call) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Call not found" });
        return;
      }

      if (call.calleeId !== userId) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "You are not the callee of this call",
        });
        return;
      }

      if (!["pending", "ringing"].includes(call.status)) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Call is no longer active" });
        console.log("📞 [CALL_DECLINE] FAIL: status=", call.status, "not pending/ringing");
        return;
      }

      // Cancel the 30s auto-terminate timer
      const declineTimer = callTimers.get(callId);
      if (declineTimer) {
        clearTimeout(declineTimer);
        callTimers.delete(callId);
      }

      // Update call status
      await prisma.call.update({
        where: { id: callId },
        data: {
          status: "declined",
          endedAt: new Date(),
          expiresAt: null,
        },
      });

      // Release caller occupation
      await releaseUserOccupation(call.callerId);

      // Notify caller — emit directly to each of their sockets
      const callerSockets = socketService.getSocketsInRoom(`user:${call.callerId}`);
      console.log("📞 [CALL_DECLINE] callerSockets:", callerSockets, "| sockId emitting:", socket.id);
      const payload = {
        callId,
        declinedBy: userId,
        timestamp: new Date().toISOString(),
      };
      for (const sockId of callerSockets) {
        socketService.io.to(sockId).emit(SOCKET_EVENTS.CALL_DECLINED, payload);
      }
    } catch (error) {
      console.error("Error declining call:", error);
      socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Failed to decline call" });
    }
  }

  /**
   * Handle call end
   */
  async handleCallEnd(socket, data) {
    try {
      const { callId } = data;
      const userId = socket.userId;

      if (!callId) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Missing call ID" });
        return;
      }

      const call = await prisma.call.findUnique({
        where: { id: callId },
      });

      if (!call) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Call not found" });
        return;
      }

      if (call.callerId !== userId && call.calleeId !== userId) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "You are not a participant of this call",
        });
        return;
      }

      if (!["pending", "ringing", "accepted"].includes(call.status)) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Call is no longer active" });
        return;
      }

      // Cancel the auto-terminate timer if call is still ringing
      const endTimer = callTimers.get(callId);
      if (endTimer) {
        clearTimeout(endTimer);
        callTimers.delete(callId);
      }

      // Calculate duration if call was accepted
      let duration = 0;
      if (call.startedAt) {
        duration = Math.floor((new Date() - new Date(call.startedAt)) / 1000);
      }

      // Update call status
      await prisma.call.update({
        where: { id: callId },
        data: {
          status: "ended",
          endedAt: new Date(),
          duration,
          expiresAt: null,
        },
      });

      // Release both parties' occupation
      await releaseUserOccupation(call.callerId);
      await releaseUserOccupation(call.calleeId);

      // Get other participant's socket
      const otherUserId =
        call.callerId === userId ? call.calleeId : call.callerId;

      // Determine event: if callee is still ringing, emit call_cancelled so their modal closes
      const event = call.status === "ringing" ? SOCKET_EVENTS.CALL_CANCELLED : SOCKET_EVENTS.CALL_ENDED;
      const payload = {
        callId,
        endedBy: userId,
        duration,
        timestamp: new Date().toISOString(),
      };

      // Emit directly to each socket of the other party
      const otherSockets = socketService.getSocketsInRoom(`user:${otherUserId}`);
      for (const sockId of otherSockets) {
        socketService.io.to(sockId).emit(event, payload);
      }
    } catch (error) {
      console.error("Error ending call:", error);
      socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Failed to end call" });
    }
  }

  /**
   * Handle missed call (when callee doesn't respond)
   */
  async handleCallMissed(socket, data) {
    try {
      const { callId } = data;
      const userId = socket.userId;

      if (!callId) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Missing call ID" });
        return;
      }

      const call = await prisma.call.findUnique({
        where: { id: callId },
      });

      if (!call) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Call not found" });
        return;
      }

      if (call.callerId !== userId) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "You are not the caller of this call",
        });
        return;
      }

      if (!["pending", "ringing"].includes(call.status)) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Call is no longer active" });
        return;
      }

      // Cancel the auto-terminate timer if it exists
      const missedTimer = callTimers.get(callId);
      if (missedTimer) {
        clearTimeout(missedTimer);
        callTimers.delete(callId);
      }

      // Update call status
      await prisma.call.update({
        where: { id: callId },
        data: {
          status: "missed",
          endedAt: new Date(),
          expiresAt: null,
        },
      });

      // Release caller occupation
      await releaseUserOccupation(call.callerId);

      // Notify callee
      socket
        .to(`user:${call.calleeId}`)
        .emit(SOCKET_EVENTS.CALL_MISSED_NOTIFY, {
          callId,
          callerId,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error("Error marking call as missed:", error);
      socket.emit(SOCKET_EVENTS.CALL_ERROR, {
        error: "Failed to mark call as missed",
      });
    }
  }

  /**
   * Verify user is a participant of the call (auth check)
   */
  _verifyCallParticipant(socket, callId, userId) {
    if (!callId || !userId) return null;
    return prisma.call
      .findUnique({
        where: { id: callId },
      })
      .then((call) => {
        if (!call) return { error: "Call not found", call: null };
        if (call.callerId !== userId && call.calleeId !== userId) {
          return {
            error: "You are not a participant of this call",
            call: null,
          };
        }
        return { error: null, call };
      });
  }

  /**
   * Handle WebRTC offer
   */
  async handleCallOffer(socket, data) {
    try {
      const { callId, offer } = data;
      const senderId = socket.userId;

      if (!callId || !offer) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Missing required fields" });
        return;
      }

      const verification = await this._verifyCallParticipant(
        socket,
        callId,
        senderId,
      );
      if (verification.error) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: verification.error });
        return;
      }

      const call = verification.call;
      if (call.status !== "accepted") {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "Call must be accepted before exchanging offers",
        });
        return;
      }

      // Forward offer to callee
      socket.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_OFFER_RECEIVED, {
        callId,
        offer,
        from: senderId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error handling call offer:", error);
      socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Failed to forward offer" });
    }
  }

  /**
   * Handle WebRTC answer
   */
  async handleCallAnswer(socket, data) {
    try {
      const { callId, answer } = data;
      const senderId = socket.userId;

      if (!callId || !answer) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Missing required fields" });
        return;
      }

      const verification = await this._verifyCallParticipant(
        socket,
        callId,
        senderId,
      );
      if (verification.error) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: verification.error });
        return;
      }

      const call = verification.call;
      if (call.status !== "accepted") {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "Call must be accepted before exchanging answers",
        });
        return;
      }

      // Forward answer to caller
      socket.to(`call:${callId}`).emit(SOCKET_EVENTS.CALL_ANSWER_RECEIVED, {
        callId,
        answer,
        from: senderId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error handling call answer:", error);
      socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Failed to forward answer" });
    }
  }

  /**
   * Handle ICE candidate
   */
  async handleCallIceCandidate(socket, data) {
    try {
      const { callId, candidate } = data;
      const senderId = socket.userId;

      if (!callId || !candidate) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: "Missing required fields" });
        return;
      }

      const verification = await this._verifyCallParticipant(
        socket,
        callId,
        senderId,
      );
      if (verification.error) {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, { error: verification.error });
        return;
      }

      const call = verification.call;
      if (call.status !== "accepted") {
        socket.emit(SOCKET_EVENTS.CALL_ERROR, {
          error: "Call must be accepted before exchanging ICE candidates",
        });
        return;
      }

      // Forward ICE candidate to other participants
      socket
        .to(`call:${callId}`)
        .emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE_RECEIVED, {
          callId,
          candidate,
          from: senderId,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
      socket.emit(SOCKET_EVENTS.CALL_ERROR, {
        error: "Failed to forward ICE candidate",
      });
    }
  }
}

export default new CallHandler();
