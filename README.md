# Zalo-like Chat Application

A full-featured real-time chat application inspired by Zalo, built with React + Vite on the frontend and Node.js + Express + Prisma on the backend. Supports direct messaging, group chats, file/image sharing, audio/video calls via WebRTC, Google OAuth, and AI-powered translation.

---

## Tech Stack

### Frontend (`ChatUI/`)

| Category | Technology |
|----------|------------|
| Framework | React 18.3.1 |
| Build Tool | Vite 6.0.5 |
| Language | JavaScript (ES Modules) |
| Styling | Tailwind CSS 3.4.17 |
| State Management | Zustand 5.0.2 |
| Routing | React Router DOM 7.1.1 |
| HTTP Client | Axios 1.7.9 |
| Real-time | Socket.IO Client 4.8.1 |
| Video/Audio Calls | Simple Peer 9.11.1 (WebRTC) |
| UI Components | Radix UI (Avatar, Dialog, Dropdown, Label, Slot, Tabs, Toast, Tooltip) |
| Icons | Lucide React 0.468.0 |
| Date Utils | date-fns 4.1.0 |
| Audio | readable-stream 4.7.0 |
| Utilities | class-variance-authority, clsx, tailwind-merge, uuid 11.0.3 |

### Backend (`ChatAPI/`)

| Category | Technology |
|----------|------------|
| Runtime | Node.js (ES Modules) |
| Framework | Express 4.21.0 |
| Database | MySQL + Prisma ORM 6.0.0 |
| Real-time | Socket.IO 4.8.0 |
| Authentication | JWT + Passport.js |
| OAuth | Google OAuth2 |
| File Upload | Multer 2.1.1 |
| Email | Nodemailer 8.0.8 |
| Validation | Zod 3.23.8 |
| Password Hashing | bcryptjs 2.4.3 |
| AI | Vercel AI SDK 6.0.0 + OpenRouter |
| Testing | Vitest 2.1.0 |

---

## Project Structure

