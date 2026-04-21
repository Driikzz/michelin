import type { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { GuestRepository } from '../repositories/guestRepository';
import type { JwtPayload } from '../types/auth';

export type WsIdentity =
  | { type: 'user'; userId: string; username: string | null }
  | { type: 'guest'; guestId: string; nickname: string };

const guestRepository = new GuestRepository();

export async function resolveWsIdentity(
  req: IncomingMessage,
): Promise<(WsIdentity & { roomId: string }) | null> {
  const url = req.url ?? '';
  const qs = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  const params = new URLSearchParams(qs);
  const roomId = params.get('roomId');
  if (!roomId) return null;

  const token = params.get('token');
  if (token) {
    const secret = process.env['JWT_SECRET'];
    if (!secret) return null;
    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      return { type: 'user', userId: payload.userId, username: payload.username, roomId };
    } catch {
      return null;
    }
  }

  const guestId = params.get('guestId');
  if (guestId) {
    const guest = await guestRepository.findById(guestId);
    if (!guest) return null;
    return { type: 'guest', guestId: guest.id, nickname: guest.nickname, roomId };
  }

  return null;
}
