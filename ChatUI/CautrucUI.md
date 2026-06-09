# ChatUI - Cấu Trúc Dự Án Frontend

> Phân tích toàn bộ kiến trúc dự án ChatUI - React/Vite/Tailwind, quản lý state bằng Zustand, real-time bằng Socket.io, WebRTC cho cuộc gọi.

---

## 1. Tổng Quan Kiến Trúc

```
ChatUI (React + Vite + Tailwind CSS)
├── State Management: Zustand stores (auth, conversation, message, call, settings)
├── Real-time: Socket.io Client
├── API Layer: Axios với interceptors
├── Routing: React Router v6
├── WebRTC: simple-peer
└── Build Tool: Vite
```

### Cấu trúc thư mục

```
ChatUI/src/
├── api/                    # Gọi HTTP đến backend
│   ├── axiosClient.js      # Cấu hình axios client, interceptors
│   ├── authApi.js          # Auth: login, register, logout, refresh, sessions
│   ├── conversationApi.js   # CRUD cuộc trò chuyện
│   ├── messageApi.js       # Tin nhắn: gửi, xóa, thu hồi, search
│   ├── callApi.js          # Lịch sử cuộc gọi
│   ├── userApi.js          # Tìm kiếm user
│   ├── settingsApi.js       # Settings: profile, password, sessions
│   ├── pinnedApi.js        # Ghim tài liệu
│   ├── admin.js            # Admin: CRUD user, stats
│   └── googleAuthApi.js    # OAuth Google
├── services/               # Business logic
│   ├── socketService.js    # Socket.io wrapper - tất cả event socket
│   ├── webrtcService.js    # WebRTC wrapper - gọi thoại/video P2P
│   └── adminService.js     # Admin service (format data)
├── stores/                 # Zustand state stores
│   ├── authStore.js        # Auth state
│   ├── conversationStore.js # Conversation state
│   ├── messageStore.js     # Message state
│   ├── callStore.js        # Call state (Zustand)
│   └── settingsStore.js    # Settings state
├── contexts/               # React Context providers
│   ├── AuthContext.jsx     # Auth logic + token refresh timer
│   ├── ChatContext.jsx     # Chat operations (send, delete, recall)
│   └── SocketContext.jsx   # Socket listeners + real-time events
├── hooks/                  # Custom React hooks
│   ├── useAuth.js          # useAuth + useTokenChecker
│   ├── useConversations.js # Conversations wrapper
│   ├── useMessages.js      # Messages wrapper
│   ├── usePinnedDocs.js    # Pinned docs wrapper
│   ├── useAuthGuard.js     # Route protection + session management
│   └── useTokenRefresh.js  # Token refresh logic (queue subscribers)
├── components/             # UI components
│   ├── common/             # Reusable: Button, Input, Modal, Avatar, Toast...
│   ├── chat/               # Chat: ChatBubble, ChatInput, MessageList, ConversationItem...
│   ├── call/               # Call: CallOverlay, IncomingCallModal
│   ├── layout/             # Layout: Header, Sidebar, MainLayout
│   └── settings/            # Settings layout
├── pages/                  # Page components
│   ├── auth/               # Login, Register, ForgotPassword, ResetPassword, AuthCallback
│   ├── chat/               # ChatLayout, ConversationPage, NewConversationPage, CallHistoryPage
│   ├── settings/           # SettingsPage + tabs
│   └── admin/              # AdminDashboard
├── routes/                 # Routing
│   ├── index.jsx           # AppRoutes + CallModalHandler (root-level)
│   └── PrivateRoute.jsx    # Auth guard routes
├── utils/                  # Utilities
│   ├── constants.js        # Routes, SOCKET_EVENTS, MESSAGE_TYPES...
│   ├── storage.js          # localStorage wrapper
│   ├── tokenService.js     # JWT decode, expiry check
│   ├── helpers.js          # debounce...
│   ├── formatters.js       # Date formatting
│   └── cn.js              # className utility (clsx)
└── main.jsx                # Entry point
```

---

## 2. Hệ Thống State Management

Dự án sử dụng **Zustand** để quản lý state, kết hợp **React Context** để chia sẻ business logic. Có **5 store chính**:

---

### 2.1. `authStore` - Xác thực người dùng

**File:** `src/stores/authStore.js`

**State:**
```
user: User | null           - Thông tin user đang login
isAuthenticated: boolean     - Đã xác thực chưa
isLoading: boolean          - Đang loading
error: string | null        - Lỗi auth
isSessionExpired: boolean   - Session hết hạn
```

**Actions:**
```
login(credentials)           → Gọi authApi.login, lưu tokens vào localStorage
logout()                    → Gọi authApi.logout, xóa localStorage
register(data)              → Gọi authApi.register, KHÔNG lưu tokens (user phải login lại)
checkAuth()                 → Kiểm tra token, refresh nếu hết hạn, fetch user hiện tại
refreshSession()            → Refresh access token bằng refresh token
setUser(user)               → Set user thủ công
setUserOnline(isOnline)     → Cập nhật trạng thái online/offline
setSessionExpired(bool)     → Set trạng thái session expired
setAuth(accessToken, refreshToken, user) → Set auth từ Google OAuth callback
clearError()                → Xóa lỗi
```

**Công dụng:** Quản lý toàn bộ vòng đời authentication - login, logout, token refresh tự động, session expiry. Được sử dụng bởi `AuthContext`, `SocketContext`, và hầu hết mọi page.

---

### 2.2. `conversationStore` - Quản lý cuộc trò chuyện

**File:** `src/stores/conversationStore.js`

**State:**
```
conversations: Conversation[]  - Danh sách tất cả cuộc trò chuyện
activeConversation: Conv | null - Cuộc trò chuyện đang active
isLoading: boolean              - Đang loading
error: string | null          - Lỗi
```

**Actions:**
```
fetchConversations()                    → Gọi conversationApi.getConversations()
setActiveConversation(conv)              → Set cuộc trò chuyện đang mở
addConversation(conv)                   → Thêm cuộc trò chuyện mới vào list
updateConversation(id, data)            → Cập nhật thông tin cuộc trò chuyện
deleteConversation(id)                  → Xóa cuộc trò chuyện
updateLastMessage(convId, message)      → Cập nhật lastMessage, sort, tăng unreadCount
setUnreadCount(convId, count)          → Set số tin nhắn chưa đọc
resetUnreadCount(convId)               → Reset unread về 0 khi xem cuộc trò chuyện
updateUserOnlineStatus(userId, online) → Cập nhật trạng thái online của user trong tất cả cuộc trò chuyện
clearError()                            → Xóa lỗi
```

**Công dụng:** Quản lý danh sách cuộc trò chuyện trong sidebar, sắp xếp theo thời gian và ghim, theo dõi tin nhắn chưa đọc, cập nhật real-time khi có tin nhắn mới.

---

### 2.3. `messageStore` - Quản lý tin nhắn

**File:** `src/stores/messageStore.js`

**State:**
```
messagesByConversation: { [convId]: Message[] }  - Map tin nhắn theo conversation
typingUsersByConversation: { [convId]: TypingUser[] } - Ai đang gõ
isLoading: boolean                                 - Đang loading
error: string | null                              - Lỗi
```

**Actions:**
```
fetchMessages(convId)                     → Gọi messageApi.getMessages(convId)
addMessage(convId, message)              → Thêm tin nhắn mới, sort theo thời gian
updateMessage(convId, msgId, data)      → Cập nhật tin nhắn (VD: isEdited)
deleteMessage(convId, msgId)             → Xóa mềm (isDeleted: true, content: null)
recallMessage(convId, msgId)             → Xóa vĩnh viễn khỏi store
setTypingUser(convId, user)             → Thêm user đang gõ
removeTypingUser(convId, userId)         → Xóa user đang gõ
clearTypingUsers(convId)                 → Xóa tất cả typing users
updateMessageStatus(convId, msgId, status) → Cập nhật trạng thái (sent/delivered/seen)
clearMessages(convId)                    → Xóa tất cả tin nhắn của cuộc trò chuyện
clearError()                             → Xóa lỗi
```

**Công dụng:** Lưu trữ tin nhắn theo từng cuộc trò chuyện, theo dõi typing indicators, quản lý message lifecycle (thêm, sửa, xóa, thu hồi).

---

### 2.4. `callStore` - Quản lý cuộc gọi (Zustand)

**File:** `src/stores/callStore.js`

**State:**
```
callState: CALL_STATES       - IDLE | CALLING | RINGING | CONNECTED | ENDED | REJECTED
currentCallId: string | null
currentCallType: 'audio' | 'video' | null
callerId / calleeId: string | null
callerInfo / calleeInfo: User | null
localStream / remoteStream: MediaStream | null
isMuted / isVideoOff / isSpeakerOn: boolean
callStartTime: number | null
callDuration: number (seconds)
incomingCall: IncomingCallInfo | null
error: string | null
```

**CALL_STATES:**
```
IDLE      → Chưa có cuộc gọi
CALLING   → Đang gọi (chờ người kia trả lời)
RINGING   → Chuông reo (có người gọi đến, hoặc đang chờ)
CONNECTED → Đã kết nối
ENDED     → Kết thúc
REJECTED  → Bị từ chối / offline
```