```
ChatLikeZaloNew/
├── ChatAPI/                              # Backend API
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.js                 # App configuration
│   │   │   ├── prisma.js                # Prisma client singleton
│   │   │   └── passport.config.js        # Google OAuth setup
│   │   ├── controllers/
│   │   │   ├── auth.controller.js       # Authentication logic
│   │   │   ├── auth/google.controller.js # Google OAuth callbacks
│   │   │   ├── user.controller.js       # User management
│   │   │   ├── conversation.controller.js # Conversations
│   │   │   ├── message.controller.js    # Messages
│   │   │   ├── upload.controller.js     # File uploads
│   │   │   ├── admin.controller.js     # Admin panel
│   │   │   └── ai.controller.js       # AI translation
│   │   ├── routes/
│   │   │   ├── auth.routes.js           # /api/auth
│   │   │   ├── auth/google.routes.js    # /api/auth/google
│   │   │   ├── user.routes.js           # /api/users
│   │   │   ├── admin.routes.js          # /api/admin
│   │   │   ├── conversation.routes.js   # /api/conversations
│   │   │   ├── conversation-message.routes.js # /api/conversations/:id/messages
│   │   │   ├── message.routes.js        # /api/messages
│   │   │   ├── upload.routes.js         # /api/upload
│   │   │   ├── call.routes.js           # /api/calls
│   │   │   └── ai.routes.js             # /api/ai
│   │   ├── services/
│   │   │   ├── auth.service.js          # Auth business logic
│   │   │   ├── message.service.js       # Message CRUD
│   │   │   ├── conversation.service.js  # Conversation logic
│   │   │   ├── notification.service.js  # Notifications
│   │   │   ├── queue.service.js         # Background job queue
│   │   │   ├── email.service.js         # SMTP email sending
│   │   │   ├── ai.service.js            # OpenRouter AI integration
│   │   │   ├── admin.service.js         # Admin operations
│   │   │   └── callCleanup.service.js   # Stale call cleanup
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js        # JWT auth, role check
│   │   │   ├── cors.middleware.js       # CORS config
│   │   │   ├── error.middleware.js      # Error classes, handler, rate limiter
│   │   │   ├── notFound.middleware.js   # 404 handler
│   │   │   ├── response.middleware.js   # Response helpers
│   │   │   ├── upload.middleware.js     # Multer file upload
│   │   │   ├── multerError.middleware.js # Upload error handler
│   │   │   └── validate.middleware.js    # Zod validation
│   │   ├── validators/
│   │   │   ├── auth.validator.js        # Auth Zod schemas
│   │   │   ├── message.validator.js     # Message/conversation schemas
│   │   │   └── admin.validator.js      # Admin Zod schemas
│   │   ├── utils/
│   │   │   ├── jwt.js                   # JWT generation/verification
│   │   │   └── fileHelper.js           # File metadata helpers
│   │   ├── socket/
│   │   │   ├── index.js                 # Socket.IO setup
│   │   │   ├── events.js                # Event constants
│   │   │   ├── handlers/
│   │   │   │   ├── message.handler.js   # Typing, read receipts
│   │   │   │   ├── call.handler.js      # Full WebRTC call logic
│   │   │   │   └── notification.handler.js # Notification handlers
│   │   │   └── services/
│   │   │       └── socket.service.js    # Presence, rooms
│   │   └── tasks/
│   │       ├── index.js                 # Task loader
│   │       └── sendPasswordResetEmail.task.js # Async email task
│   ├── prisma/
│   │   ├── schema.prisma                # Database schema (11 models)
│   │   ├── seed.js                      # Database seed script
│   │   └── cleanup-calls.js             # Stale call cleanup script
│   ├── server.js                        # Entry point
│   ├── queue.js                         # Queue worker process
│   ├── .env                             # Environment variables
│   ├── .env.production                  # Production environment template
│   └── package.json
│
├── ChatUI/                              # Frontend React app
│   ├── src/
│   │   ├── api/                        # Axios API modules
│   │   │   ├── axiosClient.js          # Axios instance with interceptors
│   │   │   ├── authApi.js              # Authentication API
│   │   │   ├── conversationApi.js     # Conversation API
│   │   │   ├── messageApi.js           # Message API
│   │   │   ├── userApi.js              # User API
│   │   │   ├── pinnedApi.js            # Pinned documents API
│   │   │   ├── callApi.js              # Call history API
│   │   │   ├── admin.js                # Admin API
│   │   │   ├── settingsApi.js          # Settings API
│   │   │   ├── googleAuthApi.js        # Google OAuth API
│   │   │   └── aiApi.js                # AI translation API
│   │   ├── components/
│   │   │   ├── chat/                  # Chat components
│   │   │   │   ├── ChatBubble.jsx
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   ├── MessageList.jsx
│   │   │   │   ├── ConversationItem.jsx
│   │   │   │   ├── ConversationHeader.jsx
│   │   │   │   ├── GroupMemberList.jsx
│   │   │   │   ├── AudioPlayer.jsx
│   │   │   │   ├── TypingIndicator.jsx
│   │   │   │   └── PinnedDocuments.jsx
│   │   │   ├── call/                  # Call components
│   │   │   │   ├── CallOverlay.jsx
│   │   │   │   └── IncomingCallModal.jsx
│   │   │   ├── common/                # Shared components
│   │   │   │   ├── Avatar.jsx, Badge.jsx, Button.jsx
│   │   │   │   ├── Card.jsx, Input.jsx, Modal.jsx
│   │   │   │   ├── SessionExpiredModal.jsx, Spinner.jsx
│   │   │   │   ├── Textarea.jsx, Toast.jsx
│   │   │   └── layout/                # Layout components
│   │   │       ├── Header.jsx, Sidebar.jsx, MainLayout.jsx
│   │   ├── pages/
│   │   │   ├── auth/                  # Auth pages
│   │   │   │   ├── Login.jsx, Register.jsx
│   │   │   │   ├── ForgotPassword.jsx, ResetPassword.jsx
│   │   │   │   └── AuthCallback.jsx
│   │   │   ├── chat/                 # Chat pages
│   │   │   │   ├── ChatLayout.jsx, ConversationPage.jsx
│   │   │   │   ├── NewConversationPage.jsx, CallHistoryPage.jsx
│   │   │   ├── admin/               # Admin dashboard
│   │   │   │   └── AdminDashboard.jsx
│   │   │   ├── settings/             # Settings pages
│   │   │   │   ├── SettingsPage.jsx
│   │   │   │   └── tabs/
│   │   │   │       ├── ProfileTab.jsx, PasswordTab.jsx
│   │   │   │       ├── NotificationsTab.jsx, SessionsTab.jsx
│   │   │   └── ai/                  # AI chat page
│   │   │       └── AiChatPage.jsx
│   │   ├── stores/                  # Zustand state stores
│   │   │   ├── authStore.js         # Authentication state
│   │   │   ├── conversationStore.js  # Conversations state
│   │   │   ├── messageStore.js       # Messages state
│   │   │   ├── callStore.js         # Call state
│   │   │   ├── notificationStore.js  # Notifications state
│   │   │   └── settingsStore.js     # Settings state
│   │   ├── services/
│   │   │   ├── socketService.js     # Socket.IO connection
│   │   │   └── webrtcService.js    # WebRTC service
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.js, useAuthGuard.js, useTokenRefresh.js
│   │   │   ├── useConversations.js, useMessages.js, useSocket.js
│   │   │   └── usePinnedDocs.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx       # Auth context provider
│   │   │   ├── SocketContext.jsx    # Socket.IO context
│   │   │   └── ChatContext.jsx      # Chat context
│   │   ├── utils/
│   │   │   ├── constants.js, helpers.js, formatters.js
│   │   │   ├── tokenService.js, storage.js, cn.js
│   │   ├── types.js, App.jsx, main.jsx, index.css
│   ├── .env.example                  # Environment template
│   ├── .env.production               # Production environment
│   ├── index.html, vite.config.js, tailwind.config.js
│   └── package.json
│
└── README.md
```

