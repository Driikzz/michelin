import { Router } from 'express';
import { guestController } from '../controllers/guestController';

const router = Router();

router.post('/', guestController.create);

export default router;