**Actions:**
```
initiateCall({ callId, conversationId, calleeId, calleeInfo, type })
setIncomingCall(callInfo)         → Có cuộc gọi đến
callAccepted()                    → Cuộc gọi được nhận
callRinging()                    → Đang reo chuông
callDeclined() / callEnded() / callRejected()
setLocalStream(stream) / setRemoteStream(stream)
toggleMute() / toggleVideo() / toggleSpeaker()
setCallDuration(seconds) / setError(msg)
resetCall()                      → Reset toàn bộ state cuộc gọi
hasActiveCall() → boolean        → Kiểm tra có cuộc gọi đang diễn ra
```

**Công dụng:** Quản lý toàn bộ state của cuộc gọi thoại/video - từ lúc khởi tạo, gọi đến, kết nối, cho đến khi kết thúc. Lưu trữ MediaStream để hiển thị video.

---

### 2.5. `settingsStore` - Quản lý settings

**File:** `src/stores/settingsStore.js`

**State:**
```
notificationSettings: {
  messageNotifications: boolean
  soundEnabled: boolean
  desktopNotifications: boolean
  messagePreview: boolean
  typingWhileTyping: boolean
  groupNotifications: boolean
  missedCallNotifications: boolean
}
sessions: Session[]
sessionsLoading / sessionsError
profileLoading / profileError
passwordLoading / passwordError
```

**Actions:**
```
updateNotificationSettings(settings)  → Cập nhật settings cục bộ
resetNotificationSettings()          → Reset về default
fetchSessions()                       → Gọi settingsApi.getSessions()
revokeSession(sessionId)             → Thu hồi 1 phiên
revokeAllSessions()                   → Thu hồi tất cả phiên
updateProfile(data)                  → Gọi settingsApi.updateProfile()
changePassword(current, new)         → Gọi settingsApi.changePassword()
uploadAvatar(file)                   → Upload avatar lên server
```

---

## 3. Contexts - Layer Business Logic

### 3.1. `AuthContext`

**File:** `src/contexts/AuthContext.jsx`

Bọc `authStore`, thêm:
- **Auto check auth** khi mount (ngoại trừ trang login/register)
- **Auto token refresh timer**: Tính thời gian đến khi token hết hạn, refresh 5 phút trước
- **SessionExpiredModal**: Hiện modal khi session hết hạn
- **Redirect logic**: Chuyển về login khi session expired

**Providers chain:**
```
AuthContext.Provider
  └─ Token refresh timer (useEffect)
  └─ SessionExpiredModal (always rendered)
```

---

### 3.2. `SocketContext`

**File:** `src/contexts/SocketContext.jsx`

Bọc `socketService`, lắng nghe **tất cả socket events** và cập nhật stores tương ứng:

| Socket Event | Handler | Store Update |
|---|---|---|
| `incoming_call` | `handleIncomingCall` | `callStore.setIncomingCall` |
| `new_message` | `handleNewMessage` | `messageStore.addMessage` + `conversationStore.updateLastMessage` |
| `user_typing` | `handleUserTyping` | `messageStore.setTypingUser` |
| `user_stop_typing` | `handleUserStopTyping` | `messageStore.removeTypingUser` |
| `message_recalled` | `handleMessageRecalled` | `messageStore.recallMessage` |
| `user_online/offline` | `updateUserOnlineStatus` | `conversationStore.updateUserOnlineStatus` |
| `user_connected` | `handleUserConnected` | `conversationStore` + `authStore.setUserOnline` |
| `conversation_created` | `handleConversationCreated` | `conversationStore.addConversation` |
| `call_accepted/declined/ended/cancelled/rejected/no_answer/missed` | Various | `callStore` methods |
| `call_ringing` | `handleCallRinging` | `callStore.callRinging` |

**Actions exposed:**
```
joinConversation(convId)      → socket.emit("join_conversation")
leaveConversation(convId)    → socket.emit("leave_conversation")
sendMessage(data)            → socket.emit("send_message")
startTyping(convId)         → socket.emit("typing_start")
stopTyping(convId)           → socket.emit("typing_stop")
markSeen(convId, msgId)     → socket.emit("mark_seen")
markDelivered(convId, msgId) → socket.emit("mark_delivered")
```

---

### 3.3. `ChatContext`

**File:** `src/contexts/ChatContext.jsx`

Bọc `ChatContext`, cung cấp các hành động chat cấp cao:

| Method | Logic |
|---|---|
| `sendTextMessage(convId, content, type, replyToId)` | Gọi `messageApi.sendMessage` → `addMessage` + `updateLastMessage` |
| `sendFileMessage(convId, file, content, replyToId)` | Gọi `messageApi.sendFileMessage` → `addMessage` + `updateLastMessage` |
| `markAsRead(convId, msgId)` | Gọi `messageApi.markAsRead` + `markSeen` socket |
| `deleteMessage(convId, msgId)` | Gọi `messageApi.deleteMessage` → soft delete in store |
| `recallMessage(convId, msgId)` | Gọi `messageApi.recallMessage` → permanently remove from store |
| `acceptCall(callId)` | `socketService.acceptCall` |
| `declineCall(callId)` | `socketService.declineCall` |

---

## 4. Services - Low-level Logic

### 4.1. `socketService` (Singleton)

**File:** `src/services/socketService.js`

Là singleton wrapper cho Socket.io client. Đăng ký events với cơ chế **pending listeners** (đăng ký trước khi connect vẫn hoạt động).

**Connection management:**
```
connect()                    → io(SOCKET_URL, { auth: { token }, transports: [...] })
disconnect()                 → socket.disconnect()
isConnected() → boolean
```

**Emit methods:**
```
joinConversation(conversationId)
leaveConversation(conversationId)
sendMessage(data)
startTyping / stopTyping
markSeen / markDelivered
initiateCall(data)
acceptCall / declineCall / endCall / missCall
emitCallSignal(callId, signalingData)  → Tự detect type (offer/answer/ICE)
```

**On/off event methods:** 40+ methods cho tất cả socket events.

---

### 4.2. `webrtcService` (Singleton)

**File:** `src/services/webrtcService.js`

Wrapper cho `simple-peer`, xử lý WebRTC P2P cho cuộc gọi.

**Flow:**
```
1. initLocalStream(type, videoEnabled)
   → navigator.mediaDevices.getUserMedia(constraints)
   → setLocalStream in callStore

2. createPeerAsInitiator(localStream, callId)    → initiator: true
   createPeerAsCallee(localStream, callId)       → initiator: false
   → new PeerCtor({ initiator, trickle, stream, config: ICE_SERVERS })
   → _setupPeerEvents: on 'signal' → socket.emit('call_signal')
                                  on 'connect' → callAccepted()
                                  on 'stream' → setRemoteStream()

3. handleSignal(data)     → peer.signal(data)
   → _flushPendingSignals() nếu peer chưa ready

4. toggleMute() / toggleVideo() → track.enabled = !track.enabled

5. cleanup()              → peer.destroy() + stop all tracks
```

**ICE Servers:** STUN servers của Google
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`
- `stun:stun2.l.google.com:19302`

---

## 5. Chi Tiết Từng Tính Năng (Có WebSocket)

Mỗi tính năng được mô tả gồm: HTTP API gọi, WebSocket emit (client → server), WebSocket event nhận (server → client), và state thay đổi ra sao.

---

## 5.0. Contexts: Vai Trò Chi Tiết Từng Context

Trước khi đi vào chi tiết từng tính năng, cần hiểu rõ mỗi Context đảm nhận vai trò gì và có những action nào.

### AuthContext - Quản lý xác thực & phiên làm việc

**Đặt trong App tree:** Wraps toàn bộ app (`<AuthProvider><Router>...</Router></AuthProvider>`)

**State mà nó expose ra:**
```
user                    → Thông tin user hiện tại (từ authStore)
isAuthenticated         → true/false đã đăng nhập
isLoading               → true khi đang kiểm tra auth
error                   → Lỗi đăng nhập/đăng ký
isSessionExpired        → true khi token hết hạn và refresh thất bại
```

**Actions mà nó cung cấp:**
```
login(email, password)                  → Wrapper: authStore.login()
register(username, email, password, displayName) → Wrapper: authStore.register()
logout()                                → Wrapper: authStore.logout()
clearError()                            → Wrapper: authStore.clearError()
handleTokenRefresh()                     → Gọi refreshSession, hiện modal nếu thất bại
setUser(user)                           → Wrapper: authStore.setUser()
```

**Logic nội bộ (không expose):**
- `checkAuth()`: tự động chạy khi mount (trừ login/register page)
  - Có token + chưa hết hạn → gọi `authApi.getCurrentUser()`
  - Có token + HẾT HẠN → `refreshSession()` → nếu fail → `isSessionExpired: true`
  - Không có token → `isAuthenticated: false`
- Auto refresh token: schedule `setTimeout` gọi `refreshSession()` trước khi token hết hạn 5 phút
- `SessionExpiredModal`: hiện khi `isSessionExpired: true`, cho phép đăng nhập lại hoặc logout

**Phụ thuộc:** `authStore`, `storage`, `tokenService`, `authApi`

**Ai dùng:** Tất cả component cần kiểm tra auth (`Login.jsx`, `Register.jsx`, `AuthCallback.jsx`, `MainLayout`, `PrivateRoute`)

---

### SocketContext - Quản lý kết nối Socket.IO & xử lý real-time events

**Đặt trong App tree:** Trong `MainLayout` (`<MainLayout><SocketProvider>...children...</SocketProvider></MainLayout>`)

**State mà nó expose ra:**
```
isConnected             → socket đang connected hay không (từ socketService)
```

**Actions mà nó cung cấp:**
```
joinConversation(conversationId)     → socketService.joinConversation(id)
leaveConversation(conversationId)   → socketService.leaveConversation(id)
sendMessage(data)                   → socketService.sendMessage({ ...data, type })
startTyping(conversationId)          → socketService.startTyping(id, username)
stopTyping(conversationId)           → socketService.stopTyping(id)
markSeen(conversationId, messageId)  → socketService.markSeen(id, msgId)
markDelivered(conversationId, messageId) → socketService.markDelivered(id, msgId)
```

**Logic nội bộ - TỰ ĐỘNG xử lý các socket events (KHÔNG cần component gọi):**

| Event nhận được | Action tự động gọi | Store bị ảnh hưởng |
|---|---|---|
| `incoming_call` | `setIncomingCall(data)` | `callStore` |
| `call_accepted` | `setCallId(callId)` + `callAccepted()` | `callStore` |
| `call_ringing` | `callRinging()` | `callStore` |
| `call_ended` / `call_cancelled` / `call_declined` / `call_no_answer` / `call_rejected` / `call_missed` | `resetCall()` | `callStore` |
| `new_message` | `addMessage(convId, msg)` + `updateLastMessage(convId, msg)` | `messageStore` + `conversationStore` |
| `user_typing` | `setTypingUser(convId, user)` + set timeout 3s → `removeTypingUser()` | `messageStore` |
| `user_stop_typing` | `removeTypingUser(convId, userId)` + clear timeout | `messageStore` |
| `message_recalled` | `recallMessage(convId, msgId)` | `messageStore` |
| `message_seen` | (no-op, chỉ console.log) | - |
| `conversation_updated` | (no-op, chỉ console.log) | - |
| `user_online` | `updateUserOnlineStatus(userId, true)` | `conversationStore` |
| `user_connected` | `updateUserOnlineStatus(userId, true)` + `setUserOnline(true)` nếu self | `conversationStore` + `authStore` |
| `user_offline` | `updateUserOnlineStatus(userId, false)` + `setUserOnline(false)` nếu self | `conversationStore` + `authStore` |
| `conversation_created` | `addConversation(conv)` | `conversationStore` |
| `message_status` / `message_sent` / `message_updated` / `joined_conversation` / `left_conversation` | (no-op, chỉ console.log) | - |

**Lifecycle của SocketContext:**

```
1. App mount → AuthContext kiểm tra auth
2. AuthContext set isAuthenticated = true
3. SocketContext useEffect [isAuthenticated, user] nhận thấy thay đổi
   → if isAuthenticated && user → socketService.connect()
   → else → socketService.disconnect()
