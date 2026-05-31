import React from 'react'
import { useSettingsStore } from '@/stores/index.js'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/common/index.js'
import { Bell, Volume2, Monitor, MessageSquare, Edit3, Users, PhoneMissed } from 'lucide-react'
import { cn } from '@/utils/cn.js'

const ToggleSwitch = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-primary' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

const NOTIFICATION_OPTIONS = [
  {
    key: 'messageNotifications',
    label: 'Thông báo tin nhắn mới',
    description: 'Nhận thông báo khi có tin nhắn mới',
    icon: MessageSquare,
  },
  {
    key: 'soundEnabled',
    label: 'Âm thanh thông báo',
    description: 'Phát âm thanh khi có tin nhắn hoặc cuộc gọi',
    icon: Volume2,
  },
  {
    key: 'desktopNotifications',
    label: 'Thông báo desktop',
    description: 'Hiển thị thông báo trên màn hình',
    icon: Monitor,
  },
  {
    key: 'messagePreview',
    label: 'Xem trước nội dung',
    description: 'Hiển thị nội dung tin nhắn trong thông báo',
    icon: Bell,
  },
  {
    key: 'typingWhileTyping',
    label: 'Nhắn tin khi đang nhắn',
    description: 'Cho phép nhận tin nhắn khi đang soạn tin khác',
    icon: Edit3,
  },
  {
    key: 'groupNotifications',
    label: 'Thông báo nhóm mới',
    description: 'Nhận thông báo khi được thêm vào nhóm mới',
    icon: Users,
  },
  {
    key: 'missedCallNotifications',
    label: 'Thông báo cuộc gọi nhỡ',
    description: 'Nhận thông báo khi có cuộc gọi nhỡ',
    icon: PhoneMissed,
  },
]

export const NotificationsTab = () => {
  const { notificationSettings, updateNotificationSettings, resetNotificationSettings } = useSettingsStore()

  const enabledCount = NOTIFICATION_OPTIONS.filter((opt) => notificationSettings[opt.key]).length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Cài đặt thông báo</CardTitle>
              <CardDescription>
                Tùy chỉnh cách bạn nhận thông báo từ ứng dụng
              </CardDescription>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {enabledCount}/{NOTIFICATION_OPTIONS.length} bật
            </span>
          </div>
        </CardHeader>

        <CardContent className="divide-y divide-border">
          {NOTIFICATION_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <div key={option.key} className="flex items-center gap-4 py-1 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Icon className="h-4 w-4 text-text-secondary" />
                </div>
                <div className="flex-1">
                  <ToggleSwitch
                    checked={notificationSettings[option.key]}
                    onChange={(value) => updateNotificationSettings({ [option.key]: value })}
                    label={option.label}
                    description={option.description}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={resetNotificationSettings}
        >
          Khôi phục mặc định
        </Button>
      </div>
    </div>
  )
}
