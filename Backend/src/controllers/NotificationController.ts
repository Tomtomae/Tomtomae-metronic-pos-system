import { type Request, type Response } from 'express';
import mongoose from "mongoose";
import { NotificationModel } from '../models/Notification.js';

interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        
        // 🔍 DEBUG: ເບິ່ງວ່າ User ທີ່ Login ຢູ່ແມ່ນໃຜ
        console.log("-----------------------------------------");
        console.log("Current Logged-in User ID:", userId);

        if (!userId) {
            return res.status(401).json({ message: 'ບໍ່ໄດ້ຮັບອະນຸຍາດ (Unauthorized)' });
        }

        // 🌟 ປ່ຽນ string ເປັນ ObjectId ເພື່ອຄວາມແນ່ນອນໃນການ Query
        const recipientId = new mongoose.Types.ObjectId(userId);

        const notifications = await NotificationModel.find({ recipient: recipientId })
            .populate('sender', 'first_name last_name pic') 
            .sort({ createdAt: -1 })
            .limit(50);
            
        // 🔍 DEBUG: ເບິ່ງວ່າ Query ເຈີຈັກລາຍການ
        console.log("Notifications Found in DB:", notifications.length);
        console.log("-----------------------------------------");

        return res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error: unknown) {
        const err = error as Error;
        console.error("Fetch Notif Error:", err.message);
        return res.status(500).json({ message: 'Error fetching notifications' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.id;

        if (!userId || !id) {
            return res.status(400).json({ message: 'ຂໍ້ມູນບໍ່ຄົບຖ້ວນ' });
        }
        const result = await NotificationModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id), recipient: new mongoose.Types.ObjectId(userId) },
            { isRead: true },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'ບໍ່ພົບຂໍ້ມູນແຈ້ງເຕືອນ' });
        }

        return res.status(200).json({ success: true });
    } catch (error: unknown) {  
        return res.status(500).json({ message: 'Error updating notification' });
    }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const userId = req.user?.id;

        // 🔍 DEBUG: ກວດເບິ່ງວ່າມີການຍິງ API ມາຮອດ Controller ຫຼືບໍ່
        console.log("=== DELETE NOTIFICATION HIT ===");
        console.log("Notif ID to delete:", id);
        console.log("User ID requesting:", userId);

        if (!userId || !id) {
            console.log("-> Error: ຂໍ້ມູນບໍ່ຄົບ");
            return res.status(400).json({ message: 'ຂໍ້ມູນບໍ່ຄົບຖ້ວນ' });
        }

        const result = await NotificationModel.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(id),
            recipient: new mongoose.Types.ObjectId(userId)
        });

        if (!result) {
            // 🔍 ຖ້າອອກ 404 ຢູ່ຈຸດນີ້ ສະແດງວ່າມີ ID ດັ່ງກ່າວ ແຕ່ບໍ່ແມ່ນຂອງ User ທີ່ກຳລັງ Login
            console.log("-> 404: ບໍ່ພົບໃນ DB ຫຼື ບໍ່ແມ່ນແຈ້ງເຕືອນຂອງ User ນີ້");
            return res.status(404).json({ message: 'ບໍ່ພົບຂໍ້ມູນແຈ້ງເຕືອນ ຫຼື ຖືກລຶບໄປແລ້ວ' });
        }

        console.log("-> Successfully deleted");
        return res.status(200).json({ success: true, message: 'ລຶບແຈ້ງເຕືອນສຳເລັດແລ້ວ' });
        
    } catch (error: unknown) {
        const err = error as Error;
        console.error("Delete Notif Error:", err.message);
        return res.status(500).json({ message: 'Error deleting notification' });
    }
};