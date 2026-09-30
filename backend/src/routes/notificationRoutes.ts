import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { getNotifications, markAsRead } from '../controllers/notificationController';

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

export default router;