---

## Setup & Installation

### Prerequisites

- **Node.js** 18+ (recommended 20 LTS)
- **MySQL** 8.0+ (local or remote)
- **npm** or **yarn**

### 1. Backend Setup (`ChatAPI/`)

```bash
cd ChatAPI

# Install dependencies
npm install

# Configure environment
cp .env .env.local
# Edit .env.local with your database credentials and secrets

# Generate Prisma client
npx prisma generate

# Create database (MySQL)
# mysql -u root -p
# CREATE DATABASE chat_db;

# Push schema to database
npx prisma db push

# Seed test data
npm run prisma:seed

# Start development server
npm run dev
```

### 2. Frontend Setup (`ChatUI/`)

```bash
cd ChatUI

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### 3. Production Build

```bash
# Backend
cd ChatAPI
npm run build  # or just: node server.js

# Frontend
cd ChatUI
npm run build
# Output will be in ChatUI/dist/
```

---

## Environment Variables

### Frontend (`ChatUI/.env.example`)

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### Backend (`ChatAPI/.env`)

```env
# Environment
NODE_ENV=development

# Server
PORT=3000

# Database
DATABASE_URL="mysql://root:password@localhost:3306/chat_db"

# JWT Authentication
JWT_SECRET=your-64-char-random-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Bcrypt
BCRYPT_ROUNDS=12

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# OpenRouter AI (optional)
OPENROUTER_API_KEY=sk-or-v1-your-key
```

---

## Demo Accounts

After running `npm run prisma:seed`, the following accounts are available:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| user1 | user1@example.com | password123 | user |
| user2 | user2@example.com | password123 | user |
| user3 | user3@example.com | password123 | user |

Seed data includes:
- 1 direct conversation between user1 and user2
- 1 group conversation ("Test Group") with user1, user2, user3
- 2 sample messages in the direct conversation

### Creating an Admin Account

```sql
UPDATE users SET role = 'admin' WHERE email = 'user1@example.com';
```

---

## Features

### Authentication & Security
- [x] Email/password registration and login
- [x] JWT-based authentication with access + refresh tokens
- [x] Multiple sessions per account with device info
- [x] Session management (view, revoke individual, revoke all)
- [x] Google OAuth login and account linking
- [x] Password reset via email
- [x] Password change with current password verification
- [x] Role-based access control (user, admin)

### Messaging
- [x] Direct 1-on-1 conversations
- [x] Group conversations
- [x] Text messages with Zod validation
- [x] Image/file sharing (uploaded to server)
- [x] Audio message playback
- [x] Reply to specific messages
- [x] Forward messages
- [x] Recall (unsend) messages
- [x] Edit messages
- [x] Delete messages
- [x] Message status: sent, delivered, seen
- [x] Unread count tracking
- [x] Typing indicators
- [x] Pin messages to conversation
- [x] Search messages within conversation
- [x] View images shared in conversation

### Conversations
- [x] Create direct conversations
- [x] Create group conversations
- [x] Add/remove participants (group)
- [x] Leave conversations
- [x] Pin conversations
- [x] Mute notifications
- [x] Custom notification settings per conversation
- [x] Archive conversations
- [x] Group name and description editing
- [x] Avatar for groups

### Calls
- [x] Audio calls via WebRTC
- [x] Video calls via WebRTC
- [x] Call initiation and signaling via Socket.IO
- [x] Incoming call modal with accept/decline
- [x] Call states: ringing, accepted, declined, missed, ended
- [x] Call duration tracking
- [x] Call history page with filter (all, missed, answered)
- [x] Call occupation prevention (no double calls)
- [x] Automatic stale call cleanup

### Real-time
- [x] Socket.IO for live updates
- [x] Live message delivery
- [x] Typing indicators
- [x] Online/offline presence
- [x] Message read receipts (real-time)
- [x] Incoming call notifications

### AI Features
- [x] AI-powered English-Vietnamese translation
- [x] Chat with AI assistant

### Admin Panel
- [x] Dashboard with statistics
- [x] User management (list, view details)
- [x] Change user roles (user <-> admin)
- [x] Toggle user active status
- [x] Delete users

### User Profile
- [x] Display name editing
- [x] Avatar upload
- [x] Username editing
- [x] Online status visibility

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new account |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/me` | Update profile |
| POST | `/auth/logout` | Logout current session |
| POST | `/auth/change-password` | Change password |
| GET | `/auth/sessions` | List active sessions |
| DELETE | `/auth/sessions/:id` | Revoke specific session |
| POST | `/auth/sessions/revoke-all` | Revoke all sessions |

