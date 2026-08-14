import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication & admin role
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all user accounts (admin)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all user accounts with online status
 */
router.get('/users', adminController.getUsers);

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Toggle user active status
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled
 */
router.patch('/users/:id/status', adminController.toggleUserStatus);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user account
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:id', adminController.deleteUser);

export default router;
