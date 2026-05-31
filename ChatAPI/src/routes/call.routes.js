import { Router } from 'express';
import prisma from '../config/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/calls/history
 * Get call history for the authenticated user
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, filter = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100);

    // Build where clause
    const where = {
      OR: [
        { callerId: userId },
        { calleeId: userId },
      ],
    };

    if (filter === 'missed') {
      where.status = { in: ['missed', 'declined'] };
    } else if (filter === 'answered') {
      where.status = 'ended';
    }

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          caller: {
            select: { id: true, displayName: true, avatarUrl: true, username: true },
          },
          callee: {
            select: { id: true, displayName: true, avatarUrl: true, username: true },
          },
          conversation: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      prisma.call.count({ where }),
    ]);

    res.json({
      success: true,
      data: calls,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('Error fetching call history:', error.message, error.stack);
    res.status(500).json({ success: false, error: 'Failed to fetch call history', detail: error.message });
  }
});

/**
 * GET /api/calls/:id
 * Get a specific call by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        caller: {
          select: { id: true, displayName: true, avatarUrl: true, username: true },
        },
        callee: {
          select: { id: true, displayName: true, avatarUrl: true, username: true },
        },
        conversation: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!call) {
      return res.status(404).json({ success: false, error: 'Call not found' });
    }

    if (call.callerId !== userId && call.calleeId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    res.json({ success: true, data: call });
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch call' });
  }
});

export default router;