4. Socket connected → pending listeners được flush (đăng ký ở bước 5)
5. useEffect đăng ký tất cả socket listeners (chỉ chạy khi isAuthenticated && user)
   → Các listener đợi event từ backend
6. Khi logout → isAuthenticated = false → useEffect trigger → disconnect()
7. Cleanup: unregister tất cả listeners + clear typing timers
```

**Phụ thuộc:** `socketService`, `authStore`, `messageStore`, `conversationStore`, `callStore`

**Ai dùng:** `ChatContext` (lấy `stopTyping`, `markSeen`), các component cần `joinConversation`/`leaveConversation`

**Lưu ý quan trọng:**
- SocketContext KHÔNG expose `acceptCall` / `declineCall` / `initiateCall` / `endCall`. Các action này được gọi trực tiếp qua `socketService` hoặc qua `ChatContext` (`acceptCall`, `declineCall`)
- Các socket events liên quan đến call (`incoming_call`, `call_accepted`, etc.) được tự động xử lý bên trong SocketContext, KHÔNG cần component gọi

---

### ChatContext - Business logic cho chat (gửi tin nhắn, xóa, thu hồi, call)

**Đặt trong App tree:** Trong `MainLayout` (`<MainLayout><ChatProvider>...</ChatProvider></MainLayout>`)

**State mà nó KHÔNG expose** - ChatContext KHÔNG manage state trực tiếp. Nó gọi store actions để update state.

**Actions mà nó cung cấp:**
```
sendMessage(conversationId, content, type, replyToId)
    → stopTyping(id)          (SocketContext)
    → messageApi.sendMessage(id, { content, type, replyToId })
    → messageStore.addMessage(id, message)
    → conversationStore.updateLastMessage(id, message)

sendTextMessage(conversationId, content, type, replyToId)
    → Giống sendMessage (cùng logic)

sendFileMessage(conversationId, file, content, replyToId)
    → messageApi.sendFileMessage(id, file, content, replyToId)
    → messageStore.addMessage(id, message)
    → conversationStore.updateLastMessage(id, message)

markAsRead(conversationId, messageId)
    → messageApi.markAsRead(id, msgId)    (HTTP)
    → SocketContext.markSeen(id, msgId)   (WebSocket emit)

deleteMessage(conversationId, messageId)
    → messageApi.deleteMessage(msgId)     (HTTP)
    → messageStore.deleteMessage(id, msgId)

recallMessage(conversationId, messageId)
    → messageApi.recallMessage(msgId)     (HTTP)
    → messageStore.recallMessage(id, msgId)   (Backend broadcast 'message_recalled'
                                               → SocketContext nhận → gọi recallMessage)

acceptCall(callId)
    → socketService.acceptCall(callId)    (WebSocket emit)

declineCall(callId)
    → socketService.declineCall(callId)  (WebSocket emit)
```

**Phụ thuộc:** `SocketContext` (lấy `stopTyping`, `markSeen`), `messageStore`, `conversationStore`, `socketService`, `messageApi`

**Ai dùng:** `ConversationPage` (gọi `sendTextMessage`, `sendFileMessage`, `markAsRead`, `deleteMessage`, `recallMessage`), các component cần call actions

**Lưu ý quan trọng:**
- ChatContext là "middleware" giữa component và store/services
- Nó KHÔNG expose state, chỉ expose actions
- Các actions đều là `async` - có thể `await` để biết kết quả
- `recallMessage` qua ChatContext chỉ gọi HTTP, backend broadcast sẽ tự động gọi `recallMessage` ở messageStore (qua SocketContext)
- `acceptCall` và `declineCall` KHÔNG thông qua ChatContext mà được gọi từ `IncomingCallModal` → `CallModalHandler` → `socketService`

---

### Tổng hợp: Ai gọi ai trong 1 flow gửi tin nhắn

```
Component (ConversationPage)
    └─► ChatContext.sendTextMessage()
            ├─► SocketContext.stopTyping()          → emit 'typing_stop'
            ├─► messageApi.sendMessage()            → HTTP POST
            ├─► messageStore.addMessage()          → update local state
            └─► conversationStore.updateLastMessage() → update sidebar

Backend broadcast 'new_message'
    └─► SocketContext.handleNewMessage()            (tự động, không cần trigger)
            ├─► messageStore.addMessage()          → cho user khác
            └─► conversationStore.updateLastMessage() → cho user khác
```

---

### Tổng hợp: Ai gọi ai trong 1 flow cuộc gọi (caller side)

```
Component (ConversationPage)
    └─► callStore.initiateCall()
            ├─► set callState = 'calling'
            └─► socketService.initiateCall()       → emit 'call_initiate'

Backend emit 'call_accepted'
    └─► SocketContext.handleCallAccepted()          (tự động)
            ├─► callStore.setCallId()
            └─► callStore.callAccepted()           → set callState = 'connected'

IncomingCallModal (Callee side)
    └─► CallModalHandler.handleAccept()
            ├─► callStore.setIncomingCall(null)     → ẩn modal
            ├─► callStore.callAccepted()            → set callState = 'connected'
            ├─► socketService.acceptCall()          → emit 'call_accept'
            └─► webrtcService.createPeerAsCallee() → WebRTC signaling
```

---

### Tổng hợp: Ai gọi ai trong 1 flow thu hồi tin nhắn

```
Component (ConversationPage)
    └─► ChatContext.recallMessage()
            ├─► messageApi.recallMessage()          → HTTP DELETE
            └─► messageStore.recallMessage()        → xóa khỏi local store

Backend broadcast 'message_recalled'
    └─► SocketContext.handleMessageRecalled()       (tự động)
            └─► messageStore.recallMessage()        → xóa ở tất cả user khác
```

---

### Quy tắc phối hợp giữa 3 Contexts

```
┌─────────────────────────────────────────────────────────────────┐
│                        AuthContext                               │
│  - Quản lý: user, isAuthenticated, isSessionExpired            │
│  - Tự động chạy checkAuth khi mount (trừ auth pages)           │
│  - Tự động refresh token trước khi hết hạn                     │
│  - Trigger SocketContext connect/disconnect                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ isAuthenticated = true
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SocketContext                              │
│  - Tự động connect khi isAuthenticated = true                   │
│  - Tự động disconnect khi isAuthenticated = false               │
│  - Tự động xử lý tất cả incoming socket events                  │
│  - Cung cấp: joinConversation, leaveConversation, markSeen      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (emit events, receive events)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ChatContext                               │
│  - Gửi HTTP requests (messageApi)                               │
│  - Emit typing_stop trước khi gửi tin nhắn                       │
│  - Update local stores (messageStore, conversationStore)           │
│  - KHÔNG tự động xử lý gì cả - chỉ khi component gọi           │
│  - KHÔNG connect/disconnect socket                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (call store actions)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Stores                                  │
│  - authStore: user, tokens, isAuthenticated                     │
│  - conversationStore: conversations[], activeConversation        │
│  - messageStore: messagesByConversation{}, typingUsers{}         │
│  - callStore: callState, streams, callId                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (subscribe)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Components                                 │
│  - useAuthStore() → đọc user, isAuthenticated                   │
│  - useConversationStore() → đọc conversations, activeConversation│
│  - useMessageStore() → đọc messages, typingUsers                │
│  - useCallStore() → đọc callState, streams                      │
│  - useChatContext() → gọi actions (send, delete, recall)         │
│  - useSocketContext() → gọi actions (join, leave, markSeen)      │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5.1. Tính năng: ĐĂNG NHẬP / ĐĂNG KÝ

