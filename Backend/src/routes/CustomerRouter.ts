import { Router } from "express";
import { 
    getCustomers, 
    CreateCustomer, 
    DeleteCustomer, 
    UpdateCustomer, 
    getSingleCustomer 
} from '../controllers/CustomerController.js';
import { verifyAuth } from '../middleware/auth.middleware.js'; // ເຊັກ Path ໃຫ້ຖືກຕ້ອງນຳເດີ້ (middleware ຫຼື middlewares)

const router: Router = Router();

// ✅ ໃສ່ບ່ອນນີ້ບ່ອນດຽວ ທຸກ Route ທາງລຸ່ມຈະຖືກປ້ອງກັນທັງໝົດ
router.use(verifyAuth);

router.get('/Customer', getCustomers);
router.get('/Customer/:id', getSingleCustomer);
router.post('/Customer/Create', CreateCustomer);
router.patch('/Customer/:id', UpdateCustomer);
router.delete('/Customer/:id', DeleteCustomer);

export default router;