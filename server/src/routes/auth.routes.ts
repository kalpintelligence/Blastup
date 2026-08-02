import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1).max(50).trim(),
  password: z.string().min(1).max(128),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(8).max(128),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/register', loginLimiter, validate(registerSchema), authController.register);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.patch('/password', authenticate, validate(changePasswordSchema), authController.changePassword);

export default router;