---

#### Đăng nhập (Login)

**HTTP:** `POST /api/auth/login`
**WebSocket:** CÓ - socket connect ngay sau khi login thành công

```
───────────────────────────────────────────────────────────────────────────
Bước 1: User nhập email/password → bấm Đăng nhập
───────────────────────────────────────────────────────────────────────────
Component  → Login.jsx
Context    → useAuthContext.login(email, password)
Store      → KHÔNG gọi store trực tiếp

───────────────────────────────────────────────────────────────────────────
Bước 2: AuthContext xử lý login
───────────────────────────────────────────────────────────────────────────
AuthContext → login wrapper → authStore.login({ email, password })
Store       → authStore (set isLoading: true, error: null)

───────────────────────────────────────────────────────────────────────────
Bước 3: authStore gọi HTTP
───────────────────────────────────────────────────────────────────────────
authStore   → authApi.login({ email, password })
             → POST /api/auth/login
Store       → authStore (set isLoading: true)
Backend     → Xác thực credentials → trả về { user, accessToken, refreshToken }

───────────────────────────────────────────────────────────────────────────
Bước 4: authStore lưu tokens & cập nhật state
───────────────────────────────────────────────────────────────────────────
authStore:
  storage.set('ACCESS_TOKEN', accessToken)
  storage.set('REFRESH_TOKEN', refreshToken)
  storage.setObject('USER', user)
  set({ user, isAuthenticated: true, isLoading: false })

Store bị thay đổi:
  authStore.user              = user object mới
  authStore.isAuthenticated   = true
  authStore.isLoading         = false
  authStore.error             = null

───────────────────────────────────────────────────────────────────────────
Bước 5: Navigate đến /chat
───────────────────────────────────────────────────────────────────────────
Login.jsx   → navigate(ROUTES.CHAT)
Router      → Renders MainLayout
  → AuthProvider (isAuthenticated = true → vẫn giữ nguyên)
  → SocketProvider (useEffect [isAuthenticated, user] → trigger connect)
  → ChatProvider
  → Sidebar → fetchConversations() (tự động mount)

───────────────────────────────────────────────────────────────────────────
Bước 6: WebSocket KẾT NỐI ← ĐÂY LÀ WEBSOCKET KHỞI ĐỘNG
───────────────────────────────────────────────────────────────────────────
Trigger:    SocketContext useEffect [isAuthenticated, user] nhận thấy thay đổi
            → isAuthenticated = true, user có giá trị

SocketContext → socketService.connect()
  → io(SOCKET_URL, { auth: { token: ACCESS_TOKEN } })
  → WebSocket handshake với backend

Backend xử lý:
  1. Xác thực JWT token trong handshake
  2. Lưu userId ↔ socket.id vào Map (online users tracking)
  3. Broadcast đến TẤT CẢ connected clients:
     → io.emit('user_connected', { userId, isOnline: true })

Socket 'connect' event fire → pending listeners được flush
  (Các listener đã đăng ký ở useEffect sẵn sàng nhận events)

Store bị thay đổi:
  authStore KHÔNG thay đổi (isAuthenticated đã true ở bước 4)

───────────────────────────────────────────────────────────────────────────
Bước 7: Sidebar load conversations (side-effect của mount)
───────────────────────────────────────────────────────────────────────────
Sidebar mount → ChatLayout mount → fetchConversations()

conversationStore → conversationApi.getConversations()
  → GET /api/conversations
  → Backend trả về [Conversation, ...]
  → conversationStore.conversations = [...]
  → conversationStore.isLoading = false

Store bị thay đổi:
  conversationStore.conversations  = [danh sách conv]
  conversationStore.isLoading      = false
```

**Bảng tổng hợp Context/Store tham gia trong Đăng nhập:**

| Bước | Context | Store | Action | Event/WebSocket |
|------|---------|-------|--------|-----------------|
| 1 | Login.jsx | - | Nhận input, gọi context | - |
| 2 | AuthContext | authStore | login wrapper | - |
| 3 | authStore | - | authApi.login() | HTTP POST |
| 4 | authStore | authStore | set tokens, set state | - |
| 5 | Login.jsx | - | navigate('/chat') | - |
| 6 | SocketContext | - | socketService.connect() | WebSocket connect + `user_connected` |
| 7 | Sidebar | conversationStore | fetchConversations() | HTTP GET |

**WebSocket emit trong feature Đăng nhập:**
- **Không emit gì** từ client. Chỉ có `socketService.connect()` khởi tạo kết nối.

**WebSocket nhận về sau khi login:**
- `user_connected` - Backend broadcast đến các user khác thông báo user online
- Xử lý: `SocketContext.handleUserConnected` → `conversationStore.updateUserOnlineStatus()` → avatar hiện chấm xanh

---

#### Đăng ký (Register)

**HTTP:** `POST /api/auth/register`
**WebSocket:** KHÔNG có WebSocket trong flow đăng ký

```
Bước 1: User nhập form → bấm Đăng ký
  └─► Register.jsx → useAuthContext.register(...)
  └─► authApi.register() → POST /api/auth/register
  └─► Backend tạo user, KHÔNG trả tokens
  └─► Backend trả về: { user }
  └─► storage.clear() - KHÔNG lưu gì
  └─► authStore: set({ user: null, isAuthenticated: false })
  └─► Navigate đến /chat
      → Router → AuthContext checkAuth() → thấy không có token
      → isAuthenticated: false → redirect /login
```

**WebSocket emit trong feature Đăng ký:**
- **Không có** - user chưa authenticated, socket chưa connect

---

#### Google OAuth

**HTTP:** Redirect flow (backend xử lý)
**WebSocket:** CÓ - sau khi callback nhận tokens

```
Bước 1: Bấm "Đăng nhập Google"
  └─► googleAuthApi.login()
  └─► window.location.href = BACKEND_URL/api/auth/google
  └─► Browser redirect → Google → backend → /auth/callback

Bước 2: AuthCallback page mount
  └─► Parse tokens từ URL query params
  └─► authStore.setAuth(accessToken, refreshToken, user)
  └─► Lưu tokens → localStorage
  └─► isAuthenticated: true

Bước 3: Tương tự login - WebSocket connect (xem Bước 6 ở trên)
  └─► socketService.connect()
  └─► Backend broadcast 'user_connected'
```

---

#### Đăng xuất (Logout)

**HTTP:** `POST /api/auth/logout`
**WebSocket:** CÓ - socket disconnect ngay

```
Bước 1: Bấm Đăng xuất (Header dropdown)
  └─► useAuthContext.logout() → useAuthStore.logout()

Bước 2: Gọi API đăng xuất
  └─► authApi.logout() → POST /api/auth/logout
  └─► Backend: revoke token, xóa session

Bước 3: Xóa localStorage
  └─► storage.clear()

Bước 4: isAuthenticated: false
  └─► authStore: set({ user: null, isAuthenticated: false })

Bước 5: Navigate đến /login

Bước 6: WebSocket NGẮT KẾT NỐI
  └─► AuthContext detect isAuthenticated: false
  └─► SocketContext useEffect [isAuthenticated] → chạy
  └─► socketService.disconnect()
      → socket.disconnect()
      → Backend nhận disconnect event
      → Backend emit broadcast:
          io.emit('user_offline', { userId: <id> })
          → Tất cả client khác nhận → cập nhật status offline
```

**WebSocket emit trong feature Đăng xuất:**
- **Không emit gì trực tiếp** từ client. Việc thông báo offline do backend tự động broadcast khi socket disconnect.

---

### 5.2. Tính năng: CHAT NHẮN TIN

---

#### Mở cuộc trò chuyện (ConversationPage mount)

**HTTP:** `GET /api/conversations/:id/messages` + `POST /messages/read`
**WebSocket:** CÓ - join room + mark seen

```
Bước 1: Click ConversationItem trong Sidebar
  └─► navigate(`/chat/${conv.id}`)
  └─► Router mount ConversationPage

Bước 2: useEffect([id]) chạy khi conversationId thay đổi

Bước 2a: Gọi API lấy tin nhắn
  └─► messageApi.getMessages(convId) → GET /api/conversations/:id/messages
  └─► Backend trả về: [Message, Message, ...] (mới nhất trước)
  └─► messageStore: messagesByConversation[convId] = [...]

Bước 2b: Set active conversation
  └─► conversationStore.setActiveConversation(conversation)
  └─► conversationStore.resetUnreadCount(convId) → unreadCount = 0

Bước 2c: WEBSOCKET JOIN ROOM
  └─► SocketContext.joinConversation(convId)
  └─► socketService.joinConversation(convId)
  └─► emit('join_conversation', { conversationId: convId })
  └─► Backend nhận event → thêm socket vào room `conv:${convId}`

Bước 2d: WEBSOCKET MARK SEEN
  └─► markAsRead(convId) → ChatContext
      ├─► messageApi.markAsRead(convId, latestMsgId) → POST /messages/read
      └─► useSocketContext.markSeen(convId, latestMsgId)
          └─► emit('mark_seen', { conversationId, messageId })

Cleanup (khi unmount hoặc chuyển conversation khác):
  └─► useEffect cleanup → leaveConversation(convId)
  └─► socketService.leaveConversation(convId)
  └─► emit('leave_conversation', { conversationId })
```

