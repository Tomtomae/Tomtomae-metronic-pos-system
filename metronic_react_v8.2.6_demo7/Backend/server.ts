import express, { type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './src/routes/userRounter.js'; 

// 1. Initial Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/testdb';

// 2. Middleware
// CORS เพื่อให้ Frontend (Port 3000/5173) คุยกับ Backend (Port 5000) ได้
app.use(cors());

// Parse JSON Body (สำคัญมาก: ต้องวางก่อน Routes)
app.use(express.json());

// Debugging Middleware: ช่วยให้เราเห็นว่ามี Request อะไรเข้ามาบ้างใน Terminal
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
  next();
});

// 3. API Routes
// เส้นทางหลักสำหรับจัดการ User (Register, Login, Verify Token)
app.use('/api', userRoutes);

// Root path สำหรับเช็กว่า Server ยังมีชีวิตอยู่
app.get('/', (req: Request, res: Response) => {
  res.send('🚀 Auth API is running...');
});

// 4. Global Error Handling
// กรณีเรียก URL ที่ไม่มีในระบบ (404 Not Found)
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
      console.log(`🔗 API Base Path: http://localhost:${PORT}/api/users`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // ปิดแอปทันทีถ้าต่อ Database ไม่ได้
  });