import { type Request, type Response } from 'express';
import { InvoiceModel } from '../models/InvoiceNumber.js';
import { QuotationModel } from '../models/Quotation.js';
import { User, ROLES } from '../models/User.js';
import { logActivity } from '../services/ActivityLogService.js';
import mongoose from 'mongoose';

// ✅ ແກ້ໄຂ: lowercase u (req.user) ໃຫ້ຕົງກັບ Middleware
interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error);
};

// ─── GET /invoice ─────────────────────────────────────────────
export const getInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const query: Record<string, unknown> = { isDeleted: { $ne: true } };

        // ✅ req.user (lowercase) — ຈຶ່ງດຶງ Role ໄດ້ຖືກຕ້ອງ
        const actionUser = req.user?.id ? await User.findById(req.user.id) : null;
        if (actionUser?.role === ROLES.EMPLOYEE) {
            query.createdBy = new mongoose.Types.ObjectId(req.user!.id);
        }

        const invoices = await InvoiceModel.find(query)
            .populate('customer', 'name email contact address')
            .populate('createdBy', 'first_name last_name email')
            .sort({ createdAt: -1 });

        res.status(200).json(invoices);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Error fetching invoices', error: getErrorMessage(error) });
    }
};

// ─── GET /invoice/:id ─────────────────────────────────────────
export const getSingleInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const query: Record<string, unknown> = { _id: id, isDeleted: { $ne: true } };

        // ✅ req.user (lowercase)
        if (req.user?.role === ROLES.EMPLOYEE) {
            query.createdBy = new mongoose.Types.ObjectId(req.user!.id);
        }

        const invoice = await InvoiceModel.findOne(query)
            .populate('customer', 'name email contact address')
            .populate('quotationRef')
            .populate('createdBy', 'first_name last_name email');

        if (!invoice) {
            return res.status(404).json({ message: 'ບໍ່ພົບຂໍ້ມູນບິນ (ຫຼື ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ)' });
        }

        res.status(200).json(invoice);
    } catch (error: unknown) {
        res.status(500).json({ message: 'Error', error: getErrorMessage(error) });
    }
};

// ─── POST /invoice/create-from-quotation ─────────────────────
export const CreateInvoiceFromQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { quotationId, dueDate } = req.body;

        const quotation = await QuotationModel.findById(quotationId);
        if (!quotation) return res.status(404).json({ message: 'ບໍ່ພົບໃບສະເໜີລາຄາ' });

        if (quotation.status !== 'Approved') {
            return res.status(400).json({ message: 'ໃບສະເໜີລາຄາຍັງບໍ່ໄດ້ຮັບການອະນຸມັດ' });
        }

        const existing = await InvoiceModel.findOne({ quotationRef: quotationId });
        if (existing) return res.status(400).json({ message: 'ໃບສະເໜີລາຄານີ້ຖືກສ້າງເປັນໃບແຈ້ງໜີ້ແລ້ວ' });

        const lastInvoice = await InvoiceModel.findOne().sort({ createdAt: -1 });
        let invNumber = 1;
        if (lastInvoice?.invoiceNumber) {
            const lastNum = parseInt(lastInvoice.invoiceNumber.replace(/[^0-9]/g, ''));
            if (!isNaN(lastNum)) invNumber = lastNum + 1;
        }
        const invoiceNumber = `INV-${invNumber.toString().padStart(4, '0')}`;

        const newInvoice = new InvoiceModel({
            invoiceNumber,
            quotationRef:  quotation._id,
            customer:      quotation.customer,
            description:   quotation.description,
            currency:      quotation.currency,
            exchangeRate:  quotation.exchangeRate || 1,
            lineItems:     quotation.lineItems,
            subtotal:      quotation.subtotal,
            totalTax:      quotation.totalTax,
            grandTotal:    quotation.grandTotal,
            issueDate:     new Date(),
            dueDate:       dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            totalPaid:     0,
            balanceDue:    quotation.grandTotal,
            status:        'Pending',
            // ✅ ໃຊ້ createdBy ຂອງ Quotation (Employee) ບໍ່ແມ່ນ Admin ທີ່ກົດ
            createdBy:     quotation.createdBy,
        });

        await newInvoice.save();

        quotation.status = 'Invoiced';
        await quotation.save();

        // ✅ req.user (lowercase)
        if (req.user?.id) {
            await logActivity(
                req.user.id, 'CREATE', 'Invoice',
                newInvoice._id.toString(),
                `ສ້າງໃບແຈ້ງໜີ້ ${invoiceNumber} ຈາກ Quotation`
            );
        }

        res.status(201).json({ success: true, data: newInvoice });
    } catch (error: unknown) {
        res.status(500).json({ message: 'Server Error', error: getErrorMessage(error) });
    }
};

