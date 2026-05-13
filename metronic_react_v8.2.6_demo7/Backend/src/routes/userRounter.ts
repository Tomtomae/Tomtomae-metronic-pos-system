import { Router } from 'express';
import { 
  getUsers, 
  createUser,
  loginUser, 
  verifyToken, 
  updateProfile,
} from '../controllers/UserController.js';
const router: Router = Router();

router.get('/Users', getUsers);
router.post('/verifyToken', verifyToken);
router.post('/register', createUser);

router.post('/login', loginUser); 
router.put('/:id', updateProfile);
export default router;