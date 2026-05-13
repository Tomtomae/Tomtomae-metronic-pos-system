import { Router ,type RequestHandler} from 'express'; 

import { 
  getUsers, 
  createUser,
  loginUser, 
  verifyToken, 
  updateProfile,
  forgotPassword
} from '../controllers/UserController.js';
import { upload } from '../middleware/multer.js';

const router: Router = Router();

router.get('/users', getUsers);
router.post('/verifyToken', verifyToken);
router.post('/register', createUser);
router.post('/login', loginUser); 
router.post('/forgot-password',forgotPassword)
router.post('/updateProfile/:id', upload.single('pic'), updateProfile as RequestHandler
); 

export default router;