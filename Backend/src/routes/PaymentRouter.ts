import express from 'express';
import { createPayment, getPayment, createDirectPayment } from '../controllers/PaymentController.js';
import { verifyAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/payment',verifyAuth, createPayment);
router.get('/payment/all', getPayment);
router.post('/payment/direct', requireAdmin, createDirectPayment); 

export default router;