**WebSocket emit khi mở cuộc trò chuyện:**

| Event | Payload | Gửi khi nào |
|-------|---------|-------------|
| `join_conversation` | `{ conversationId }` | Ngay khi mount ConversationPage |
| `mark_seen` | `{ conversationId, messageId }` | Ngay khi mount |

---

#### Gửi tin nhắn text

**HTTP:** `POST /api/conversations/:id/messages`
**WebSocket:** CÓ - typing stop + real-time cho người khác

```
Bước 1: User nhập text → bấm Enter
  └─► ChatInput.handleSend()
  └─► onSendMessage(message, 'text', replyToId)

Bước 2: ConversationPage.handleSendMessage()
  └─► ChatContext.sendTextMessage(id, content, 'text', replyToId)

Bước 3: ChatContext.sendTextMessage():
  └─► stopTyping(convId) → useSocketContext.stopTyping()
      └─► emit('typing_stop', { conversationId })

  └─► messageApi.sendMessage(convId, { content, type: 'text', replyToId })
      └─► POST /api/conversations/:id/messages
      └─► Backend: lưu DB + broadcast 'new_message' (TRỪ sender)

  └─► messageStore.addMessage(convId, message)
  └─► conversationStore.updateLastMessage(convId, message)
```

**WebSocket nhận khi gửi tin nhắn:**

| Event | Nhận bởi | Xử lý gì |
|-------|-----------|-----------|
| `user_stop_typing` | A và các user khác | messageStore.removeTypingUser() → xóa typing indicator |
| `new_message` | Các user B, C, D (không phải A) | messageStore.addMessage() + conversationStore.updateLastMessage() |

---

#### Typing Indicator

```
User A bắt đầu gõ:
  └─► ChatInput onKeyDown → useSocketContext.startTyping(convId)
      └─► emit('typing_start', { conversationId, username })

User B nhận 'user_typing':
  └─► SocketContext.handleUserTyping → messageStore.setTypingUser()
      └─► TypingIndicator hiện "A đang gõ..."
      └─► setTimeout 3000ms → removeTypingUser()

User A dừng gõ:
  └─► Auto timeout → removeTypingUser()
  └─► HOẶC: gửi tin nhắn → ChatContext.stopTyping() → emit('typing_stop')
      └─► User B nhận 'user_stop_typing' → removeTypingUser() ngay
```

---

#### Thu hồi tin nhắn (Recall)

**HTTP:** `POST /api/messages/:id/recall`
**WebSocket:** CÓ - thông báo cho người khác

```
Bước 1: Click message → chọn "Thu hồi"
  └─► ConversationPage.handleRecall(message)
  └─► ChatContext.recallMessage(convId, msgId)

Bước 2: ChatContext.recallMessage():
  └─► messageApi.recallMessage(msgId) → HTTP DELETE
      └─► Backend: hard delete + broadcast 'message_recalled'
  └─► messageStore.recallMessage(convId, msgId) → xóa local

User khác nhận 'message_recalled':
  └─► SocketContext.handleMessageRecalled → messageStore.recallMessage()
```

---

#### Xóa tin nhắn (Soft Delete)

**HTTP:** `DELETE /api/messages/:id`
**WebSocket:** KHÔNG có WebSocket

```
Bước 1: Click message → chọn "Xóa"
  └─► ConversationPage.handleDelete(message)
  └─► ChatContext.deleteMessage(convId, msgId)

Bước 2: ChatContext.deleteMessage():
  └─► messageApi.deleteMessage(msgId) → DELETE /messages/:id
      └─► Backend: set isDeleted = true, content = null
  └─► messageStore.deleteMessage(convId, msgId)
      └─► ChatBubble hiện "Tin nhắn đã bị xóa"
  └─► KHÔNG broadcast WebSocket → người khác KHÔNG thấy
```

---

### 5.3. Tính năng: CUỘC GỌI THOẠI/VIDEO

---

#### Gọi ra (Outgoing Call)

**HTTP:** KHÔNG có HTTP
**WebSocket:** CÓ - call_initiate

```
Bước 1: Click icon điện thoại/video
  └─► ConversationPage.handleCall() / handleVideoCall()

Bước 2: Kiểm tra active call
  └─► useCallStore.hasActiveCall() → ngăn double-call

Bước 3: webrtcService.initLocalStream(type, hasVideo)
  └─► navigator.mediaDevices.getUserMedia()
  └─► callStore.setLocalStream(localStream)

Bước 4: callStore.initiateCall() + socketService.initiateCall()
  └─► emit('call_initiate', { callId, conversationId, calleeId, type })
  └─► Backend emit 'incoming_call' đến callee

Bước 5: Callee nhận → IncomingCallModal hiện

Bước 6: Kết quả:
  ├─ Accept: Backend emit 'call_accepted' → A nhận → WebRTC connected
  ├─ Decline: Backend emit 'call_declined' → A nhận → resetCall()
  └─ Timeout: Backend emit 'call_no_answer' → A nhận → resetCall()
```

---

#### Nghe cuộc gọi đến (Incoming Call)

**HTTP:** KHÔNG có HTTP
**WebSocket:** CÓ - nhận incoming_call + WebRTC signaling

```
Bước 1: Backend emit 'incoming_call' đến callee
  └─► SocketContext.handleIncomingCall
      └─► callStore.setIncomingCall(data) → hiện IncomingCallModal
      └─► socketService.joinCallRoom(callId)

Bước 2: Callee bấm Accept / Decline / Timeout

  ├─ Accept:
  │   └─► CallModalHandler.handleAccept()
  │       ├─► webrtcService.initLocalStream()
  │       ├─► webrtcService.createPeerAsCallee()
  │       ├─► callStore.callAccepted()
  │       └─► socketService.acceptCall(callId)
  │           └─► emit('call_accept', { callId })
  │       └─► WebRTC signaling: offer → answer → ICE candidates
  │
  ├─ Decline:
  │   └─► webrtcService.cleanup()
  │   └─► socketService.declineCall(callId) → emit('call_decline')
  │   └─► callStore.resetCall()
  │
  └─ Timeout 30s:
      └─► webrtcService.cleanup()
      └─► socketService.missCall(callId) → emit('call_missed')
      └─► Backend emit 'call_missed_notify' → Caller
      └─► callStore.resetCall()
```

---

### 5.4. Tính năng: GHIM TÀI LIỆU (Pinned Documents)

**HTTP:** `GET/POST/DELETE /api/conversations/:id/pinned`
**WebSocket:** KHÔNG có WebSocket

```
Ghím message:
  └─► ConversationPage.handlePin(message)
  └─► pinnedApi.pinDocument(convId, { messageId }) → POST
  └─► Update local state

Xem danh sách ghim:
  └─► ConversationPage.loadPinnedDocuments()
  └─► pinnedApi.getPinnedDocuments(convId) → GET
  └─► Backend trả về [PinnedDocument, ...]

Bỏ ghim:
  └─► pinnedApi.unpinDocument(convId, pinnedId) → DELETE
```

---

### 5.5. Tính năng: TẠO CUỘC TRÒ CHUYỆN MỚI

**HTTP:** `POST /api/conversations` + `GET /api/users`
**WebSocket:** CÓ - conversation_created cho người khác

```
Tạo direct conversation:
  └─► NewConversationPage.handleStartDirectChat(targetUser)
  └─► conversationApi.createConversation({ type: 'direct', targetUserId }) → POST
  └─► Backend: tạo conv + broadcast 'conversation_created' đến targetUser
  └─► conversationStore.addConversation(conv)
  └─► Navigate `/chat/${conv.id}`

User kia nhận 'conversation_created':
  └─► SocketContext.handleConversationCreated → conversationStore.addConversation()
      └─► Sidebar tự cập nhật

Tìm kiếm user:
  └─► userApi.searchUsers(query) → GET /api/users?search=...
  └─► Backend query users LIKE %query%
  └─► KHÔNG có WebSocket → chỉ HTTP search
```

---

### 5.6. Tính năng: CÀI ĐẶT (Settings)

**HTTP:** Tùy tab
**WebSocket:** KHÔNG có WebSocket

```
Profile Tab:
  └─► PUT /api/auth/me → Cập nhật profile
  └─► POST /api/upload/avatar → Upload avatar

Password Tab:
  └─► POST /api/auth/change-password → Đổi password

Sessions Tab:
  └─► GET /api/auth/sessions → Danh sách phiên
  └─► DELETE /api/auth/sessions/:id → Thu hồi 1 phiên
  └─► POST /api/auth/sessions/revoke-all → Thu hồi tất cả

Notifications Tab:
  └─► Chỉ local state (settingsStore.notificationSettings)
  └─► KHÔNG gọi API
```

---

### 5.7. Tính năng: QUẢN TRỊ (Admin Dashboard)

**HTTP:** `GET/POST/PATCH/DELETE /api/admin/*`
**WebSocket:** KHÔNG có WebSocket

```
Dashboard Stats: GET /api/admin/stats
User List: GET /api/admin/users?page=&search=&role=&status=
User Actions:
  └─► PATCH /api/admin/users/:id/role → Đổi vai trò
  └─► PATCH /api/admin/users/:id/status → Bật/tắt tài khoản
  └─► DELETE /api/admin/users/:id → Xóa tài khoản
```

