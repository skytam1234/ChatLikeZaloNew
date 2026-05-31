import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, UserCheck, UserX, TrendingUp,
  Search, ChevronLeft, ChevronRight, MoreHorizontal,
  RefreshCw, Trash2, Edit3, Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/common/Card.jsx';
import { Badge } from '@/components/common/Badge.jsx';
import { Button } from '@/components/common/Button.jsx';
import { Input } from '@/components/common/Input.jsx';
import { Modal } from '@/components/common/Modal.jsx';
import { Avatar } from '@/components/common/Avatar.jsx';
import { adminService } from '@/services/adminService.js';
import { useAuthContext } from '@/contexts/index.js';
import { cn } from '@/utils/cn.js';
import { ROUTES } from '@/utils/constants.js';

const ROLE_LABELS = { admin: 'Quản trị', user: 'Người dùng' };
const STATUS_LABELS = { active: 'Hoạt động', inactive: 'Bị khóa' };

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserRow({ user, onView, onEditRole, onToggleStatus, onDelete, currentUserId }) {
  const isCurrentUser = user.id === currentUserId;
  return (
    <tr className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatarUrl} name={user.displayName} size="sm" />
          <div>
            <p className="font-medium text-text-primary">{user.displayName}</p>
            <p className="text-xs text-text-secondary">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-text-secondary">@{user.username}</span>
      </td>
      <td className="py-3 px-4">
        <Badge variant={user.role === 'admin' ? 'success' : 'secondary'}>
          {ROLE_LABELS[user.role] || user.role}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <Badge variant={user.isActive ? 'success' : 'error'}>
          {user.isActive ? 'Hoạt động' : 'Bị khóa'}
        </Badge>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-text-secondary">
          {user.createdAtFormatted}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(user)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </button>
          {!isCurrentUser && (
            <>
              <button
                onClick={() => onEditRole(user)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors"
                title="Đổi vai trò"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onToggleStatus(user)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                  user.isActive
                    ? 'text-warning hover:bg-warning/10'
                    : 'text-success hover:bg-success/10'
                )}
                title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
              >
                {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </button>
              <button
                onClick={() => onDelete(user)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-error hover:bg-error/10 transition-colors"
                title="Xóa tài khoản"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthContext();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRoleUser, setEditRoleUser] = useState(null);
  const [toggleStatusUser, setToggleStatusUser] = useState(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch {
      // silent fail
    }
  }, []);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { users: data, pagination: p } = await adminService.getUsers({
        page,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(data);
      setPagination(p);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchStats();
    fetchUsers(1);
  }, [fetchStats, fetchUsers]);

  useEffect(() => {
    fetchUsers(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const handleView = (user) => setSelectedUser(user);
  const handleEditRole = (user) => setEditRoleUser(user);
  const handleToggleStatus = (user) => setToggleStatusUser(user);
  const handleDelete = (user) => setDeleteUserTarget(user);

  const confirmEditRole = async () => {
    if (!editRoleUser) return;
    setActionLoading(true);
    try {
      await adminService.updateRole(editRoleUser.id, editRoleUser.role);
      setEditRoleUser(null);
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err) {
      alert(err?.response?.data?.error || 'Cập nhật thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!toggleStatusUser) return;
    setActionLoading(true);
    try {
      await adminService.toggleStatus(toggleStatusUser.id, !toggleStatusUser.isActive);
      setToggleStatusUser(null);
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err) {
      alert(err?.response?.data?.error || 'Cập nhật thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUserTarget) return;
    setActionLoading(true);
    try {
      await adminService.deleteUser(deleteUserTarget.id);
      setDeleteUserTarget(null);
      fetchUsers(pagination.page);
      fetchStats();
    } catch (err) {
      alert(err?.response?.data?.error || 'Xóa thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(ROUTES.CHAT)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-text-secondary" />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-text-primary">Quản trị hệ thống</h1>
              </div>
            </div>
            <button
              onClick={() => { fetchStats(); fetchUsers(pagination.page); }}
              className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon={Users} label="Tổng người dùng" value={stats.totalUsers} color="bg-blue-500" />
            <StatCard icon={UserCheck} label="Đang hoạt động" value={stats.activeUsers} color="bg-green-500" />
            <StatCard icon={Shield} label="Quản trị viên" value={stats.adminCount} color="bg-purple-500" />
            <StatCard icon={TrendingUp} label="Mới (7 ngày)" value={stats.newUsers7Days} color="bg-orange-500" />
            <StatCard icon={UserCheck} label="Đã xác thực" value={stats.verifiedUsers} color="bg-teal-500" />
          </div>
        )}

        {/* User table */}
        <Card>
          <div className="p-4 sm:p-6 pb-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary pointer-events-none" />
                <Input
                  placeholder="      Tìm kiếm theo tên, email, username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Tất cả vai trò</option>
                <option value="admin">Quản trị</option>
                <option value="user">Người dùng</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Bị khóa</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Người dùng</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Username</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Vai trò</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Trạng thái</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Ngày tạo</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary text-sm">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onView={handleView}
                      onEditRole={handleEditRole}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDelete}
                      currentUserId={currentUser?.id}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 sm:p-6 pt-4 border-t border-border">
              <p className="text-sm text-text-secondary">
                Trang {pagination.page} / {pagination.totalPages} — {pagination.total} người dùng
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchUsers(pageNum)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                        pageNum === pagination.page
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-gray-100'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* View user modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Chi tiết người dùng"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar src={selectedUser.avatarUrl} name={selectedUser.displayName} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{selectedUser.displayName}</h3>
                <p className="text-sm text-text-secondary">@{selectedUser.username}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Email</p>
                <p className="text-text-primary font-medium">{selectedUser.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Số điện thoại</p>
                <p className="text-text-primary font-medium">{selectedUser.phoneNumber || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Vai trò</p>
                <Badge variant={selectedUser.role === 'admin' ? 'success' : 'secondary'}>
                  {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Trạng thái</p>
                <Badge variant={selectedUser.isActive ? 'success' : 'error'}>
                  {selectedUser.isActive ? 'Hoạt động' : 'Bị khóa'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Ngày tạo</p>
                <p className="text-text-primary font-medium">{selectedUser.createdAtFormatted}</p>
              </div>
              <div className="space-y-1">
                <p className="text-text-secondary text-xs uppercase tracking-wide">Tin nhắn đã gửi</p>
                <p className="text-text-primary font-medium">{selectedUser._count?.sentMessages || 0}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit role modal */}
      <Modal
        isOpen={!!editRoleUser}
        onClose={() => setEditRoleUser(null)}
        title="Đổi vai trò người dùng"
        size="sm"
      >
        {editRoleUser && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Chọn vai trò mới cho <strong className="text-text-primary">{editRoleUser.displayName}</strong>
            </p>
            <div className="space-y-2">
              {['user', 'admin'].map((role) => (
                <label
                  key={role}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors',
                    editRoleUser.role === role
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={editRoleUser.role === role}
                    onChange={() => setEditRoleUser({ ...editRoleUser, role })}
                    className="h-4 w-4 text-primary accent-primary"
                  />
                  <div>
                    <p className="font-medium text-text-primary">{ROLE_LABELS[role]}</p>
                    <p className="text-xs text-text-secondary">
                      {role === 'admin' ? 'Có quyền truy cập trang quản trị' : 'Chỉ có quyền sử dụng chat'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditRoleUser(null)} className="flex-1">
                Hủy
              </Button>
              <Button
                onClick={confirmEditRole}
                loading={actionLoading}
                className="flex-1"
              >
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Toggle status modal */}
      <Modal
        isOpen={!!toggleStatusUser}
        onClose={() => setToggleStatusUser(null)}
        title={toggleStatusUser?.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        size="sm"
      >
        {toggleStatusUser && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {toggleStatusUser.isActive
                ? `Bạn có chắc muốn khóa tài khoản của "${toggleStatusUser.displayName}"? Người dùng này sẽ không thể đăng nhập.`
                : `Bạn có chắc muốn mở khóa tài khoản của "${toggleStatusUser.displayName}"?`}
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setToggleStatusUser(null)} className="flex-1">
                Hủy
              </Button>
              <Button
                variant={toggleStatusUser.isActive ? 'destructive' : 'primary'}
                onClick={confirmToggleStatus}
                loading={actionLoading}
                className="flex-1"
              >
                {toggleStatusUser.isActive ? 'Khóa' : 'Mở khóa'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteUserTarget}
        onClose={() => setDeleteUserTarget(null)}
        title="Xóa tài khoản"
        size="sm"
      >
        {deleteUserTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Bạn có chắc muốn xóa tài khoản của <strong className="text-text-primary">{deleteUserTarget.displayName}</strong>?
              Hành động này sẽ khóa tài khoản và đăng xuất tất cả phiên của người dùng này.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteUserTarget(null)} className="flex-1">
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                loading={actionLoading}
                className="flex-1"
              >
                Xóa tài khoản
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
