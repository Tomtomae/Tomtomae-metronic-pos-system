import { type Request, type Response } from 'express';
import { ItemModel } from '../models/ItemServices.js';
import { ROLES } from '../models/User.js';

// กำหนด Interface ให้ Request
interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error);
};

export const getItemServices = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 🟢 มองเห็นทุกคน: ดึงทั้งหมดมาแสดงให้ทุกคนเลือกใช้ได้
        const filter: any = req.query.status ? { status: String(req.query.status) } : {};
        const items = await ItemModel.find(filter)
            .populate('createdBy', 'first_name last_name email')
            .sort({ createdAt: -1 });
        
        res.status(200).json(items);
    } catch (error: unknown) {
        res.status(500).json({ message: "Error fetching items", error: getErrorMessage(error) });
    }
};

export const getSingleItemService = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const { ItemCode } = req.params;
        if (!ItemCode) return res.status(400).json({ message: "ItemCode is required" });
        
        // 🟢 มองเห็นทุกคน: ไม่ต้องดัก Role 
        const item = await ItemModel.findOne({ ItemCode: ItemCode })
            .populate('createdBy', 'first_name last_name email');
            
        if (!item) return res.status(404).json({ message: "Item not found" });
        
        res.status(200).json(item);
    } catch (error: unknown) {
        res.status(500).json({ message: "Error fetching item", error: getErrorMessage(error) });
    }
};

export const CreateItemServices = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const { 
            ItemCode, Iname, description, category, 
            type, unit, currency, costPrice, price, taxRate, status 
        } = req.body as Record<string, unknown>;

        if (!ItemCode || !Iname || !type || !unit || price === undefined) {
            return res.status(400).json({ message: "ກະລຸນາປ້ອນຂໍ້ມູນຫຼັກໃຫ້ຄົບຖ້ວນ" });
        }

        const existingItem = await ItemModel.findOne({ ItemCode: String(ItemCode) });
        if (existingItem) {
            return res.status(400).json({ message: "ລະຫັດສິນຄ້ານີ້ (ItemCode) ມີໃນລະບົບແລ້ວ ກະລຸນາໃຊ້ລະຫັດອື່ນ" });
        }

        const newItemServices = new ItemModel({
            ItemCode: String(ItemCode),
            Iname: String(Iname),
            description: description ? String(description) : '',
            category: category ? String(category) : 'General',
            type: String(type),
            unit: String(unit),
            currency: currency ? String(currency) : 'LAK',
            costPrice: Number(costPrice) || 0,
            price: Number(price),
            taxRate: Number(taxRate) || 0,
            status: status ? String(status) : 'Active',
            // ✅ บันทึกว่าใครเป็นคนสร้าง Item นี้
            createdBy: req.user?.id 
        });

        await newItemServices.save();
        res.status(201).json({ message: "Item created successfully", item: newItemServices });
    } catch (error: unknown) {
        res.status(500).json({ message: "Error creating item", error: getErrorMessage(error) });
    }
};

export const UpdateItemServices = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const { ItemCode } = req.params;
        if (!ItemCode) return res.status(400).json({ message: "ItemCode is required" });

        // 🔴 ป้องกันการแก้ไข: ถ้า Employee ต้องเป็นคนสร้างถึงแก้ได้
        const query: any = { ItemCode: ItemCode };
        if (req.user?.role === ROLES.EMPLOYEE) {
            query.createdBy = req.user.id;
        }

        const updatedItem = await ItemModel.findOneAndUpdate(
            query,
            { $set: req.body as Record<string, unknown> },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນທີ່ຕ້ອງການແກ້ໄຂ (ຫຼື ທ່ານບໍ່ມີສິດແກ້ໄຂ)" });
        }

        res.status(200).json({ message: "Item updated successfully", item: updatedItem });
    } catch (error: unknown) {
        res.status(500).json({ message: "Error updating item", error: getErrorMessage(error) });
    }
};

export const DeleteItemServices = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const { ItemCode } = req.params;
        if (!ItemCode) return res.status(400).json({ message: "ItemCode is required" });

        // 🔴 ป้องกันการลบ (เปลี่ยนสถานะ): ถ้า Employee ต้องเป็นคนสร้างถึงเปลี่ยนได้
        const query: any = { ItemCode: ItemCode };
        if (req.user?.role === ROLES.EMPLOYEE) {
            query.createdBy = req.user.id;
        }

        const DeletedItem = await ItemModel.findOneAndUpdate(
            query,
            { $set: { status: 'Inactive' } },
            { new: true }
        );

        if (!DeletedItem) {
            return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນ (ຫຼື ທ່ານບໍ່ມີສິດປ່ຽນສະຖານະ)" });
        }

        res.status(200).json({ message: "Item moved to inactive successfully", item: DeletedItem });
    } catch (error: unknown) {
        res.status(500).json({ message: "Error deleting item", error: getErrorMessage(error) });
    }
};