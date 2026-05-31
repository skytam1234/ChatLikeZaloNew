#  Zalo-like Chat Application

A full-featured real-time chat application inspired by Zalo, built with React + Vite on the frontend and Node.js + Express + Prisma on the backend. Supports direct messaging, group chats, file/image sharing, audio/video calls via WebRTC, and Google OAuth authentication.

---
## Tech Stack

### Frontend (`ChatUI/`)
| Category | Technology |
|----------|-----------|
| Framework | React 18.3.1 |
| Build Tool | Vite 6.0.5 |
| Language | JavaScript (ES Modules) |
| Styling | Tailwind CSS 3.4.17 |
| State Management | Zustand 5.0.2 |
| Routing | React Router DOM 7.1.1 |
| HTTP Client | Axios 1.7.9 |
| Real-time | Socket.IO Client 4.8.1 |
| Video/Audio Calls | Simple Peer 9.11.1 (WebRTC) |
| UI Components | Radix UI (Dialog, Avatar, Dropdown, Tabs, Toast, Tooltip) |
| Icons | Lucide React |
| Date Utils | date-fns |

### Backend (`ChatAPI/`)
| Category | Technology |
|----------|-----------|
| Runtime | Node.js (ES Modules) |
| Framework | Express 4.21.0 |
| Database | MySQL + Prisma ORM 6.0.0 |
| Real-time | Socket.IO 4.8.0 |
| Authentication | JWT + Passport.js |
| OAuth | Google OAuth2 |
| File Upload | Multer |
| Email | Nodemailer |
| Validation | Zod |
| Password Hashing | bcryptjs |
| Testing | Vitest |

---

## Project Structure

```
ChatTrungGian/
├── ChatAPI/                          # Backend API
│   ├── src/
│   │   ├── config/                   # App configuration
│   │   ├── middleware/                # Express middlewares (CORS, error handling, etc.)
│   │   ├── routes/                   # API route definitions
│   │   │   ├── auth.routes.js        # /api/auth
│   │   │   ├── auth/                 # Google OAuth routes
│   │   │   ├── user.routes.js        # /api/users
│   │   │   ├── admin.routes.js       # /api/admin
│   │   │   ├── conversation.routes.js # /api/conversations
│   │   │   ├── message.routes.js     # /api/messages
│   │   │   ├── upload.routes.js      # /api/upload
│   │   │   └── call.routes.js        # /api/calls
│   │   ├── socket/                   # Socket.IO setup and handlers
│   │   ├── services/                # Business logic
│   │   └── utils/                   # Helper functions
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema
│   │   ├── seed.js                   # Database seed script
│   │   └── cleanup-calls.js          # Stale call cleanup script
│   ├── DATA/                        # Uploaded files (images, audio, etc.)
│   ├── server.js                    # Entry point
│   ├── .env                         # Environment variables
│   └── package.json
│
├── ChatUI/                           # Frontend React app
│   ├── src/
│   │   ├── api/                     # Axios API service modules
│   │   ├── components/             # React components
│   │   │   ├── chat/               # Chat-related components
│   │   │   ├── call/               # Call UI components
│   │   │   ├── common/             # Shared components
│   │   │   ├── layout/             # Layout components
│   │   │   └── settings/          # Settings components
│   │   ├── pages/                  # Page components
│   │   │   ├── auth/               # Login, Register, Password reset pages
│   │   │   ├── chat/               # Chat pages
│   │   │   ├── admin/              # Admin dashboard
│   │   │   └── settings/           # Settings page
│   │   ├── stores/                 # Zustand state stores
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env                        # Vite environment variables
│   ├── index.html
│   └── package.json
│
├── package.json                      # Root package.json (Playwright for testing)
└── README.md
```



```

### Frontend (`ChatUI/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```


### Standard Users

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@test.com | Anhtam1234 | admin |
| user01 | user01@test.com | Anhtam1234 | user |
| user02 | user02@test.com | Anhtam1234 | user |

### Creating an Admin Account

Seed data only creates standard users. To create an admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'user1@example.com';
```



### Seed Data

The seed script also creates:
- 1 direct conversation between user1 and user2
- 1 group conversation ("Test Group") with user1, user2, user3
- Sample messages between user1 and user2

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
- [x] Call history page
- [x] Call occupation prevention (no double calls)

### Real-time
- [x] Socket.IO for live updates
- [x] Live message delivery
- [x] Typing indicators
- [x] Online/offline presence
- [x] Message read receipts (real-time)
- [x] Incoming call notifications

### Admin Panel
- [x] Dashboard with statistics
- [x] User management (list, view details)
- [x] Change user roles (user ↔ admin)
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
| GET | `/calls/:id` | Get call details |

### Admin (requires admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/users` | List all users |
| GET | `/admin/users/:id` | Get user details |
| PATCH | `/admin/users/:id/role` | Update user role |
| PATCH | `/admin/users/:id/status` | Toggle user status |
| DELETE | `/admin/users/:id` | Delete user |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/image` | Upload image |
| POST | `/upload/file` | Upload generic file |
| POST | `/upload/audio` | Upload audio message |

---

## Real-time & WebRTC

### Socket.IO Connection

Connect to: `http://localhost:3000`

### Client → Server Events

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

### Server → Client Events

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


