// middlewares/auth.middleware.ts
import { type Request,type Response,type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ROLES } from '../models/User.js';

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

// 1. ตรวจสอบว่า Login หรือยัง
export const verifyAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]; // รับ Token จาก Header Bearer
    
    if (!token) return res.status(401).json({ success: false, message: "ບໍ່ມີ Token, ກະລຸນາເຂົ້າສູ່ລະບົບ" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string, role: string };
        req.user = decoded; // เก็บข้อมูล user ไว้ใช้ใน controller ถัดไป
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: "Token ໝົດອາຍຸ ຫຼື ບໍ່ຖືກຕ້ອງ" });
    }
};

// 2. ตรวจสอบว่าเป็น Admin หรือไม่
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === ROLES.ADMIN) {
        next();
    } else {
        res.status(403).json({ success: false, message: "ສະເພາະ Admin ເທົ່ານັ້ນທີ່ສາມາດເຂົ້າເຖິງໄດ້" });
    }
};