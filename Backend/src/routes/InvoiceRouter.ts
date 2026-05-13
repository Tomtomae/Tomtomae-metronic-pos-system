import { Router } from "express";
import { 
    getInvoice, 
    getSingleInvoice,
    CreateInvoiceFromQuotation, 
    deleteInvoice ,
    recordPayment
} from '../controllers/InvoiceController.js';
import { verifyAuth } from '../middleware/auth.middleware.js'; 
const router: Router = Router();
router.use(verifyAuth);
router.get('/invoice', getInvoice); 
router.get('/invoice/:id', getSingleInvoice); 
router.post('/invoices/create-from-quotation', CreateInvoiceFromQuotation);
router.delete('/invoice/delete/:id', deleteInvoice);
router.post('/invoice/:id/pay', recordPayment);

export default router;