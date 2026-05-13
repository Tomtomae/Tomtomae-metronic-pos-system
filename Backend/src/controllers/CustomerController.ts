import { type Request, type Response } from 'express';
import { CustomerModel } from '../models/Customers.js';
import { ROLES } from '../models/User.js';

// กำหนด Interface ให้ Request รับ user จาก Middleware
interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error);
};

export const getCustomers = async (req: AuthRequest, res: Response) => {
    try {
        const customers = await CustomerModel.find({ status: 'Active' }).populate('createdBy', 'first_name last_name email').sort({ createdAt: -1 });
        res.status(200).json(customers);
    } catch (error: unknown) {
        res.status(500).json({ message: "Error fetching customers", error: getErrorMessage(error) });
    }
};

export const getSingleCustomer = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        // 🟢 มองเห็นทุกคน: ดึงรายละเอียดได้เลยไม่ต้องเช็กสิทธิ์
        const customer = await CustomerModel.findById(id).populate('createdBy', 'first_name last_name email');

        if (!customer) {
            return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນລູກຄ້າ" });
        }
        return res.status(200).json(customer);
    } catch (error: unknown) {
        res.status(500).json({ message: "Error fetching customer", error: getErrorMessage(error) });
    }
};

export const CreateCustomer = async (req: AuthRequest, res: Response) => {
    try {
        const { name, contact, email, address, taxId, paymentTerms, website, avatar } = req.body;

        const existingCustomer = await CustomerModel.findOne({ email: email.toLowerCase().trim() });
        if (existingCustomer) {
            return res.status(400).json({ message: "ອີເມວນີ້ຖືກນຳໃຊ້ແລ້ວ" });
        }

        const lastCustomer = await CustomerModel.findOne().sort({ createdAt: -1 });
        let newNumber = 1;
        if (lastCustomer?.customerCode) {
            const lastNum = parseInt(lastCustomer.customerCode.replace(/[^0-9]/g, ''));
            if (!isNaN(lastNum)) newNumber = lastNum + 1;
        }
        const customerCode = `CUS-${newNumber.toString().padStart(4, '0')}`;

        const newCustomer = new CustomerModel({
            customerCode,
            name,
            contact,
            email: email.toLowerCase().trim(),
            address,
            taxId,
            paymentTerms,
            website,
            avatar,
            status: 'Active',
            totalOrdersAmount: 0,
            createdBy: req.user?.id // ✅ บันทึกว่าใครสร้าง
        });

        await newCustomer.save();

        return res.status(201).json({ 
            success: true, 
            message: "ສ້າງຂໍ້ມູນລູກຄ້າສຳເລັດ", 
            data: newCustomer 
        });
    } catch (error: unknown) {
        res.status(500).json({ message: "Error creating customer", error: getErrorMessage(error) });
    }
};

export const UpdateCustomer = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { address, contact, email, ...rest } = req.body;

        // 🔴 ป้องกันการแก้ไข: ถ้าเป็น Employee แก้ได้แค่ของตัวเอง
        const query: any = { _id: id };
        if (req.user?.role === ROLES.EMPLOYEE) {
            query.createdBy = req.user.id;
        }

        const updateData: Record<string, unknown> = { ...rest };

        if (email) updateData.email = email.toLowerCase().trim();

        if (address && typeof address === 'object') {
            Object.keys(address).forEach((key) => {
                updateData[`address.${key}`] = address[key];
            });
        }

        if (contact && typeof contact === 'object') {
            Object.keys(contact).forEach((key) => {
                updateData[`contact.${key}`] = contact[key];
            });
        }

        const updatedCustomer = await CustomerModel.findOneAndUpdate(
            query, 
            { $set: updateData },
            { new: true, runValidators: false }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນລູກຄ້າ (ຫຼື ທ່ານບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນນີ້)" });
        }

        return res.status(200).json({
            success: true,
            message: "ອັບເດດຂໍ້ມູນສຳເລັດ",
            data: updatedCustomer
        });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "ອີເມວນີ້ຖືກນຳໃຊ້ແລ້ວ" });
        }
        return res.status(500).json({ message: "ບໍ່ສາມາດອັບເດດຂໍ້ມູນໄດ້", error: getErrorMessage(error) });
    }
};

export const DeleteCustomer = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // 🔴 ป้องกัน: ถ้าเป็น Employee จัดการได้แค่ของตัวเอง
        const query: any = { _id: id };
        if (req.user?.role === ROLES.EMPLOYEE) {
            query.createdBy = req.user.id;
        }

        // 🌟 แก้ไข: เปลี่ยนจาก findOneAndDelete เป็นการเปลี่ยน Status -> 'Inactive' (Soft Delete)
        const deleted = await CustomerModel.findOneAndUpdate(
            query,
            { status: 'Inactive' }, // ซ่อนลูกค้าแทนการลบทิ้ง
            { new: true }
        ); 

        if (!deleted) {
            return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນລູກຄ້າ (ຫຼື ທ່ານບໍ່ມີສິດລຶບຂໍ້ມູນນີ້)" });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'ປ່ຽນສະຖານະລູກຄ້າເປັນ Inactive ສຳເລັດ' 
        });
    } catch (error: unknown) {
        return res.status(500).json({ 
            message: "ບໍ່ສາມາດລຶບຂໍ້ມູນໄດ້", 
            error: getErrorMessage(error) 
        });
    }
};