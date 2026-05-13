import { type Request, type Response } from "express";
import mongoose from "mongoose";
import { QuotationModel } from "../models/Quotation.js";
import { InvoiceModel } from "../models/InvoiceNumber.js";
import { NotificationModel } from "../models/Notification.js";
import { User, ROLES } from "../models/User.js";

interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    return String(error);
};

interface ILineItem {
    item: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    type: string;
    unit: string;
    quantity: number;
    price: number;
    taxRate: number;
    amount: number;
    taxAmount: number;
    total: number;
}

interface IQuotationData {
    _id: mongoose.Types.ObjectId | string;
    customer: mongoose.Types.ObjectId | string;
    currency: string;
    exchangeRate: number;
    description?: string;
    lineItems: ILineItem[];
    subtotal: number;
    totalTax: number;
    grandTotal: number;
    notes?: string;
    status?: string;
    createdBy?: mongoose.Types.ObjectId | string;
}

// ─── Helper: Generate Invoice ─────────────────────────────────
const generateInvoiceLogic = async (
    quotation: IQuotationData,
    dueDate?: Date,
    createdBy?: string
) => {
    const lastInvoice = await InvoiceModel.findOne().sort({ createdAt: -1 });
    let invNumber = 1;
    if (lastInvoice?.invoiceNumber) {
        const lastNum = parseInt(lastInvoice.invoiceNumber.replace(/[^0-9]/g, ''));
        if (!isNaN(lastNum)) invNumber = lastNum + 1;
    }

    const newInvoice = new InvoiceModel({
        invoiceNumber: `INV-${invNumber.toString().padStart(4, '0')}`,
        quotationRef:  quotation._id,
        customer:      quotation.customer,
        currency:      quotation.currency,
        exchangeRate:  quotation.exchangeRate || 1,
        description:   quotation.description,
        lineItems:     quotation.lineItems,
        subtotal:      quotation.subtotal,
        totalTax:      quotation.totalTax,
        grandTotal:    quotation.grandTotal,
        issueDate:     new Date(),
        dueDate:       dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        totalPaid:     0,
        balanceDue:    quotation.grandTotal,
        status:        'Pending',
        notes:         quotation.notes,
        createdBy:     createdBy,
    });

    return await newInvoice.save();
};

// ─── GET /quotations ──────────────────────────────────────────
export const getQuotations = async (req: AuthRequest, res: Response) => {
    try {
        const query: Record<string, unknown> = { isDeleted: false };
        const actionUser = req.user?.id ? await User.findById(req.user.id) : null;
        if (actionUser?.role === ROLES.EMPLOYEE) {
            query.createdBy = req.user?.id;
        }
        const quotations = await QuotationModel.find(query)
            .populate('customer')
            .populate('createdBy', '-password')
            .sort({ createdAt: -1 });
        res.status(200).json(quotations);
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: "Error fetching quotations", error: getErrorMessage(error) });
    }
};

// ─── GET /quotations/:quotationId ─────────────────────────────
export const SingleQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const quotationId = req.params.quotationId as string;
        if (!quotationId) return res.status(400).json({ message: "ກະລຸນາລະບຸລະຫັດໃບສະເໜີລາຄາ" });

        const query: Record<string, unknown> = { isDeleted: false };
        const actionUser = req.user?.id ? await User.findById(req.user.id) : null;
        if (actionUser?.role === ROLES.EMPLOYEE) {
            query.createdBy = req.user?.id;
        }

        let quotation;
        if (mongoose.Types.ObjectId.isValid(quotationId)) {
            quotation = await QuotationModel.findOne({ _id: quotationId, ...query })
                .populate('customer').populate('createdBy', '-password');
        } else {
            quotation = await QuotationModel.findOne({ quotationId, ...query })
                .populate('customer').populate('createdBy', '-password');
        }

        if (!quotation) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນ (ຫຼື ທ່ານບໍ່ມີສິດເຂົ້າເຖິງ)" });
        return res.status(200).json(quotation);
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: "Error fetching quotation", error: getErrorMessage(error) });
    }
};

