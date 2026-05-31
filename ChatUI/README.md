# ChatUI - Ứng dụng Chat theo phong cách Zalo Web

Ứng dụng chat real-time được xây dựng với Vite, React, TypeScript, Tailwind CSS, Axios và Socket.io.

## Tính năng

### Authentication
- [x] Đăng ký tài khoản
- [x] Đăng nhập
- [x] Đăng xuất
- [x] Quản lý phiên đăng nhập với JWT tokens

### Chat
- [x] Chat cá nhân (Direct Message)
- [x] Chat nhóm (Group Chat)
- [x] Gửi tin nhắn văn bản
- [x] Gửi file đính kèm (hình ảnh, video, file)
- [x] Reply tin nhắn
- [x] Thu hồi tin nhắn
- [x] Xóa tin nhắn
- [x] Ghim tài liệu
- [x] Trạng thái tin nhắn (đã gửi, đã nhận, đã xem)
- [x] Tin nhắn chưa đọc
- [x] Tin nhắn đã xem nhưng chưa trả lời

### Real-time
- [x] Kết nối Socket.io sau khi đăng nhập
- [x] Nhận tin nhắn real-time
- [x] Typing indicator
- [x] Trạng thái online/offline

### UI/UX
- [x] Giao diện responsive
- [x] Design theo phong cách Zalo
- [x] Dark/Light mode (tùy chọn)
- [x] Toast notifications

## Công nghệ sử dụng

### Frontend
- **Vite** - Build tool
- **React 18** - UI Library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI / Shadcn UI** - UI Components
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Socket.io Client** - Real-time
- **React Router v7** - Routing
- **date-fns** - Date formatting
- **Lucide React** - Icons

### Backend (cần triển khai riêng)
- **Node.js / Express**
- **MySQL 8.0+**
- **Socket.io Server**
- **Redis** (tùy chọn)

## Cài đặt

```bash
# Clone repository
git clone <repo-url>
cd ChatUI

# Cài đặt dependencies
npm install

# Tạo file môi trường
cp .env.example .env

# Chạy development server
npm run dev

# Build production
npm run build
```

## Cấu hình

### Environment Variables

```env
VITE_API_URL=https://localhost/api/chat:3000
VITE_SOCKET_URL=https://localhost/api/chat:3000
```

### Database

Xem chi tiết tại [docs/database.md](./docs/database.md)

## Cấu trúc dự án

```
src/
├── api/                 # Axios API clients
├── components/
│   ├── common/         # Shared components (Button, Input, Avatar...)
│   ├── chat/           # Chat components
│   └── layout/        # Layout components
├── contexts/           # React Contexts
├── hooks/             # Custom hooks
├── pages/             # Page components
├── routes/            # Routing
├── services/          # Business logic
├── stores/            # Zustand stores
├── types/             # TypeScript types
├── utils/             # Utilities
├── App.tsx
└── main.tsx
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/logout` | Đăng xuất |
| GET | `/api/auth/me` | Lấy thông tin user |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | Danh sách cuộc trò chuyện |
| POST | `/api/conversations` | Tạo cuộc trò chuyện |
| GET | `/api/conversations/:id` | Chi tiết cuộc trò chuyện |
| PUT | `/api/conversations/:id` | Cập nhật |
| DELETE | `/api/conversations/:id` | Xóa |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations/:id/messages` | Lấy tin nhắn |
| POST | `/api/conversations/:id/messages` | Gửi tin nhắn |
| PUT | `/api/messages/:id` | Chỉnh sửa |
| DELETE | `/api/messages/:id` | Xóa |
| POST | `/api/messages/:id/recall` | Thu hồi |

## Socket.io Events

### Client -> Server
- `join_conversation`
- `leave_conversation`
- `send_message`
- `typing_start`
- `typing_stop`
- `mark_seen`

### Server -> Client
- `new_message`
- `message_delivered`
- `message_seen`
- `user_typing`
- `user_online`
- `user_offline`

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint
```

## License

MIT