---

### 5.8. Tính năng: LỊCH SỬ CUỘC GỌI

**HTTP:** `GET /api/calls/history`
**WebSocket:** KHÔNG có WebSocket

```
Load call history:
  └─► callApi.getCallHistory({ page, limit, filter }) → GET /api/calls/history
  └─► Backend query calls từ DB
  └─► Trả về [Call, ...] (mới nhất trước)

Filter: all / answered / missed → params.filter

Gọi lại:
  └─► Click call item → navigate(`/chat/new?callUserId=${otherUserId}`)
  └─► User bấm icon phone → handleCall() → WebRTC flow
```

---

### 5.9. Tính năng: THAY ĐỔI TRẠNG THÁI ONLINE/OFFLINE

**HTTP:** KHÔNG có HTTP
**WebSocket:** CÓ

```
Khi user đăng nhập (socket connect):
  └─► Backend: lưu userId ↔ socket.id
  └─► Backend broadcast: 'user_online', 'user_connected'
  └─► Tất cả client nhận → conversationStore.updateUserOnlineStatus()

Khi user đăng xuất (socket disconnect):
  └─► Backend: xóa userId ↔ socket.id
  └─► Backend broadcast: 'user_offline'
  └─► Tất cả client nhận → conversationStore.updateUserOnlineStatus()

Online status hiển thị ở:
  └─► Sidebar: ConversationItem avatar có chấm xanh
  └─► NewConversationPage: Search results avatar
  └─► Header: User avatar trong dropdown
  └─► Profile: Avatar badge
```

---

## 6. Sơ Đồ Data Flow Tổng Hợp

### 6.1. Auth Flow

```
Login → AuthContext → authStore.login() → authApi.login()
  → set tokens → navigate('/chat')
  → SocketContext.connect() ← isAuthenticated = true
  → Backend broadcast 'user_connected'

PrivateRoute → AuthContext.checkAuth()
  ├─ Có token + chưa hết hạn → getCurrentUser()
  ├─ Có token + HẾT HẠN → refreshSession()
  │   ├─ Refresh OK → getCurrentUser()
  │   └─ Refresh FAIL → SessionExpiredModal → redirect /login
  └─ Không có token → redirect /login
```

### 6.2. Real-time Message Flow

```
User A gửi tin nhắn                      User B nhận tin nhắn
───────────────────                       ──────────────────────
ChatInput.handleSend()                    Socket Event: new_message
  → messageApi.sendMessage()  ──HTTP──►   Backend lưu DB
  ──Response: Message◄────────           Socket.emit('new_message')
  → addMessage() ──────────────────►    User B SocketContext
  → updateLastMessage()                       → addMessage()
                                              → updateLastMessage()
                                              → MessageList re-render
```

### 6.3. Call Flow

```
Caller                                                 Callee
──────                                                 ──────
webrtcService.initLocalStream()                         → MediaDevices.getUserMedia
→ setLocalStream()                                      → setLocalStream()
useCallStore.initiateCall({ calleeId })           socketService.initiateCall({ callId, calleeId }) ────►  Backend
Socket.emit('incoming_call') ◄────────────────────────  Backend emit('incoming_call')
CallOverlay (đang gọi) ◄─────────────────────────        IncomingCallModal
                                                          webrtcService.initLocalStream()
                                                          socketService.acceptCall()  ◄──────────  Backend → Socket.emit('call_accepted')
                                                          webrtcService.createPeerAsCallee()
                                                          → peer.signal(offer)
CallOverlay (đã kết nối) ◄───────────────────────        socket.emit('call_offer_received')
socketService.onCallOfferReceived                      → peer.signal(offer)
→ peer.on('connect')                                   → peer.on('connect')
→ setRemoteStream() ◄───────────────────────────────────  setRemoteStream()
```

### 6.4. Route Structure

```
BrowserRouter
├── NOT Authenticated:
│   ├── /login         → Login.jsx
│   ├── /register      → Register.jsx
│   ├── /forgot-password → ForgotPassword.jsx
│   ├── /reset-password   → ResetPassword.jsx
│   └── /auth/callback    → AuthCallback.jsx
│
└── Authenticated:
    ├── PrivateRoute (bảo vệ)
    │   └── MainLayout (Header + Sidebar + Outlet)
    │       ├── /chat              → ChatLayout.jsx
    │       ├── /chat/new         → NewConversationPage.jsx
    │       ├── /chat/:id         → ConversationPage.jsx
    │       ├── /settings         → SettingsPage.jsx
    │       └── /call-history     → CallHistoryPage.jsx
    │
    └── AdminRoute (role=admin)
        └── /admin → AdminDashboard.jsx

CallModalHandler (ROOT LEVEL - luôn mount)
└── Hiện IncomingCallModal khi có cuộc gọi đến
└── Hiện CallOverlay khi có cuộc gọi đang diễn ra
```

---

## 7. API Endpoints Summary

### Auth (`/api/auth/*`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/auth/register` | Đăng ký user mới |
| POST | `/auth/login` | Đăng nhập |
| POST | `/auth/logout` | Đăng xuất |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Lấy thông tin user hiện tại |
| PUT | `/auth/me` | Cập nhật profile |
| POST | `/auth/change-password` | Đổi mật khẩu |
| POST | `/auth/forgot-password` | Quên mật khẩu |
| POST | `/auth/reset-password` | Reset mật khẩu |
| POST | `/auth/verify-email` | Xác thực email |
| GET | `/auth/sessions` | Lấy danh sách phiên |
| DELETE | `/auth/sessions/:id` | Thu hồi 1 phiên |
| POST | `/auth/sessions/revoke-all` | Thu hồi tất cả phiên |

### Conversations (`/api/conversations/*`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/conversations` | Lấy danh sách cuộc trò chuyện |
| GET | `/conversations/:id` | Lấy 1 cuộc trò chuyện |
| POST | `/conversations` | Tạo cuộc trò chuyện mới |
| PUT | `/conversations/:id` | Cập nhật cuộc trò chuyện |
| DELETE | `/conversations/:id` | Xóa cuộc trò chuyện |
| POST | `/conversations/:id/archive` | Lưu trữ |
| POST | `/conversations/:id/unarchive` | Bỏ lưu trữ |
| POST | `/conversations/:id/pin` | Ghim |
| POST | `/conversations/:id/unpin` | Bỏ ghim |
| POST | `/conversations/:id/mute` | Tắt thông báo |
| POST | `/conversations/:id/unmute` | Bật thông báo |
| GET | `/conversations/:id/members` | Lấy thành viên |
| POST | `/conversations/:id/members` | Thêm thành viên |
| DELETE | `/conversations/:id/members/:userId` | Xóa thành viên |
| PUT | `/conversations/:id/members/:userId` | Cập nhật vai trò |
| POST | `/conversations/:id/leave` | Rời nhóm |
| GET | `/conversations/:id/messages` | Lấy tin nhắn |
| POST | `/conversations/:id/messages` | Gửi tin nhắn |
| POST | `/conversations/:id/messages/file` | Gửi file |
| GET | `/conversations/:id/pinned` | Lấy docs ghim |
| POST | `/conversations/:id/pinned` | Ghim document |
| DELETE | `/conversations/:id/pinned/:pinnedId` | Bỏ ghim |
| GET | `/conversations/:id/messages/search` | Tìm kiếm tin nhắn |

### Messages (`/api/messages/*`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| PUT | `/messages/:id` | Cập nhật tin nhắn |
| DELETE | `/messages/:id` | Xóa tin nhắn |
| POST | `/messages/:id/recall` | Thu hồi tin nhắn |
| POST | `/messages/read` | Đánh dấu đã đọc |
| GET | `/messages/:id/status` | Lấy trạng thái tin nhắn |

### Calls (`/api/calls/*`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/calls/history` | Lịch sử cuộc gọi |
| GET | `/calls/:id` | Chi tiết cuộc gọi |

### Admin (`/api/admin/*`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/admin/users` | Danh sách user (có phân trang) |
| GET | `/admin/users/:id` | Chi tiết user |
| PATCH | `/admin/users/:id/role` | Đổi vai trò |
| PATCH | `/admin/users/:id/status` | Bật/tắt tài khoản |
| DELETE | `/admin/users/:id` | Xóa user |
| GET | `/admin/stats` | Thống kê hệ thống |

### Users (`/api/users/*`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/users` | Tìm kiếm user |
| GET | `/users/profile` | Profile user hiện tại |
| PUT | `/users/profile` | Cập nhật profile |
| GET | `/users/:id` | Lấy user theo ID |

### Upload (`/api/upload/*`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/upload` | Upload file |
| POST | `/upload/avatar` | Upload avatar |

### Pinned (`/api/pinned/*`)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| PUT | `/pinned/:id` | Cập nhật pinned document |
| PUT | `/conversations/:id/pinned/reorder` | Sắp xếp lại pinned docs |

---

## 8. Socket Events Reference

### Client → Server (Emit)

