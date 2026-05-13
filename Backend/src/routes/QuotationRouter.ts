import { Router } from 'express'
import {
    CreateQuotation,
    getQuotations,
    SingleQuotation,
    CreateInvoiceFromQuotation,
    UpdateQuotationStatus,
    DeleteQuotation,
    getAdminList,
    UpdateQuotation
} from '../controllers/QuotationController.js'
import { verifyAuth } from '../middleware/auth.middleware.js';

const router: Router = Router()
router.use(verifyAuth)

router.get('/quotations', getQuotations)
router.post('/quotations/Create', CreateQuotation)
router.get('/quotations/admin-list', getAdminList)          
router.get('/quotations/:quotationId', SingleQuotation)   
router.patch('/quotations/:id', UpdateQuotation)
router.patch('/quotations/:quotationId/status', UpdateQuotationStatus)
router.post('/invoices/create-from-quotation', CreateInvoiceFromQuotation)
router.delete('/quotations/:id', DeleteQuotation)

export default router;