import { Router } from "express";
import { 
    CreateItemServices, 
    DeleteItemServices, 
    getItemServices, 
    UpdateItemServices, 
    getSingleItemService
} from "../controllers/ItemServicesController.js";
import { verifyAuth } from '../middleware/auth.middleware.js';
const router: Router = Router();
router.use(verifyAuth);

router.get('/itemServices', getItemServices);
router.get('/itemServices/:ItemCode', getSingleItemService);
router.post('/itemServices', CreateItemServices);
router.delete('/itemServices/:ItemCode', DeleteItemServices);
router.put('/itemServices/:ItemCode', UpdateItemServices);

export default router;