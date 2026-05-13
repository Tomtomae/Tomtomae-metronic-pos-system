import { type Request, type Response } from 'express';
import { InvoiceModel } from '../models/InvoiceNumber.js';
import { QuotationModel } from '../models/Quotation.js';
import { ROLES } from '../models/User.js';

interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const query: Record<string, unknown> = {};
        if (req.user?.role === ROLES.EMPLOYEE) {
            query.createdBy = req.user?.id;
        }

        // 1. ນັບຈຳນວນເອກະສານ
        const totalQuotations = await QuotationModel.countDocuments(query);
        const totalInvoices = await InvoiceModel.countDocuments(query);
        
        // ສະເພາະ Admin ເທົ່ານັ້ນທີ່ຈະເຫັນຍອດລໍຖ້າອະນຸມັດຂອງທັງລະບົບ
        const pendingApprovals = req.user?.role === ROLES.ADMIN 
            ? await QuotationModel.countDocuments({ status: 'Pending Approval' }) 
            : 0;

        // 2. ຄິດໄລ່ຍອດລາຍຮັບ (Revenue) ແຍກຕາມສະກຸນເງິນ (LAK, THB, USD)
        const revenueAggregation = await InvoiceModel.aggregate([
            { $match: { ...query, status: { $in: ['Paid', 'Partial'] } } },
            { 
                $group: { 
                    _id: "$currency", 
                    totalRevenue: { $sum: "$totalPaid" },
                    outstandingBalance: { $sum: "$balanceDue" }
                } 
            }
        ]);

        // ຈັດຮູບແບບຂໍ້ມູນເພື່ອສົ່ງໃຫ້ Frontend
        const financials = {
            LAK: { revenue: 0, outstanding: 0 },
            THB: { revenue: 0, outstanding: 0 },
            USD: { revenue: 0, outstanding: 0 }
        };

        revenueAggregation.forEach(item => {
            if (item._id === 'LAK') financials.LAK = { revenue: item.totalRevenue, outstanding: item.outstandingBalance };
            if (item._id === 'THB') financials.THB = { revenue: item.totalRevenue, outstanding: item.outstandingBalance };
            if (item._id === 'USD') financials.USD = { revenue: item.totalRevenue, outstanding: item.outstandingBalance };
        });

        res.status(200).json({
            documents: {
                quotations: totalQuotations,
                invoices: totalInvoices,
                pendingApprovals: pendingApprovals
            },
            financials: financials // ສົ່ງຍອດເງິນທີ່ແຍກສະກຸນເງິນແລ້ວໄປໃຫ້ໜ້າບ້ານ
        });

    } catch (error: unknown) {
        res.status(500).json({ message: 'Error loading dashboard metrics' });
    }
};