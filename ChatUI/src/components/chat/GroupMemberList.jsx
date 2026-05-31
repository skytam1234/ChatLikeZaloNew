import React from 'react'
import { Modal, Avatar, Badge } from '@/components/common/index.js'
import { formatRelativeTime } from '@/utils/helpers.js'
import { Crown, Shield, User as UserIcon } from 'lucide-react'

export const GroupMemberList = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  onRemoveMember,
  onChangeRole,
}) => {
  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Crown className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-amber-500" />
      case 'admin': return <Shield className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-blue-500" />
      default: return <UserIcon className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-text-secondary" />
    }
  }

  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 }
    return roleOrder[a.role] - roleOrder[b.role]
  })

  const currentUserRole = members.find((m) => m.userId === currentUserId)?.role

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thành viên nhóm" size="md">
      <div className="max-h-[50vh] lg:max-h-[60vh] overflow-y-auto -mx-4 lg:mx-0 px-4 lg:px-0">
        <div className="mb-3 lg:mb-4 flex items-center justify-between">
          <span className="text-xs lg:text-sm text-text-secondary">
            {members.length} thành viên
          </span>
        </div>

        <div className="space-y-1 lg:space-y-2">
          {sortedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 lg:gap-3 rounded-xl p-2 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
            >
              <Avatar
                src={member.user?.avatarUrl}
                name={member.user?.displayName || member.user?.username}
                size="md"
                status={member.user?.isOnline ? 'online' : 'offline'}
                className="shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                  <h4 className="truncate font-medium text-text-primary text-sm lg:text-base">
                    {member.nickname || member.user?.displayName || member.user?.username}
                  </h4>
                  {member.userId === currentUserId && (
                    <Badge variant="outline" className="text-[10px] lg:text-xs shrink-0">
                      Bạn
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                  {getRoleIcon(member.role)}
                  <span className="capitalize truncate max-w-[80px] lg:max-w-none">
                    {member.role === 'owner' ? 'Trưởng nhóm'
                      : member.role === 'admin' ? 'QTV'
                      : 'Thành viên'}
                  </span>
                  {member.joinedAt && (
                    <>
                      <span className="hidden lg:inline">-</span>
                      <span className="hidden lg:inline">{formatRelativeTime(member.joinedAt)}</span>
                    </>
                  )}
                </div>
              </div>

              {(currentUserRole === 'owner' || currentUserRole === 'admin') &&
                member.userId !== currentUserId &&
                member.role !== 'owner' && (
                  <div className="flex gap-1 shrink-0">
                    {currentUserRole === 'owner' && member.role === 'member' && (
                      <button
                        onClick={() => onChangeRole?.(member, 'admin')}
                        className="rounded-lg px-1.5 lg:px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100 touch-manipulation whitespace-nowrap"
                      >
                        Thăng QTV
                      </button>
                    )}
                    {currentUserRole === 'owner' && member.role === 'admin' && (
                      <button
                        onClick={() => onChangeRole?.(member, 'member')}
                        className="rounded-lg px-1.5 lg:px-2 py-1 text-xs font-medium text-text-secondary hover:bg-gray-100 active:bg-gray-200 touch-manipulation whitespace-nowrap"
                      >
                        Hạ QTV
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveMember?.(member)}
                      className="rounded-lg px-1.5 lg:px-2 py-1 text-xs font-medium text-error hover:bg-red-50 active:bg-red-100 touch-manipulation whitespace-nowrap"
                    >
                      Xóa
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