| Event | Payload | Mô tả |
|-------|---------|--------|
| `join_conversation` | `{ conversationId }` | Tham gia room chat |
| `leave_conversation` | `{ conversationId }` | Rời room chat |
| `send_message` | `{ ...data }` | Gửi tin nhắn realtime |
| `typing_start` | `{ conversationId, username }` | Bắt đầu gõ |
| `typing_stop` | `{ conversationId }` | Dừng gõ |
| `mark_seen` | `{ conversationId, messageId }` | Đánh dấu đã đọc |
| `mark_delivered` | `{ conversationId, messageId }` | Đánh dấu đã giao |
| `call_initiate` | `{ callId, conversationId, calleeId, type }` | Bắt đầu cuộc gọi |
| `call_accept` | `{ callId }` | Chấp nhận cuộc gọi |
| `call_decline` | `{ callId }` | Từ chối cuộc gọi |
| `call_end` | `{ callId }` | Kết thúc cuộc gọi |
| `call_missed` | `{ callId }` | Đánh dấu cuộc gọi nhỡ |
| `call_offer` | `{ callId, offer }` | WebRTC offer |
| `call_answer` | `{ callId, answer }` | WebRTC answer |
| `call_ice_candidate` | `{ callId, candidate }` | ICE candidate |
| `join_call_room` | `{ callId }` | Tham gia room cuộc gọi |

### Server → Client (Listen)

| Event | Payload | Mô tả |
|-------|---------|--------|
| `new_message` | `{ message }` | Tin nhắn mới |
| `message_recalled` | `{ conversationId, messageId }` | Tin nhắn bị thu hồi |
| `user_typing` | `{ conversationId, userId, username }` | User đang gõ |
| `user_stop_typing` | `{ conversationId, userId }` | User dừng gõ |
| `message_seen` | `{ ...data }` | Tin nhắn được đọc |
| `conversation_updated` | `{ ...data }` | Cuộc trò chuyện được cập nhật |
| `conversation_created` | `{ conversation }` | Cuộc trò chuyện mới |
| `user_online` | `{ userId }` | User online |
| `user_offline` | `{ userId }` | User offline |
| `user_connected` | `{ userId, isOnline }` | User kết nối |
| `incoming_call` | `{ callId, caller, calleeId, type }` | Có cuộc gọi đến |
| `call_ringing` | `{ callId }` | Đang reo chuông |
| `call_accepted` | `{ callId }` | Cuộc gọi được nhận |
| `call_declined` | `{ callId }` | Cuộc gọi bị từ chối |
| `call_ended` | `{ callId }` | Cuộc gọi kết thúc |
| `call_cancelled` | `{ callId }` | Cuộc gọi bị hủy (người gọi hủy) |
| `call_no_answer` | `{ callId }` | Không ai trả lời |
| `call_rejected` | `{ callId }` | Bị từ chối (offline) |
| `call_missed_notify` | `{ callId }` | Thông báo cuộc gọi nhỡ |
| `call_offer_received` | `{ callId, offer }` | WebRTC offer từ peer |
| `call_answer_received` | `{ callId, answer }` | WebRTC answer từ peer |
| `call_ice_candidate_received` | `{ callId, candidate }` | ICE candidate từ peer |
| `call_error` | `{ ...data }` | Lỗi cuộc gọi |

---

## 10. Cơ Chế Hoạt Động Socket.IO Chi Tiết

Phần này mô tả **chính xác** WebSocket kết nối khi nào, emit event ở đâu, nhận event ở đâu, và cập nhật state ra sao.

### 10.1. Khi nào Socket kết nối & ngắt kết nối?

```
File: src/contexts/SocketContext.jsx (dòng 16-23)
useEffect(() => {
  if (!isAuthenticated || !user) {
    socketService.disconnect()   // Ngắt kết nối khi logout hoặc chưa login
    return
  }
  socketService.connect()         // Kết nối khi isAuthenticated === true
}, [isAuthenticated, user])

→ Khi user login thành công → isAuthenticated: true → connect()
→ Khi user logout → isAuthenticated: false → disconnect()
→ Token được gửi kèm: { auth: { token: ACCESS_TOKEN } }
```

### 10.2. Tất Cả Socket Emit - Trigger & Vị Trí Trong Code

Dưới đây liệt kê **từng socket event** được emit, **file/dòng** phát sinh, **trigger** (hành động gì), và **payload** gửi đi.

#### A. Nhóm Conversation (tham gia/rời cuộc trò chuyện)

| Event | File Gối | Dòng | Trigger | Payload |
|-------|-----------|-------|---------|---------|
| `join_conversation` | `src/contexts/SocketContext.jsx` | 216-218 | Mở conversation page, `useEffect([id])` gọi `joinConversation(id)` | `{ conversationId: string }` |
| `leave_conversation` | `src/contexts/SocketContext.jsx` | 220-222 | Unmount conversation page, `useEffect` cleanup gọi `leaveConversation(id)` | `{ conversationId: string }` |

#### B. Nhóm Tin Nhắn (gửi, typing, đánh dấu)

| Event | File Gối | Dòng | Trigger | Payload |
|-------|-----------|-------|---------|---------|
| `send_message` | `src/contexts/SocketContext.jsx` | 224-226 | `ChatContext.sendMessage()` gọi `socketService.sendMessage(data)` | `{ conversationId, content, type, senderId, ... }` |
| `typing_start` | `src/contexts/SocketContext.jsx` | 228-231 | Gõ phím trong `ChatInput`, `useEffect` onKeyDown gọi `startTyping(convId)` | `{ conversationId: string, username: string }` |
| `typing_stop` | `src/contexts/SocketContext.jsx` | 233-235 | Gửi tin nhắn thành công, `ChatContext.sendTextMessage` gọi `stopTyping(convId)` | `{ conversationId: string }` |
| `mark_seen` | `src/contexts/SocketContext.jsx` | 237-239 | Mở conversation, `ConversationPage` gọi `markAsRead(id)` | `{ conversationId: string, messageId: string }` |
| `mark_delivered` | `src/contexts/SocketContext.jsx` | 241-243 | Khi nhận được `new_message`, gọi `markDelivered(convId, msgId)` | `{ conversationId: string, messageId: string }` |

#### C. Nhóm Cuộc Gọi (WebRTC Signaling)

| Event | File Gối | Dòng | Trigger | Payload |
|-------|-----------|-------|---------|---------|
| `call_initiate` | `src/pages/chat/ConversationPage.jsx` | ~340-345 | Bấm nút gọi thoại/video, `handleCall()` hoặc `handleVideoCall()` | `{ callId, conversationId, calleeId, type }` |
| `call_accept` | `src/routes/index.jsx` | ~161 | Modal handler nhận cuộc gọi đến, bấm **Accept** → `handleAccept()` | `{ callId: string }` |
| `call_decline` | `src/routes/index.jsx` | ~191 | Modal handler bấm **Decline** → `handleDecline()` | `{ callId: string }` |
| `call_end` | `src/components/call/CallOverlay.jsx` | 207-215 | Bấm nút kết thúc cuộc gọi, `handleEndCall()` | `{ callId: string }` |
| `call_missed` | `src/services/socketService.js` | 438-441 | Gọi `socketService.missCall(callId)` khi timeout cuộc gọi nhỡ | `{ callId: string }` |
| `join_call_room` | `src/contexts/SocketContext.jsx` | 34 | Nhận `incoming_call`, `handleIncomingCall()` gọi `joinCallRoom(callId)` | `{ callId: string }` |
| `call_offer` | `src/services/socketService.js` | 478-481 | `webrtcService` phát sinh WebRTC offer, gọi `emitCallOffer(callId, offer)` | `{ callId: string, offer: RTCSessionDescription }` |
| `call_answer` | `src/services/socketService.js` | 489-492 | `webrtcService` phát sinh WebRTC answer, gọi `emitCallAnswer(callId, answer)` | `{ callId: string, answer: RTCSessionDescription }` |
| `call_ice_candidate` | `src/services/socketService.js` | 450-470 | `webrtcService._setupPeerEvents` → `socketService.emitCallSignal()`, tự detect type | `{ callId: string, candidate: RTCIceCandidate }` |

### 10.3. Tất Cả Socket Listener - Vị Trí & State Update

#### A. Nhóm Tin Nhắn (nhận real-time)

| Event | File Lắng Nghe | Handler | State Update |
|-------|---------------|---------|-------------|
| `new_message` | `SocketContext.jsx` | `handleNewMessage` (79-87) | `messageStore.addMessage(convId, msg)` + `conversationStore.updateLastMessage(convId, msg)` |
| `message_recalled` | `SocketContext.jsx` | `handleMessageRecalled` (110-113) | `messageStore.recallMessage(convId, msgId)` - xóa vĩnh viễn |
| `message_seen` | `SocketContext.jsx` | `handleMessageSeen` (108) | **No-op** (rỗng, không làm gì) |
| `message_updated` | `SocketContext.jsx` | `handleMessageUpdated` (150) | **No-op** (chỉ log) |
| `message_sent` | `SocketContext.jsx` | `handleMessageSent` (138) | **No-op** (chỉ log) |
| `user_typing` | `SocketContext.jsx` | `handleUserTyping` (89-96) | `messageStore.setTypingUser(convId, { userId, username })` + auto-remove sau TYPING_TIMEOUT (3000ms) |
| `user_stop_typing` | `SocketContext.jsx` | `handleUserStopTyping` (99-106) | `messageStore.removeTypingUser(convId, userId)` |

#### B. Nhóm Conversation (real-time)

| Event | File Lắng Nghe | Handler | State Update |
|-------|---------------|---------|-------------|
| `conversation_updated` | `SocketContext.jsx` | `handleConversationUpdated` (115) | **No-op** (chỉ log) |
| `conversation_created` | `SocketContext.jsx` | `handleConversationCreated` (154-156) | `conversationStore.addConversation(data.conversation)` |

#### C. Nhóm Online/Offline

