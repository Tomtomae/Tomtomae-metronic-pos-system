import { type Request, type Response } from 'express';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { ROLES } from '../models/User.js';

interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export const getActivityLogs = async (req: AuthRequest, res: Response) => {
    try {
        // 🛡️ ความปลอดภัย: อนุญาตเฉพาะ Admin เท่านั้นที่ดูประวัติระบบได้
        if (req.user?.role !== ROLES.ADMIN) {
            return res.status(403).json({ message: 'ສະຫງວນສິດສະເພາະຜູ້ເບິ່ງແຍງລະບົບ (Admin only)' });
        }

        const logs = await ActivityLogModel.find()
            .populate('user', 'first_name last_name email pic')
            .sort({ createdAt: -1 })
            .limit(100); // ดึง 100 รายการล่าสุดเพื่อไม่ให้หนักเครื่อง

        res.status(200).json(logs);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching logs", error: error.message });
    }
};