### Google OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | OAuth callback |
| POST | `/auth/google/link` | Link Google to existing account |
| DELETE | `/auth/google/unlink` | Unlink Google account |
| GET | `/auth/google/link-status` | Check linking status |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | Get own profile |
| PUT | `/users/profile` | Update own profile |
| GET | `/users/:id` | Get user by ID |
| GET | `/users` | Search users |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/conversations` | List user's conversations |
| GET | `/conversations/:id` | Get conversation details |
| POST | `/conversations` | Create conversation |
| PUT | `/conversations/:id` | Update conversation |
| DELETE | `/conversations/:id` | Delete conversation |
| POST | `/conversations/:id/participants` | Add participants |
| DELETE | `/conversations/:id/participants/:userId` | Remove participant |
| POST | `/conversations/:id/pin` | Toggle pin |
| POST | `/conversations/:id/mute` | Toggle mute |
| GET | `/conversations/:id/members` | List members |
| POST | `/conversations/:id/leave` | Leave conversation |
| GET | `/conversations/:id/messages` | Get messages |
| GET | `/conversations/:id/messages/search` | Search messages |
| POST | `/conversations/:id/messages` | Send message |
| POST | `/conversations/:id/messages/file` | Send file message |
| GET | `/conversations/:id/pinned` | Get pinned documents |
| POST | `/conversations/:id/pinned` | Pin a message |
| DELETE | `/conversations/:id/pinned/:pinnedId` | Unpin a document |
| GET | `/conversations/:id/images` | Get shared images |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messages/read` | Mark messages as read |
| POST | `/messages/:id/recall` | Recall message |
| GET | `/messages/:id/file-info` | Get file info |
| PUT | `/messages/:id` | Edit message |
| DELETE | `/messages/:id` | Delete message |