// ─── POST /quotations/Create ──────────────────────────────────
export const CreateQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const {
            customer, description, currency, exchangeRate, lineItems,
            issueDate, validUntil, notes, status, termsConditions, assignedAdminId,
        } = req.body;

        const lastQuotation = await QuotationModel.findOne().sort({ createdAt: -1 });
        let newNumber = 1;
        if (lastQuotation?.quotationId) {
            const lastNum = parseInt(lastQuotation.quotationId.replace(/[^0-9]/g, ''));
            if (!isNaN(lastNum)) newNumber = lastNum + 1;
        }
        const newQuotationId = `QUO-${newNumber.toString().padStart(4, '0')}`;

        let calculatedSubtotal = 0;
        let calculatedTotalTax = 0;
        const processedLineItems = (lineItems as ILineItem[]).map((item) => {
            const amount    = item.price * item.quantity;
            const taxAmount = amount * (item.taxRate / 100);
            calculatedSubtotal  += amount;
            calculatedTotalTax  += taxAmount;
            return { ...item, amount, taxAmount, total: amount + taxAmount };
        });

        const newQuotation = new QuotationModel({
            quotationId:  newQuotationId,
            customer, description,
            status:       status || 'Draft',
            currency:     currency || 'LAK',
            exchangeRate: exchangeRate || 1,
            lineItems:    processedLineItems,
            subtotal:     calculatedSubtotal,
            totalTax:     calculatedTotalTax,
            grandTotal:   calculatedSubtotal + calculatedTotalTax,
            issueDate:    issueDate  || new Date(),
            validUntil:   validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            notes, termsConditions,
            createdBy:    req.user?.id,
        });

        const savedQuotation = await newQuotation.save();
        const actionUser = req.user?.id ? await User.findById(req.user.id) : null;

        if (actionUser?.role === ROLES.EMPLOYEE && status === 'Sent') {
            let recipientId: mongoose.Types.ObjectId | undefined;
            if (assignedAdminId && mongoose.Types.ObjectId.isValid(assignedAdminId)) {
                recipientId = new mongoose.Types.ObjectId(assignedAdminId as string);
            } else {
                const fallback = await User.findOne({ role: ROLES.ADMIN, isDeleted: { $ne: true } });
                if (fallback) recipientId = fallback._id as mongoose.Types.ObjectId;
            }
            if (recipientId) {
                await NotificationModel.create({
                    recipient:   recipientId,
                    ...(req.user?.id && { sender: new mongoose.Types.ObjectId(req.user.id) }),
                    type:        'QUOTATION_APPROVAL',
                    message:     `📄 ມີໃບສະເໜີລາຄາໃໝ່ ${newQuotationId} ສົ່ງມາເພື່ອຂໍການອະນຸມັດ`,
                    referenceId: savedQuotation._id,
                    isRead:      false,
                });
            }
        }

        let createdInvoice = null;
        if (status === 'Approved') {
            createdInvoice = await generateInvoiceLogic(
                savedQuotation as unknown as IQuotationData,
                validUntil,
                String(savedQuotation.createdBy) // ✅ Employee ID
            );
            savedQuotation.status = 'Invoiced';
            await savedQuotation.save();
        }

        res.status(201).json({
            success:   true,
            message:   status === 'Approved' ? "ສ້າງໃບສະເໜີ ແລະ ໃບແຈ້ງໜີ້ສຳເລັດ" : "ສ້າງໃບສະເໜີລາຄາສຳເລັດ",
            quotation: savedQuotation,
            invoice:   createdInvoice,
        });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: "Error creating quotation", error: getErrorMessage(error) });
    }
};

// ─── POST /invoices/create-from-quotation ─────────────────────
export const CreateInvoiceFromQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { quotationId, dueDate } = req.body;
        const quotation = await QuotationModel.findOne({ _id: quotationId, isDeleted: false });
        if (!quotation) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນໃບສະເໜີລາຄາ" });
        if (quotation.status === 'Invoiced') return res.status(400).json({ message: "ສ້າງ Invoice ໄປແລ້ວ" });

        const newInvoice = await generateInvoiceLogic(
            quotation as unknown as IQuotationData,
            dueDate,
            String(quotation.createdBy) // ✅ Employee ID
        );
        quotation.status = 'Invoiced';
        await quotation.save();

        if (quotation.createdBy) {
            await NotificationModel.create({
                recipient:   quotation.createdBy,
                ...(req.user?.id && { sender: new mongoose.Types.ObjectId(req.user.id) }),
                type:        'QUOTATION_APPROVED',
                message:     `✅ ໃບສະເໜີລາຄາ ${quotation.quotationId} ຖືກອະນຸມັດ ແລະ ອອກໃບແຈ້ງໜີ້ແລ້ວ`,
                referenceId: quotation._id,
                isRead:      false,
            });
        }
        res.status(201).json({ success: true, message: "ສ້າງໃບແຈ້ງໜີ້ສຳເລັດ", data: newInvoice });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: "Server Error", error: getErrorMessage(error) });
    }
};

