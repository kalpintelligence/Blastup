import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as controller from '../controllers/reminder.controller';

const router = Router();
router.use(authenticate);
router.get('/', controller.list);
router.patch('/:taskId', controller.update);
router.post('/:taskId/cancel', controller.cancel);
export default router;
