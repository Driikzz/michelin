import { Router } from 'express';
import { hotelController } from '../controllers/hotelController';

const router = Router();

router.get('/search', hotelController.search);
router.get('/nearby', hotelController.getNearby);
router.get('/tags', hotelController.getTags);

export default router;
