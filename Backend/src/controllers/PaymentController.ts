import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { PaymentModel } from '../models/PaymentModel.js';
import { InvoiceModel } from '../models/InvoiceNumber.js';
import { ROLES } from '../models/User.js';
import { logActivity } from '../services/ActivityLogService.js'; 

// ກຳນົດ Interface ໃຫ້ Request
interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error);
};


export const createPayment = async (req: AuthRequest, res: Response) => {
    try {
        await PaymentModel.syncIndexes();

        const { invoiceId, amount, method, reference, notes } = req.body;
        const paymentAmount = Number(amount);
        
        if (paymentAmount <= 0) {
            return res.status(400).json({ success: false, message: 'ຍອດຊຳລະຕ້ອງຫຼາຍກວ່າ 0' });
        }

        const query: Record<string, unknown> = { _id: invoiceId };
        if (req.user?.role === ROLES.EMPLOYEE) {
            query.createdBy = req.user.id;
        }

        const invoice = await InvoiceModel.findOne(query);
        if (!invoice) {
            return res.status(404).json({ success: false, message: 'ບໍ່ພົບໃບບິນ (ຫຼື ທ່ານບໍ່ມີສິດຈັດການບິນນີ້)' });
        }
        
        const currentBalance = invoice.balanceDue ?? (invoice.grandTotal - (invoice.totalPaid || 0));

        if (invoice.status === 'Paid' || currentBalance <= 0) {
            return res.status(400).json({ success: false, message: 'ໃບບິນນີ້ຖືກຊຳລະຄົບຖ້ວນແລ້ວ' });
        }

        if (paymentAmount > currentBalance) {
            return res.status(400).json({ 
                success: false, 
                message: `ຍອດຊຳລະເກີນ! ຍອດໜີ້ທີ່ເຫຼືອແມ່ນພຽງແຕ່ ${currentBalance}` 
            });
        }

        const count = await PaymentModel.countDocuments({});
        const paymentNumber = `PAY-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;

        // ຈັດການ method ໃຫ້ກົງກັບ Enum 'Cash' | 'Transfer'
        const paymentMethod = method === 'Transfer' ? 'Transfer' : 'Cash';

        const newPayment = new PaymentModel({
            paymentNumber,        
            invoice: invoice._id, // 🌟 ໃຊ້ invoice ຕາມ Model ໃໝ່                
            customer: invoice.customer,          
            currency: invoice.currency || 'LAK',  
            amount: paymentAmount, // 🌟 ໃຊ້ amount ຕາມ Model ໃໝ່         
            exchangeRate: invoice.exchangeRate || 1,
            invoiceTotalSnapshot: invoice.grandTotal || 0,
            method: paymentMethod,            
            reference: reference || '',
            notes: notes || '',
            paymentDate: new Date(),
            status: 'Completed',
            createdBy: req.user?.id
        });

        await newPayment.save();

        // ຕັດຍອດໜີ້ໃນ Invoice
        invoice.totalPaid = (invoice.totalPaid || 0) + paymentAmount;
        if (invoice.totalPaid >= invoice.grandTotal) {
            invoice.status = 'Paid';
        } else {
            invoice.status = 'Partial';
        }
        await invoice.save();

        // 🌟 ບັນທຶກປະຫວັດ (Activity Log)
        if (req.user?.id) {
            await logActivity(
                req.user.id, 
                'PAYMENT_RECEIVED', 
                'Payment', 
                newPayment._id.toString(), 
                `ຮັບຊຳລະເງິນໃບບິນ ${invoice.invoiceNumber} ຈຳນວນ ${paymentAmount} ${invoice.currency}`
            );
        }

        return res.status(201).json({ success: true, data: newPayment });

    } catch (error: unknown) {
        return res.status(500).json({ success: false, message: 'Server Error', error: getErrorMessage(error) });
    }
};

/**
 * 2. ຮັບຊຳລະເງິນໂດຍກົງ (Direct Payment - ບໍ່ມີບິນ)
 */
export const createDirectPayment = async (req: AuthRequest, res: Response) => {
    try {
        await PaymentModel.syncIndexes();

        const { amount, method, reference, notes, customer, currency } = req.body;
        const paymentAmount = Number(amount);
        
        if (paymentAmount <= 0) {
            return res.status(400).json({ success: false, message: 'ຍອດຊຳລະຕ້ອງຫຼາຍກວ່າ 0' });
        }
        if (!customer) {
            return res.status(400).json({ success: false, message: 'ກະລຸນາລະບຸຂໍ້ມູນລູກຄ້າ' });
        }

        const count = await PaymentModel.countDocuments({});
        const paymentNumber = `PAY-DIR-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;

        const paymentMethod = method === 'Transfer' ? 'Transfer' : 'Cash';

        const newPayment = new PaymentModel({
            paymentNumber,        
            customer,          
            currency: currency || 'LAK',  
            amount: paymentAmount,                
            exchangeRate: 1, 
            invoiceTotalSnapshot: paymentAmount,
            method: paymentMethod,            
            reference: reference || '',
            notes: notes || 'Direct Payment (ບໍ່ມີໃບບິນອ້າງອີງ)',
            paymentDate: new Date(),
            status: 'Completed',
            createdBy: req.user?.id
            // ⚠️ ປ່ອຍວ່າງ invoice ໄວ້ ເພາະ required: false
        });

        await newPayment.save();

        // 🌟 ບັນທຶກປະຫວັດ (Activity Log)
        if (req.user?.id) {
            await logActivity(
                req.user.id, 
                'DIRECT_PAYMENT', 
                'Payment', 
                newPayment._id.toString(), 
                `ຮັບຊຳລະເງິນໂດຍກົງຈຳນວນ ${paymentAmount} ${currency}`
            );
        }

        return res.status(201).json({ success: true, data: newPayment });

    } catch (error: unknown) {
        return res.status(500).json({ success: false, message: 'Server Error', error: getErrorMessage(error) });
    }
};

/**
 * 3. ດຶງປະຫວັດການຊຳລະເງິນ
 */
export const getPayment = async (req: AuthRequest, res: Response) => {
    try {
        // 🛡️ Data Scoping: Employee ເຫັນສະເພາະລາຍການຮັບຊຳລະຂອງຕົນເອງ
        const query: Record<string, unknown> = {};
        if (req.user?.role === ROLES.EMPLOYEE) {
            query.createdBy = req.user.id;
        }

        const payments = await PaymentModel.find(query)
            .populate('customer', 'name email contact address') 
            .populate('invoice', 'invoiceNumber grandTotal currency lineItems') // 🌟 ໃຊ້ invoice ຕາມ Model
            .populate('createdBy', 'first_name last_name email')
            .sort({ paymentDate: -1 });

        return res.status(200).json(payments);
    } catch (error: unknown) {
        return res.status(500).json({ message: "ບໍ່ສາມາດດຶງຂໍ້ມູນການຊຳລະໄດ້", error: getErrorMessage(error) });
    }
};