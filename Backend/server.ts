import express, { type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './src/routes/userRouter.js'; 
import ItemServicesRoutes from './src/routes/ItemServicesRouter.js';
import Quotation from './src/routes/QuotationRouter.js';
import Customer from './src/routes/CustomerRouter.js';
import InvoiceRoutes from './src/routes/InvoiceRouter.js';
import paymentRoutes from './src/routes/PaymentRouter.js'
import NotificationRouter from './src/routes/NotificationRouter.js';
import path from 'path';
// 1. Initial Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/testdb';

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});


app.use('/api/notifications', NotificationRouter)
app.use('/api', userRoutes);
app.use('/api', ItemServicesRoutes);
app.use('/api', Quotation); 
app.use('/api', Customer);
app.use('/api', InvoiceRoutes);
app.use('/api', paymentRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/media', express.static(path.join(process.cwd(), 'public/media')));
app.get('/', (req: Request, res: Response) => {
  res.send('🚀 Auth API is running...');
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.url} not found on this server.`
  });
});

// 5. Database Connection & Server Start
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on: http://localhost:${PORT}`);
      console.log(`🔗 API Base Path: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); 
  });