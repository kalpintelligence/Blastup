import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

/**
 * GET /api/admin/users
 * Returns all user accounts with their online/last-seen status.
 */
export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await User.find({})
      .select('username role isActive lastLoginAt lastSeenAt createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const now = Date.now();
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    const enriched = users.map((u: any) => ({
      id: u._id.toString(),
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      lastSeenAt: u.lastSeenAt,
      createdAt: u.createdAt,
      isOnline: u.lastSeenAt
        ? now - new Date(u.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS
        : false,
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Toggle a user's isActive flag.
 */
export async function toggleUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    // Prevent self-deactivation
    if (user._id.toString() === req.user?.id) {
      res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
      return;
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: { id: user._id, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/users/:id
 * Hard-delete a user account.
 */
export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (user._id.toString() === req.user?.id) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account' });
      return;
    }
    await User.deleteOne({ _id: user._id });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}