### Calls

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/calls/history` | Get call history |
| GET | `/calls/history?filter=missed` | Filter by missed |
| GET | `/calls/history?filter=answered` | Filter by answered |
| GET | `/calls/:id` | Get call details |

### Admin (requires admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/users` | List all users (paginated) |
| GET | `/admin/users/:id` | Get user details |
| PATCH | `/admin/users/:id/role` | Update user role |
| PATCH | `/admin/users/:id/status` | Toggle user status |
| DELETE | `/admin/users/:id` | Delete user |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload single file |
| POST | `/upload/multiple` | Upload multiple files (max 10) |
| POST | `/upload/avatar` | Upload avatar image |
| POST | `/upload/message` | Upload message attachment |
| POST | `/upload/conversation-avatar` | Upload group avatar |
| DELETE | `/upload/:filename` | Delete a file |
| GET | `/upload/:filename` | Get file info |
| GET | `/upload/:category/:filename/download` | Download file |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/translate` | Translate message (EN <-> VI) |

---

## Real-time & WebRTC

### Socket.IO Connection

Connect to: `http://localhost:3000`

### Client -> Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `{ conversationId }` | Join a conversation room |
| `leave_conversation` | `{ conversationId }` | Leave a conversation room |
| `typing_start` | `{ conversationId }` | Start typing indicator |
| `typing_stop` | `{ conversationId }` | Stop typing indicator |
| `mark_read` | `{ conversationId, messageId }` | Mark message as read |
| `call_initiate` | `{ calleeId, type, conversationId }` | Start a call |
| `call_accept` | `{ callId }` | Accept incoming call |
| `call_decline` | `{ callId }` | Decline incoming call |
| `call_end` | `{ callId }` | End current call |
| `call_offer` | `{ callId, offer }` | Send WebRTC offer |
| `call_answer` | `{ callId, answer }` | Send WebRTC answer |
| `call_ice_candidate` | `{ callId, candidate }` | Send ICE candidate |

### Server -> Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `{ message }` | New message in a conversation |
| `message_updated` | `{ conversationId, message }` | Message was edited |
| `message_deleted` | `{ conversationId, messageId }` | Message was deleted |
| `message_recalled` | `{ conversationId, messageId }` | Message was recalled |
| `user_typing` | `{ conversationId, userId }` | Someone is typing |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |
| `incoming_call` | `{ call }` | Incoming call notification |
| `call_ringing` | `{ callId }` | Call is ringing |
| `call_accepted` | `{ callId }` | Call was accepted |
| `call_ended` | `{ callId, duration }` | Call ended |
| `call_missed_notify` | `{ call }` | Missed call notification |

---

## Database Schema

11 models: **User**, **Session**, **Conversation**, **ConversationUser**, **Message**, **MessageStatus**, **UnreadMessage**, **PinnedDocument**, **GroupMember**, **Call**, **Notification**, **Queue**.

### Key Relationships

- `User` <-> `Conversation` via `ConversationUser` (many-to-many)
- `User` <-> `Message` via `MessageStatus` (read receipts)
- `Message` <-> `Message` via `replyToId` (replies)
- `Conversation` -> `Call` (one-to-many)
- `User` <-> `Call` (initiated and received calls)
- `Conversation` -> `PinnedDocument` -> `Message` (pinned messages)
- `User` -> `Notification` (one-to-many)
- `User` -> `Queue` (async job processing)
