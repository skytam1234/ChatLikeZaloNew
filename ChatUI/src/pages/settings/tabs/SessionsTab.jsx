import React, { useEffect, useState } from 'react'
import { useSettingsStore } from '@/stores/index.js'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Modal } from '@/components/common/index.js'
import { Monitor, Globe, Clock, LogOut, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils/cn.js'

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const parseUserAgent = (userAgent) => {
  if (!userAgent) return { browser: 'Không rõ', os: 'Không rõ' }

  const browserMap = [
    [/Chrome\/[\d.]+/g, 'Chrome'],
    [/Firefox\/[\d.]+/g, 'Firefox'],
    [/Safari\/[\d.]+/g, 'Safari'],
    [/Edge\/[\d.]+/g, 'Edge'],
    [/MSIE [\d.]+|Trident\/[\d.]+/g, 'Internet Explorer'],
  ]

  const osMap = [
    [/Windows NT 10/g, 'Windows 10/11'],
    [/Windows NT 6.3/g, 'Windows 8.1'],
    [/Mac OS X [\d_]+/g, 'macOS'],
    [/Linux/g, 'Linux'],
    [/Android [\d.]+/g, 'Android'],
    [/iPhone OS [\d_]+/g, 'iOS'],
  ]

  let browser = 'Không rõ'
  let os = 'Không rõ'

  for (const [regex, name] of browserMap) {
    if (regex.test(userAgent)) {
      browser = name
      break
    }
  }

  for (const [regex, name] of osMap) {
    if (regex.test(userAgent)) {
      os = name
      break
    }
  }

  return { browser, os }
}

export const SessionsTab = () => {
  const { sessions, sessionsLoading, fetchSessions, revokeSession, revokeAllSessions } = useSettingsStore()
  const [confirmModal, setConfirmModal] = useState(null) // { type: 'single'|'all', id?: string }
  const [actionLoading, setActionLoading] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleRevokeSession = async () => {
    if (!confirmModal) return
    setActionLoading(true)
    setLocalError('')

    let result
    if (confirmModal.type === 'all') {
      result = await revokeAllSessions()
    } else {
      result = await revokeSession(confirmModal.id)
    }

    setActionLoading(false)
    setConfirmModal(null)

    if (!result.success) {
      setLocalError(result.error)
    }
  }

  const currentSession = sessions.find((s) => s.isCurrent)
  const otherSessions = sessions.filter((s) => !s.isCurrent)

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Quản lý phiên đăng nhập</CardTitle>
            <CardDescription>
              Xem và quản lý các thiết bị đã đăng nhập vào tài khoản của bạn
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Current session */}
            {currentSession && (
              <div className="mb-6">
                <h4 className="mb-3 text-sm font-medium text-text-secondary">Phiên hiện tại</h4>
                <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <Monitor className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary truncate">
                          {parseUserAgent(currentSession.userAgent).browser} trên{' '}
                          {parseUserAgent(currentSession.userAgent).os}
                        </p>
                        <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          Đang sử dụng
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                        {currentSession.ipAddress && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {currentSession.ipAddress}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(currentSession.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other sessions */}
            {otherSessions.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-text-secondary">
                    Các phiên khác ({otherSessions.length})
                  </h4>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmModal({ type: 'all' })}
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất tất cả
                  </Button>
                </div>

                <div className="space-y-2">
                  {otherSessions.map((session) => {
                    const { browser, os } = parseUserAgent(session.userAgent)
                    return (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 shrink-0">
                          <Monitor className="h-5 w-5 text-text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">
                            {browser} trên {os}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                            {session.ipAddress && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {session.ipAddress}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(session.createdAt)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmModal({ type: 'single', id: session.id })}
                          className="text-error hover:bg-error/10 shrink-0"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {sessions.length === 0 && !sessionsLoading && (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Monitor className="mx-auto h-10 w-10 text-text-secondary/50" />
                <p className="mt-3 text-sm text-text-secondary">Chưa có phiên đăng nhập nào</p>
              </div>
            )}

            {localError && (
              <div className="mt-4 rounded-lg bg-error/10 p-3 text-sm text-error flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {localError}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm modal */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="Xác nhận đăng xuất"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-warning/10 p-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning mt-0.5" />
            <p className="text-sm text-warning">
              {confirmModal?.type === 'all'
                ? 'Bạn có chắc muốn đăng xuất khỏi tất cả các thiết bị khác? Phiên hiện tại sẽ được giữ lại.'
                : 'Bạn có chắc muốn đăng xuất khỏi thiết bị này?'}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmModal(null)}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleRevokeSession}
              isLoading={actionLoading}
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