// ─── DELETE /invoice/delete/:id ───────────────────────────────
export const deleteInvoice = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // ✅ req.user (lowercase)
        if (req.user?.role === ROLES.EMPLOYEE) {
            return res.status(403).json({ message: 'ບໍ່ມີສິດອະນຸຍາດ! ພະນັກງານບໍ່ສາມາດຍົກເລີກບິນໄດ້.' });
        }

        const query: Record<string, unknown> = { _id: id, isDeleted: { $ne: true } };

        const deleted = await InvoiceModel.findOneAndUpdate(
            query,
            { isDeleted: true },
            { returnDocument: 'after' }
        );

        if (!deleted) {
            return res.status(404).json({ message: 'ບໍ່ພົບຂໍ້ມູນ (ຫຼື ບິນນີ້ຖືກລຶບໄປແລ້ວ)' });
        }

        // ✅ req.user (lowercase)
        if (req.user?.id) {
            await logActivity(
                req.user.id, 'CANCEL', 'Invoice',
                deleted._id.toString(),
                `ຍົກເລີກໃບແຈ້ງໜີ້ ${deleted.invoiceNumber}`
            );
        }

        res.status(200).json({ message: 'ຍົກເລີກໃບແຈ້ງໜີ້ສຳເລັດ (Voided)' });
    } catch (error: unknown) {
        res.status(500).json({ message: 'Error', error: getErrorMessage(error) });
    }
};

// ─── POST /invoice/:id/payment ────────────────────────────────
export const recordPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;

        const query: Record<string, unknown> = { _id: id, isDeleted: { $ne: true } };

        // ✅ req.user (lowercase)
        if (req.user?.role === ROLES.EMPLOYEE) {
            query.createdBy = new mongoose.Types.ObjectId(req.user!.id);
        }

        const invoice = await InvoiceModel.findOne(query);
        if (!invoice) {
            return res.status(404).json({ message: 'ບໍ່ພົບໃບແຈ້ງໜີ້ (ຫຼື ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ)' });
        }

        if (invoice.status === 'Cancelled') {
            return res.status(400).json({ message: 'ບິນນີ້ຖືກຍົກເລີກແລ້ວ ບໍ່ສາມາດຊຳລະເງິນໄດ້' });
        }

        invoice.totalPaid = (invoice.totalPaid || 0) + Number(amount);
        await invoice.save();

        // ✅ req.user (lowercase)
        if (req.user?.id) {
            await logActivity(
                req.user.id, 'UPDATE', 'Invoice',
                invoice._id.toString(),
                `ບັນທຶກການຊຳລະ ${amount} ສໍາລັບບິນ ${invoice.invoiceNumber}`
            );
        }

        res.status(200).json({ success: true, message: 'ຊຳລະສຳເລັດ', data: invoice });
    } catch (error: unknown) {
        res.status(500).json({ message: 'Error', error: getErrorMessage(error) });
    }
};

// ─── PATCH /invoice/:id/payment ───────────────────────────────
export const updatePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { totalPaid } = req.body;

        const query: Record<string, unknown> = { _id: id, isDeleted: { $ne: true } };
        const actionUser = req.user?.id ? await User.findById(req.user.id) : null;
        if (actionUser?.role === ROLES.EMPLOYEE) {
            query.createdBy = new mongoose.Types.ObjectId(req.user!.id);
        }

        const invoice = await InvoiceModel.findOne(query);
        if (!invoice) {
            return res.status(404).json({ message: 'ບໍ່ພົບຂໍ້ມູນ (ຫຼື ທ່ານບໍ່ມີສິດ)' });
        }

        invoice.totalPaid = totalPaid;
        await invoice.save();

        return res.status(200).json({ success: true, message: 'ອັບເດດການຊຳລະສຳເລັດ', data: invoice });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: 'Error updating payment', error: getErrorMessage(error) });
    }
};