| Event | File Lắng Nghe | Handler | State Update |
|-------|---------------|---------|-------------|
| `user_online` | `SocketContext.jsx` | `handleUserOnline` (117-119) | `conversationStore.updateUserOnlineStatus(userId, true)` |
| `user_connected` | `SocketContext.jsx` | `handleUserConnected` (122-126) | `conversationStore.updateUserOnlineStatus(userId, true)` + `authStore.setUserOnline(true)` nếu là chính mình |
| `user_offline` | `SocketContext.jsx` | `handleUserOffline` (128-132) | `conversationStore.updateUserOnlineStatus(userId, false)` + `authStore.setUserOnline(false)` nếu là chính mình |

#### D. Nhóm Cuộc Gọi - Root Level (`src/routes/index.jsx`, CallModalHandler)

| Event | File Lắng Nghe | Handler | State Update |
|-------|---------------|---------|-------------|
| `incoming_call` | `SocketContext.jsx` | `handleIncomingCall` (30-35) | `callStore.setIncomingCall(data)` + `socketService.joinCallRoom(callId)` |
| `call_ringing` | `SocketContext.jsx` | `handleCallRinging` (74-77) | `callStore.callRinging()` → state: RINGING |
| `call_accepted` | `SocketContext.jsx` | `handleCallAccepted` (67-72) | `callStore.setCallId(callId)` + `callStore.callAccepted()` |
| `call_declined` | `SocketContext.jsx` | `handleCallDeclined` (47-50) | `callStore.resetCall()` |
| `call_ended` | `SocketContext.jsx` | `handleCallEnded` (42-45) | `callStore.resetCall()` |
| `call_cancelled` | `SocketContext.jsx` | `handleCallCancelled` (37-40) | `callStore.resetCall()` |
| `call_no_answer` | `SocketContext.jsx` | `handleCallNoAnswer` (52-55) | `callStore.resetCall()` |
| `call_rejected` | `SocketContext.jsx` | `handleCallRejected` (57-60) | `callStore.resetCall()` |
| `call_missed_notify` | `SocketContext.jsx` | `handleCallMissed` (62-65) | `callStore.resetCall()` |
| `call_offer_received` | `routes/index.jsx` | `handleOfferReceived` (223-226) | `webrtcService.peer.signal(data.offer)` |
| `call_answer_received` | `routes/index.jsx` | `handleAnswerReceived` (228-230) | `webrtcService.handleSignal(data.answer)` |
| `call_ice_candidate_received` | `routes/index.jsx` | `handleIceCandidateReceived` (231-233) | `webrtcService.handleSignal(data.candidate)` |

> **Lưu ý quan trọng:** Tất cả call-event listeners chỉ được đăng ký ở **root level (`routes/index.jsx`, CallModalHandler)** và **SocketContext**. `ConversationPage` chỉ emit `call_initiate`, KHÔNG lắng nghe bất kỳ call event nào.

### 10.4. Luồng Socket Đầy Đủ Theo Kịch Bản

#### Kịch bản 1: User mở app → Đăng nhập

```
1. App mount → AuthContext checkAuth()
2. Login thành công → isAuthenticated: true
3. SocketContext useEffect → isAuthenticated === true
4. → socketService.connect() với token
5. → Backend xác thực token, gán socket.id cho user
6. → Socket connected event → flush pending listeners
7. → Backend emit 'user_connected' đến tất cả connected users
8. → Tất cả client nhận 'user_online' → cập nhật online status
```

#### Kịch bản 2: User A mở cuộc trò chuyện với User B

```
1. ConversationPage mount → useEffect([id])
2. → joinConversation(convId) → emit('join_conversation', { conversationId })
3. → Backend thêm socket vào conversation room
4. → fetchMessages(convId) → HTTP → lấy tin nhắn từ DB
5. → markAsRead(convId) → emit('mark_seen', { conversationId, messageId })
6. → Backend gửi 'message_seen' event cho user B
```

#### Kịch bản 3: User A gửi tin nhắn đến User B (real-time)

```
FE A:                                    BE:                              FE B:
─────────────────────────────────       ────────────────────────────────       ──────────────────────────────
ChatInput → ChatContext.sendTextMessage
  → messageApi.sendMessage() ───HTTP──►  Server lưu vào DB
  ←──────── { success: true, data: Message } ◄────────── Response
  → addMessage() — local update
  → stopTyping(convId)
  → emit('typing_stop', { convId })
                                                              emit('send_message', { convId, ... }) ──────────► Server nhận
                                                              emit('new_message', { message })
                                                              → Chỉ gửi đến members trong conv room (không gửi A)
                                                                                                                                        SocketContext.handleNewMessage
                                                                                                                                        → messageStore.addMessage()
                                                                                                                                        → conversationStore.updateLastMessage()
                                                                                                                                        → UI tự re-render
```

#### Kịch bản 4: Cuộc gọi thoại từ A → B

```
FE A (Caller):                           BE:                            FE B (Callee):
─────────────────────────────────       ────────────────────────────────       ──────────────────────────────
handleCall():
  → webrtcService.initLocalStream()
  → callStore.initiateCall()
  → emit('call_initiate', { callId, calleeId, type })  ──────────────────────────────────────────────► Server nhận
                                                              Lưu call vào memory
                                                              emit('incoming_call', { callId, caller, calleeId, type })
                                                                                                                                        SocketContext.handleIncomingCall
                                                                                                                                        → callStore.setIncomingCall()
                                                                                                                                        → IncomingCallModal hiện lên
B bấm Accept:
  → handleAccept():
  → webrtcService.initLocalStream()
  → webrtcService.createPeerAsCallee(stream, callId)
  → peer.on('signal') → emit('call_offer', { callId, offer })  ──────────────────────────────────────► Server nhận
                                                              emit('call_accepted', { callId }) → A nhận
                                                              emit('call_offer_received', { callId, offer }) → B nhận
A nhận call_accepted:
  → callStore.callAccepted() → state: CONNECTED
  → peer.on('signal') → emit('call_answer', { callId, answer })  ─────────────────────────────────────► Server nhận
                                                              emit('call_answer_received', { callId, answer })
                                                              B nhận → peer.signal(answer)
B peer.on('connect'):
  → remote stream nhận được
  → callStore.setRemoteStream(stream)
  → CallOverlay hiện video/audio
A hoặc B bấm kết thúc:
  → handleEndCall()
  → emit('call_end', { callId })  ───────────────────────────────────────────────────────────────────► Server nhận
                                                              emit('call_ended', { callId })
                                                              → Tất cả participants nhận
                                                              → callStore.resetCall()
```

### 10.5. Socket Rooms - Ai Nhận Event?

Backend phân chia socket rooms như sau:

| Room | Thành viên | Event gửi đến |
|------|-----------|----------------|
| **Global** | Tất cả socket đang kết nối | `user_connected`, `user_offline` (broadcast) |
| **Conversation Room** `conv:{conversationId}` | Members của cuộc trò chuyện | `new_message`, `user_typing`, `message_recalled`, `conversation_updated` |
| **Call Room** `call:{callId}` | Caller + Callee | `incoming_call`, `call_ringing`, `call_accepted`, `call_ended`, `call_offer_received`, `call_answer_received`, `call_ice_candidate_received` |

> Khi user emit `join_conversation` → Backend thêm socket vào room `conv:{id}`
> Khi user emit `leave_conversation` → Backend rời khỏi room
> Khi user emit `join_call_room` → Backend thêm vào `call:{callId}`

### 10.6. Sơ Đồ Tổng Hợp Socket Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                    │
│                                                                          │
│  ┌──────────────────┐     ┌──────────────────┐                            │
│  │  SocketContext   │────▶│  socketService   │ (Singleton)                   │
│  │  (listeners)     │◀────│  .connect()      │                            │
│  └────────┬─────────┘     │  .emit()          │                            │
│           │                 └────────┬─────────┘                            │
│           ▼                          │                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │             SOCKET.IO CLIENT                 │                            │
│  └────────────────────────────┬────────────────┘                            │
└───────────────────────────────│──────────────────────────────────────────────┘
                                │ websocket / polling
                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (Node.js)                                  │
│                                                                          │
│  ┌──────────────────┐     ┌──────────────────┐                            │
│  │ Socket.io Server │────▶│  Room Manager     │                            │
│  │  (on connection) │     │  conv:{id}        │                            │
│  └──────────────────┘     │  call:{id}        │                            │
│           │                └──────────────────┘                            │
│           ▼                          │                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │           Event Handlers                      │                            │
│  │  message.handler.js  │  call.handler.js    │                            │
│  │  → Lưu DB            │  → Lưu call state  │                            │
│  │  → io.to(room).emit   │  → io.to(room).emit │                            │
│  └───────────────────────┴──────────────────────┘                            │
│           │                          │                                       │
│           ▼                          ▼                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │              MySQL Database                  │                            │
│  │  Messages, Conversations, Users, Calls...   │                            │
│  └─────────────────────────────────────────────┘                            │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Tech Stack & Dependencies

**Frontend Framework:**
- `react` ^18.x
- `react-dom` ^18.x
- `react-router-dom` ^6.x

**State Management:**
- `zustand` ^4.x

**Real-time Communication:**
- `socket.io-client` ^4.x
- `simple-peer` ^9.x (WebRTC wrapper)

**HTTP Client:**
- `axios` ^1.x

**UI Components:**
- `@radix-ui/*` ^1.x (UI primitives)
- `lucide-react` ^0.x (icons)
- `tailwindcss` ^3.x

**Utilities:**
- `date-fns` ^3.x (date formatting)
- `vite` ^5.x (build tool)
