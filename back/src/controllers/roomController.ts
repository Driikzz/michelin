import type { Request, Response } from 'express';
import { GuestRepository } from '../repositories/guestRepository';
import { RoomRepository } from '../repositories/roomRepository';
import { UserRepository } from '../repositories/userRepository';
import { RoomService } from '../services/roomService';
import { gameStateManager } from '../game/gameStateManager';
import type { GameMode } from '../types/game';

const VALID_MODES: GameMode[] = ['FAST', 'CLASSIC', 'CHAOS'];

function makeRoomService(): RoomService {
  return new RoomService(new RoomRepository(), new UserRepository(), new GuestRepository());
}

export const roomController = {
  async create(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const body = req.body as {
      gameMode?: unknown;
      latitude?: unknown;
      longitude?: unknown;
      priceFilter?: unknown;
      radiusKm?: unknown;
      tagIds?: unknown;
      nickname?: unknown;
    };

    if (!VALID_MODES.includes(body.gameMode as GameMode)) {
      res.status(400).json({ error: 'gameMode must be FAST, CLASSIC, or CHAOS' });
      return;
    }
    if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      res.status(400).json({ error: 'latitude and longitude are required numbers' });
      return;
    }

    const nickname =
      typeof body.nickname === 'string' && body.nickname.trim()
        ? body.nickname.trim()
        : req.user?.username ?? 'Player';

    try {
      const roomService = makeRoomService();
      const { room, hostPlayer } = await roomService.createRoom({
        hostUserId: userId,
        gameMode: body.gameMode as GameMode,
        latitude: body.latitude as number,
        longitude: body.longitude as number,
        priceFilter:
          typeof body.priceFilter === 'number' ? body.priceFilter : null,
        radiusKm: typeof body.radiusKm === 'number' ? body.radiusKm : 5,
        tagIds: Array.isArray(body.tagIds) ? (body.tagIds as number[]) : [],
        nickname,
      });

      gameStateManager.initRoom(room.id, room.game_mode, hostPlayer.id);

      res.status(201).json({ roomId: room.id, playerId: hostPlayer.id });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },

  async getRoom(req: Request, res: Response): Promise<void> {
    const { id } = req.params as { id: string };
    try {
      const roomService = makeRoomService();
      const result = await roomService.getRoomWithPlayers(id);
      if (!result) {
        res.status(404).json({ error: 'Room not found' });
        return;
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  },

  async join(req: Request, res: Response): Promise<void> {
    const { id: roomId } = req.params as { id: string };
    const body = req.body as { nickname?: unknown; guestId?: unknown };
    const userId = req.user?.userId;
    const guestId = typeof body.guestId === 'string' ? body.guestId : undefined;

    if (!userId && !guestId) {
      res.status(400).json({ error: 'Provide a valid JWT (user) or guestId' });
      return;
    }

    const nickname =
      typeof body.nickname === 'string' && body.nickname.trim()
        ? body.nickname.trim()
        : req.user?.username ?? 'Player';

    try {
      const roomService = makeRoomService();
      const player = await roomService.joinRoom({
        roomId,
        ...(userId !== undefined && { userId }),
        ...(guestId !== undefined && { guestId }),
        nickname,
      });
      res.json({ playerId: player.id, nickname: player.nickname });
    } catch (err) {
      const msg = (err as Error).message;
      const status = msg === 'Room not found' ? 404 : msg === 'Room is not accepting new players' ? 409 : 400;
      res.status(status).json({ error: msg });
    }
  },
};
