import { Router } from 'express';
import { restaurantController } from '../controllers/restaurantController';

const router = Router();

router.get('/search', restaurantController.search);
router.get('/tags', restaurantController.getTags);

export default router;
