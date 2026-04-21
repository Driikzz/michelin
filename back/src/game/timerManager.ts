import { gameStateManager } from './gameStateManager';

export function startTimer(params: {
  roomId: string;
  durationSeconds: number;
  onTick: (remainingSeconds: number) => void;
  onExpire: () => Promise<void>;
}): { timerHandle: ReturnType<typeof setTimeout>; tickHandle: ReturnType<typeof setInterval> } {
  const { roomId, durationSeconds, onTick, onExpire } = params;
  const endsAt = Date.now() + durationSeconds * 1000;

  const tickHandle = setInterval(() => {
    const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
    onTick(remaining);
  }, 10_000);

  const timerHandle = setTimeout(() => {
    clearInterval(tickHandle);
    onExpire().catch((err: unknown) => {
      console.error(`[timer] onExpire error for room ${roomId}:`, err);
    });
  }, durationSeconds * 1000);

  gameStateManager.setTimer(roomId, timerHandle, tickHandle, endsAt);

  return { timerHandle, tickHandle };
}

export function stopTimer(roomId: string): void {
  gameStateManager.clearTimer(roomId);
}
