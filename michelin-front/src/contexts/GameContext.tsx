import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Entity,
  EntityType,
  GameEndPayload,
  GameMode,
  Player,
  RoomPhase,
  XpAward,
} from '../types/api';

// ── Session persistence ───────────────────────────────────────────────────────

const SESSION_KEY = 'michelin_game_session';

type PersistedSession = {
  roomId: string;
  playerId: number | null;
  gameMode: string | null;
  entityType: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
  timerEndsAt: number | null;
  phase: string | null;
  sessionId: number | null;
  hostPlayerId: number | null;
};

function loadSession(): Partial<PersistedSession> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return {};
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

interface GameState {
  roomId: string | null;
  playerId: number | null;
  sessionId: number | null;
  gameMode: GameMode | null;
  entityType: EntityType | null;
  entities: Entity[];
  phase: RoomPhase | null;
  players: Player[];
  hostPlayerId: number | null;
  timerEndsAt: number | null;
  likeCounts: Record<string, number>;
  winner: GameEndPayload | null;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
}

const initialState: GameState = {
  roomId: null,
  playerId: null,
  sessionId: null,
  gameMode: null,
  entityType: null,
  entities: [],
  phase: null,
  players: [],
  hostPlayerId: null,
  timerEndsAt: null,
  likeCounts: {},
  winner: null,
  latitude: null,
  longitude: null,
  radiusKm: 5,
};

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | {
      type: 'SET_ROOM';
      roomId: string;
      playerId: number;
      gameMode: GameMode;
      entityType: EntityType;
      latitude: number;
      longitude: number;
      radiusKm: number;
    }
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'SET_PHASE'; phase: RoomPhase }
  | {
      type: 'GAME_START';
      sessionId: number;
      entities: Entity[];
      phase: RoomPhase;
      hostPlayerId?: number;
      timerEndsAt: number | null;
    }
  | { type: 'VOTE_UPDATE'; entityId: string; likeCount: number }
  | { type: 'TIMER_UPDATE'; timerEndsAt: number }
  | { type: 'GAME_END'; payload: GameEndPayload }
  | { type: 'UPDATE_ENTITIES'; entities: Entity[] }
  | { type: 'RESET' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_ROOM':
      return {
        ...state,
        roomId: action.roomId,
        playerId: action.playerId,
        gameMode: action.gameMode,
        entityType: action.entityType,
        latitude: action.latitude,
        longitude: action.longitude,
        radiusKm: action.radiusKm,
        phase: 'WAITING',
        entities: [],
        players: [],
        winner: null,
        likeCounts: {},
        sessionId: null,
      };
    case 'SET_PLAYERS':
      return { ...state, players: action.players };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'GAME_START':
      return {
        ...state,
        sessionId: action.sessionId,
        entities: action.entities,
        phase: action.phase,
        timerEndsAt: action.timerEndsAt,
        likeCounts: {},
        ...(action.hostPlayerId !== undefined && { hostPlayerId: action.hostPlayerId }),
      };
    case 'VOTE_UPDATE':
      return {
        ...state,
        likeCounts: { ...state.likeCounts, [action.entityId]: action.likeCount },
      };
    case 'TIMER_UPDATE':
      return { ...state, timerEndsAt: action.timerEndsAt };
    case 'GAME_END':
      return { ...state, winner: action.payload, phase: 'FINISHED' };
    case 'UPDATE_ENTITIES':
      return { ...state, entities: action.entities };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ── Context value ─────────────────────────────────────────────────────────────

interface GameContextValue extends GameState {
  wsConnected: boolean;
  setRoom: (params: {
    roomId: string;
    playerId: number;
    gameMode: GameMode;
    entityType: EntityType;
    latitude: number;
    longitude: number;
    radiusKm: number;
  }) => void;
  connectWs: (roomId: string, token?: string, guestId?: string) => void;
  disconnectWs: () => void;
  sendVote: (entityId: string, vote: boolean) => void;
  sendAddEntity: (entityId: string) => void;
  sendStartGame: () => void;
  sendRoomJoin: () => void;
  reset: () => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

// ── WS message types ──────────────────────────────────────────────────────────

interface WsMessage<T = unknown> {
  event: string;
  payload: T;
}

interface RoomUpdatePayload {
  phase?: RoomPhase;
  players?: Player[];
  entities?: Entity[];
  entityType?: EntityType;
  timerEndsAt?: number | null;
  sessionId?: number;
  hostPlayerId?: number;
  disconnectedPlayerId?: number;
}

interface GameStartPayload {
  phase: RoomPhase;
  sessionId: number;
  entities: Entity[];
  entityType: EntityType;
  timerSeconds?: number;
  timerEndsAt?: number | null;
  hostPlayerId?: number;
}

interface VoteUpdatePayload {
  entityId: string;
  likeCount: number;
}

interface TimerUpdatePayload {
  remaining: number;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...initialState,
    ...loadSession(),
  }));
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<number | null>(null);
  const navigate = useNavigate();

  // Persist key session fields to sessionStorage so a browser refresh can restore them
  useEffect(() => {
    if (!state.roomId) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    const toSave: PersistedSession = {
      roomId: state.roomId,
      playerId: state.playerId,
      gameMode: state.gameMode,
      entityType: state.entityType,
      latitude: state.latitude,
      longitude: state.longitude,
      radiusKm: state.radiusKm,
      timerEndsAt: state.timerEndsAt,
      phase: state.phase,
      sessionId: state.sessionId,
      hostPlayerId: state.hostPlayerId,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(toSave));
  }, [state.roomId, state.playerId, state.timerEndsAt, state.phase, state.sessionId, state.hostPlayerId]);

  const setRoom = useCallback(
    (params: {
      roomId: string;
      playerId: number;
      gameMode: GameMode;
      entityType: EntityType;
      latitude: number;
      longitude: number;
      radiusKm: number;
    }) => {
      dispatch({ type: 'SET_ROOM', ...params });
    },
    [],
  );

  const connectWs = useCallback(
    (roomId: string, token?: string, guestId?: string) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const base = (import.meta.env['VITE_API_URL'] as string).replace(/^http/, 'ws');
      const params = new URLSearchParams({ roomId });
      if (token) params.set('token', token);
      else if (guestId) params.set('guestId', guestId);

      const ws = new WebSocket(`${base}/ws?${params.toString()}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        ws.send(JSON.stringify({ event: 'room:join', payload: {} }));
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onmessage = (evt: MessageEvent<string>) => {
        let msg: WsMessage;
        try {
          msg = JSON.parse(evt.data) as WsMessage;
        } catch {
          return;
        }

        switch (msg.event) {
          case 'room:update': {
            const p = msg.payload as RoomUpdatePayload;
            if (p.players) dispatch({ type: 'SET_PLAYERS', players: p.players });
            if (p.phase) dispatch({ type: 'SET_PHASE', phase: p.phase });
            if (p.entities) dispatch({ type: 'UPDATE_ENTITIES', entities: p.entities });
            if (p.sessionId !== undefined) sessionIdRef.current = p.sessionId;
            if (p.hostPlayerId !== undefined) {
              dispatch({
                type: 'GAME_START',
                sessionId: p.sessionId ?? sessionIdRef.current ?? 0,
                entities: p.entities ?? [],
                phase: p.phase ?? 'WAITING',
                hostPlayerId: p.hostPlayerId,
                timerEndsAt: p.timerEndsAt ?? null,
              });
              // Navigate to the correct page on reconnection (e.g. after browser refresh)
              if (p.phase === 'BUILDING') navigate('/deck');
              else if (p.phase === 'VOTING') navigate('/roulette');
            }
            break;
          }
          case 'game:start': {
            const p = msg.payload as GameStartPayload;
            const timerEndsAt =
              p.timerEndsAt != null
                ? p.timerEndsAt
                : p.timerSeconds != null
                  ? Date.now() + p.timerSeconds * 1000
                  : null;
            sessionIdRef.current = p.sessionId;
            dispatch({
              type: 'GAME_START',
              sessionId: p.sessionId,
              entities: p.entities,
              phase: p.phase,
              timerEndsAt,
              ...(p.hostPlayerId !== undefined && { hostPlayerId: p.hostPlayerId }),
            });
            if (p.phase === 'BUILDING') navigate('/deck');
            else if (p.phase === 'VOTING') navigate('/roulette');
            break;
          }
          case 'game:vote_update': {
            const p = msg.payload as VoteUpdatePayload;
            dispatch({ type: 'VOTE_UPDATE', entityId: p.entityId, likeCount: p.likeCount });
            break;
          }
          case 'game:timer_update': {
            const p = msg.payload as TimerUpdatePayload;
            dispatch({ type: 'TIMER_UPDATE', timerEndsAt: Date.now() + p.remaining * 1000 });
            break;
          }
          case 'game:end': {
            dispatch({ type: 'GAME_END', payload: msg.payload as GameEndPayload });
            navigate('/verdict');
            break;
          }
          case 'error': {
            const p = msg.payload as { message: string };
            console.error('[ws] server error:', p.message);
            break;
          }
        }
      };

      ws.onerror = (err) => {
        console.error('[ws] error:', err);
      };
    },
    [navigate],
  );

  const disconnectWs = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendVote = useCallback((entityId: string, vote: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        event: 'game:vote',
        payload: { sessionId: sessionIdRef.current, entityId, vote },
      }),
    );
  }, []);

  const sendAddEntity = useCallback((entityId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        event: 'game:add_entity',
        payload: { sessionId: sessionIdRef.current, entityId },
      }),
    );
  }, []);

  const sendStartGame = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ event: 'room:start', payload: {} }));
  }, []);

  const sendRoomJoin = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ event: 'room:join', payload: {} }));
  }, []);

  const reset = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    sessionIdRef.current = null;
    sessionStorage.removeItem(SESSION_KEY);
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <GameContext.Provider
      value={{
        ...state,
        wsConnected,
        setRoom,
        connectWs,
        disconnectWs,
        sendVote,
        sendAddEntity,
        sendStartGame,
        sendRoomJoin,
        reset,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function michelinStarCount(rank: string | null | undefined): number {
  if (rank === '3_stars') return 3;
  if (rank === '2_stars') return 2;
  if (rank === '1_star') return 1;
  return 0;
}

export function priceLabel(category: number | null | undefined): string {
  const map: Record<number, string> = { 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' };
  return (category !== null && category !== undefined && map[category]) || '';
}

export function entityImage(entity: { images: string[] }, fallback = ''): string {
  return entity.images[0] ?? fallback;
}

export function xpAwardsToVoteResults(awards: XpAward[]) {
  return awards.map((a) => ({
    player: a.nickname,
    xpGained: a.xpGained,
    newLevel: a.newLevel,
    newXp: a.newXp,
    newStreak: a.newStreak,
  }));
}