// ─── PATCH /quotations/:quotationId/status ────────────────────
export const UpdateQuotationStatus = async (req: AuthRequest, res: Response) => {
    try {
        const quotationId   = req.params.quotationId as string;
        const { status, assignedAdminId } = req.body;

        if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
        const actionUser = await User.findById(req.user.id);
        if (!actionUser)  return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້" });

        const restrictedStatuses = ['Approved', 'Rejected', 'Declined', 'Invoiced'];
        if (actionUser.role === ROLES.EMPLOYEE && restrictedStatuses.includes(status)) {
            return res.status(403).json({ success: false, message: "ທ່ານບໍ່ມີສິດໃນການອະນຸມັດ ຫຼື ປະຕິເສດ" });
        }

        const quotation = await QuotationModel.findOne({ _id: quotationId, isDeleted: false });
        if (!quotation) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນ" });

        // ─── Admin Approve → ສ້າງ Invoice ────────────────────
        if (actionUser.role === ROLES.ADMIN && status === 'Approved') {
            if (quotation.status === 'Invoiced') return res.status(400).json({ message: "ສ້າງ Invoice ໄປແລ້ວ" });

            const newInvoice = await generateInvoiceLogic(
                quotation as unknown as IQuotationData,
                undefined,
                String(quotation.createdBy) // ✅ ແກ້ຈາກ req.user.id → quotation.createdBy (Employee ID)
            );
            quotation.status = 'Invoiced';
            await quotation.save();

            if (quotation.createdBy) {
                await NotificationModel.create({
                    recipient:   quotation.createdBy,
                    ...(req.user?.id && { sender: new mongoose.Types.ObjectId(req.user.id) }),
                    type:        'QUOTATION_APPROVED',
                    message:     `✅ ໃບສະເໜີລາຄາ ${quotation.quotationId} ຖືກອະນຸມັດ ແລະ ອອກໃບແຈ້ງໜີ້ແລ້ວ`,
                    referenceId: quotation._id,
                    isRead:      false,
                });
            }
            return res.status(200).json({ success: true, message: "ອນຸມັດ ແລະ ສ້າງໃບແຈ້ງໜີ້ສຳເລັດ", data: quotation, invoice: newInvoice });
        }

        // ─── Sent / Rejected / อื่นๆ ─────────────────────────
        quotation.status = status;
        await quotation.save();

        // Employee ສົ່ງ → ແຈ້ງ Admin
        if (actionUser.role === ROLES.EMPLOYEE && status === 'Sent') {
            let recipientId: mongoose.Types.ObjectId | undefined;
            if (assignedAdminId && mongoose.Types.ObjectId.isValid(assignedAdminId)) {
                recipientId = new mongoose.Types.ObjectId(assignedAdminId as string);
            } else {
                const fallback = await User.findOne({ role: ROLES.ADMIN, isDeleted: { $ne: true } });
                if (fallback) recipientId = fallback._id as mongoose.Types.ObjectId;
            }
            if (recipientId) {
                await NotificationModel.create({
                    recipient:   recipientId,
                    ...(req.user?.id && { sender: new mongoose.Types.ObjectId(req.user.id) }),
                    type:        'QUOTATION_APPROVAL',
                    message:     `📄 ໃບສະເໜີລາຄາ ${quotation.quotationId} ຖືກສົ່ງມາເພື່ອຂໍການອະນຸມັດ`,
                    referenceId: quotation._id,
                    isRead:      false,
                });
            }
        }

        // Admin Reject → ແຈ້ງ Employee
        if (actionUser.role === ROLES.ADMIN && (status === 'Rejected' || status === 'Declined')) {
            if (quotation.createdBy) {
                await NotificationModel.create({
                    recipient:   quotation.createdBy,
                    ...(req.user?.id && { sender: new mongoose.Types.ObjectId(req.user.id) }),
                    type:        'QUOTATION_REJECTED',
                    message:     `❌ ໃບສະເໜີລາຄາ ${quotation.quotationId} ຂອງທ່ານຖືກປະຕິເສດ`,
                    referenceId: quotation._id,
                    isRead:      false,
                });
            }
        }

        return res.status(200).json({ success: true, message: "ອັບເດດສະຖານະສຳເລັດ", data: quotation });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: "Error updating status", error: getErrorMessage(error) });
    }
};

