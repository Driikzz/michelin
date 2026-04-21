import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { optionalAuthenticate } from '../middleware/optionalAuthenticate';
import { roomController } from '../controllers/roomController';

const router = Router();

router.post('/', authenticate, roomController.create);
router.get('/:id', roomController.getRoom);
router.post('/:id/join', optionalAuthenticate, roomController.join);

export default router;
