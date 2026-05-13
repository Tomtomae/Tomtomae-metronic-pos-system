import { Router } from "express"; 
import { getMyNotifications, markAsRead,deleteNotification } from '../controllers/NotificationController.js';


import { verifyAuth } from "../middleware/auth.middleware.js";

const router: Router = Router();

router.get('/', verifyAuth, getMyNotifications);
router.patch('/:id/read', verifyAuth, markAsRead);
router.delete('/:id', verifyAuth, deleteNotification);

export default router;