// ─── DELETE /quotations/:id ───────────────────────────────────
export const DeleteQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const id    = req.params.id as string;
        const query: Record<string, unknown> = { _id: id, isDeleted: false };
        const actionUser = req.user?.id ? await User.findById(req.user.id) : null;
        if (actionUser?.role === ROLES.EMPLOYEE) query.createdBy = req.user?.id;

        const deleted = await QuotationModel.findOneAndUpdate(query, { isDeleted: true }, { new: true });
        if (!deleted) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນ (ຫຼື ທ່ານບໍ່ມີສິດລຶບ)" });

        res.status(200).json({ success: true, message: "ລົບຂໍ້ມູນໃບສະເໜີລາຄາສຳເລັດ" });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: "Error deleting quotation", error: getErrorMessage(error) });
    }
};

// ─── GET /quotations/admin-list ───────────────────────────────
export const getAdminList = async (req: Request, res: Response) => {
    try {
        const admins = await User.find({ role: ROLES.ADMIN, isDeleted: { $ne: true } })
            .select('_id first_name last_name');
        return res.status(200).json({ success: true, data: admins });
    } catch (error: unknown) {
        return res.status(500).json({ success: false, message: "Error fetching admins" });
    }
};

// ─── PATCH /quotations/:id ────────────────────────────────────
export const UpdateQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const {
            customer, description, currency, exchangeRate,
            lineItems, issueDate, validUntil, notes,
            status, termsConditions, assignedAdminId,
        } = req.body;

        let calculatedSubtotal = 0;
        let calculatedTotalTax = 0;
        const processedLineItems = (lineItems as ILineItem[]).map(item => {
            const amount    = item.price * item.quantity;
            const taxAmount = amount * (item.taxRate / 100);
            calculatedSubtotal  += amount;
            calculatedTotalTax  += taxAmount;
            return { ...item, amount, taxAmount, total: amount + taxAmount };
        });

        const updatedQuotation = await QuotationModel.findOneAndUpdate(
            { _id: id, isDeleted: false },
            {
                $set: {
                    customer, description, currency,
                    exchangeRate:  exchangeRate || 1,
                    lineItems:     processedLineItems,
                    subtotal:      calculatedSubtotal,
                    totalTax:      calculatedTotalTax,
                    grandTotal:    calculatedSubtotal + calculatedTotalTax,
                    issueDate, validUntil, notes, status, termsConditions,
                },
            },
            { new: true }
        );

        if (!updatedQuotation) return res.status(404).json({ message: "ບໍ່ພົບຂໍ້ມູນ" });

        const actionUser = req.user?.id ? await User.findById(req.user.id) : null;
        if (actionUser?.role === ROLES.EMPLOYEE && status === 'Sent') {
            let recipientId: mongoose.Types.ObjectId | undefined;
            if (assignedAdminId && mongoose.Types.ObjectId.isValid(assignedAdminId)) {
                recipientId = new mongoose.Types.ObjectId(assignedAdminId as string);
            } else {
                const fallback = await User.findOne({ role: ROLES.ADMIN, isDeleted: { $ne: true } });
                if (fallback) recipientId = fallback._id as mongoose.Types.ObjectId;
            }
            if (recipientId) {
                await NotificationModel.create({
                    recipient:   recipientId,
                    ...(req.user?.id && { sender: new mongoose.Types.ObjectId(req.user.id) }),
                    type:        'QUOTATION_APPROVAL',
                    message:     `📄 ໃບສະເໜີລາຄາ ${updatedQuotation.quotationId} ຖືກສົ່ງມາເພື່ອຂໍການອະນຸມັດ`,
                    referenceId: updatedQuotation._id,
                    isRead:      false,
                });
            }
        }

        return res.status(200).json({ success: true, message: "ແກ້ໄຂໃບສະເໜີສຳເລັດ", quotation: updatedQuotation });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: "Error updating quotation", error: getErrorMessage(error) });
    }
};