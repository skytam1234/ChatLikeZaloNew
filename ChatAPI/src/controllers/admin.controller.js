import adminService from '../services/admin.service.js';

export class AdminController {
  /**
   * GET /api/admin/users
   */
  async getUsers(req, res, next) {
    try {
      const { page, limit, search, role, status } = req.query;
      const result = await adminService.getUsers({ page, limit, search, role, status });
      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await adminService.getUserById(id);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id/role
   */
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const updated = await adminService.updateUserRole(id, role, req.userId);
      res.json({
        success: true,
        data: updated,
        message: `User role updated to "${role}"`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/admin/users/:id/status
   */
  async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updated = await adminService.toggleUserStatus(id, isActive, req.userId);
      res.json({
        success: true,
        data: updated,
        message: isActive ? 'User activated' : 'User deactivated',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await adminService.deleteUser(id, req.userId);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await adminService.getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
