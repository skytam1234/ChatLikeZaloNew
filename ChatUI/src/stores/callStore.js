import { create } from 'zustand'

/**
 * Call states
 */
export const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ENDED: 'ended',
  REJECTED: 'rejected', // Callee is offline
}

/**
 * Call store for managing call state
 */
export const useCallStore = create((set, get) => ({
  // Call state
  callState: CALL_STATES.IDLE,
  currentCallId: null,
  currentCallType: null, // 'audio' or 'video'

  // Participants
  callerId: null,
  calleeId: null,
  callerInfo: null,
  calleeInfo: null,

  // Local/Remote streams
  localStream: null,
  remoteStream: null,

  // Media state
  isMuted: false,
  isVideoOff: false,
  isSpeakerOn: true,

  // Call timer
  callStartTime: null,
  callDuration: 0,

  // Incoming call info
  incomingCall: null,

  // Error
  error: null,

  /**
   * Initiate a call
   * @param {Object} params
   * @param {string} params.callId
   * @param {string} params.conversationId
   * @param {string} params.calleeId
   * @param {string} params.calleeInfo
   * @param {'audio'|'video'} params.type
   */
  initiateCall: ({ callId, conversationId, calleeId, calleeInfo, type }) => {
    set({
      callState: CALL_STATES.CALLING,
      currentCallId: callId,
      currentCallType: type,
      callerId: null,
      calleeId,
      calleeInfo,
      incomingCall: null,
      error: null,
      callDuration: 0,
    })
  },

  /**
   * Set caller info (when initiating call)
   * @param {Object} callerInfo
   */
  setCallerInfo: (callerInfo) => {
    set({ callerInfo })
  },

  /**
   * Handle incoming call
   * @param {Object|null} callInfo
   */
  setIncomingCall: (callInfo) => {
    if (!callInfo) {
      set({ incomingCall: null })
      return
    }
    set({
      incomingCall: callInfo,
      callState: CALL_STATES.RINGING,
      currentCallId: callInfo.callId,
      currentCallType: callInfo.type,
      callerId: callInfo.caller?.id,
      callerInfo: callInfo.caller,
      calleeId: callInfo.calleeId,
    })
  },

  /**
   * Call accepted - start connection
   */
  callAccepted: () => {
    set({
      callState: CALL_STATES.CONNECTED,
      callStartTime: Date.now(),
    })
  },

  /**
   * Call is ringing (callee accepted, waiting for connection)
   */
  callRinging: () => {
    set({ callState: CALL_STATES.RINGING })
  },

  /**
   * Call declined
   */
  callDeclined: () => {
    set({
      callState: CALL_STATES.ENDED,
      incomingCall: null,
    })
  },

  /**
   * Call ended by remote or local
   */
  callEnded: () => {
    set({
      callState: CALL_STATES.ENDED,
      incomingCall: null,
    })
  },

  /**
   * Call rejected - callee is offline or unavailable
   * @param {string} message - Reason message
   */
  callRejected: (message = 'Người dùng hiện không liên lạc được') => {
    set({
      callState: CALL_STATES.REJECTED,
      error: message,
      incomingCall: null,
    })
  },

  /**
   * Set local media stream
   * @param {MediaStream} stream
   */
  setLocalStream: (stream) => {
    set({ localStream: stream })
  },

  /**
   * Set remote media stream
   * @param {MediaStream} stream
   */
  setRemoteStream: (stream) => {
    set({ remoteStream: stream })
  },

  /**
   * Toggle mute
   */
  toggleMute: () => {
    const { isMuted, localStream } = get()
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted
      })
    }
    set({ isMuted: !isMuted })
  },

  /**
   * Toggle video
   */
  toggleVideo: () => {
    const { isVideoOff, localStream } = get()
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoOff
      })
    }
    set({ isVideoOff: !isVideoOff })
  },

  /**
   * Toggle speaker
   */
  toggleSpeaker: () => {
    set((state) => ({ isSpeakerOn: !state.isSpeakerOn }))
  },

  /**
   * Update call duration
   * @param {number} duration — actual elapsed seconds, or null to reset
   */
  setCallDuration: (duration) => {
    set({ callDuration: duration })
  },

  /**
   * Set error
   * @param {string} error
   */
  setError: (error) => {
    set({ error })
  },

  /**
   * Set call ID (used by caller to update store once server confirms the call)
   * @param {string} callId
   */
  setCallId: (callId) => {
    set({ currentCallId: callId })
  },

  /**
   * Clear/reset all call state
   */
  resetCall: () => {
    const { localStream, remoteStream } = get()

    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop())
    }

    set({
      callState: CALL_STATES.IDLE,
      currentCallId: null,
      currentCallType: null,
      callerId: null,
      calleeId: null,
      callerInfo: null,
      calleeInfo: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      isSpeakerOn: true,
      callStartTime: null,
      callDuration: 0,
      incomingCall: null,
      error: null,
    })
  },

  /**
   * Check if there's an active call
   * @returns {boolean}
   */
  hasActiveCall: () => {
    const { callState } = get()
    return [CALL_STATES.CALLING, CALL_STATES.RINGING, CALL_STATES.CONNECTED].includes(callState)
  },
}))
