import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../contexts/GameContext';
import { roomService } from '../services/roomService';
import type { GameRoom, Player } from '../types/api';

export function JoinPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const game = useGame();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    roomService
      .getRoom(roomId)
      .then(({ room: r, players: p }) => {
        setRoom(r);
        setPlayers(p);
        if (user) setNickname(user.username);
      })
      .catch(() => setError('Room not found'))
      .finally(() => setFetching(false));
  }, [roomId, user]);

  const handleJoin = async () => {
    if (!roomId || !room) return;
    setLoading(true);
    setError(null);

    try {
      let guestId: string | undefined;

      if (!user) {
        // Create guest session
        const guest = await roomService.createGuest(nickname.trim() || 'Guest');
        guestId = guest.id;
        localStorage.setItem('guestId', guest.id);
      }

      const token = localStorage.getItem('token') ?? undefined;
      const { playerId } = await roomService.joinRoom(roomId, {
        nickname: nickname.trim() || user?.username || 'Player',
        ...(guestId !== undefined && { guestId }),
      });

      game.setRoom({
        roomId,
        playerId,
        gameMode: room.game_mode,
        entityType: room.entity_type,
        latitude: room.latitude,
        longitude: room.longitude,
        radiusKm: room.radius_km,
      });

      game.connectWs(roomId, token, guestId);
      navigate('/lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary-container text-4xl">progress_activity</span>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-6">
        <span className="material-symbols-outlined text-error text-5xl">error</span>
        <h1 className="text-2xl font-black text-on-surface">Room introuvable</h1>
        <p className="text-on-surface/50">{error}</p>
        <button
          onClick={() => navigate('/lobby')}
          className="bg-primary-container text-on-primary px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest"
        >
          Retour
        </button>
      </div>
    );
  }

  const modeLabel: Record<string, string> = { FAST: 'Rapide', CLASSIC: 'Classique', CHAOS: 'Chaos' };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary-container/10 text-primary-container px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 bg-primary-container rounded-full animate-pulse" />
            Rejoindre une salle
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">
            {room?.game_mode ? modeLabel[room.game_mode] : 'Partie'}
          </h1>
          <p className="text-on-surface/50 text-sm mt-1">
            {players.length} joueur{players.length !== 1 ? 's' : ''} déjà dans la salle
          </p>
        </div>

        {/* Players */}
        {players.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col gap-2">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <span className="text-sm font-semibold text-on-surface">{p.nickname}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nickname input */}
        <div className="flex flex-col gap-3">
          <label className="text-xs uppercase tracking-widest text-on-surface/40 font-bold">Ton pseudo</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value.replace(/[<>"]/g, '').slice(0, 32))}
            placeholder="Entre ton pseudo"
            maxLength={24}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl py-4 px-5 text-base text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:border-primary-container/40 transition-all"
          />
          {!user && (
            <p className="text-xs text-on-surface/40">Tu rejoins en tant qu'invité — pas besoin de compte.</p>
          )}
        </div>

        {error && (
          <div className="bg-error/10 text-error rounded-2xl p-4 text-sm font-bold">{error}</div>
        )}

        <button
          onClick={() => void handleJoin()}
          disabled={loading || !nickname.trim()}
          className="w-full bg-primary-container text-on-primary py-5 rounded-2xl font-black text-base uppercase tracking-widest hover:bg-primary transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_12px_30px_rgba(186,11,47,0.25)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <>
              Rejoindre
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
            </>
          )}
        </button>

        {!user && (
          <p className="text-center text-xs text-on-surface/40">
            Tu as un compte ?{' '}
            <button
              onClick={() => navigate(`/login?next=/join/${roomId ?? ''}`)}
              className="font-bold text-primary-container hover:underline"
            >
              Se connecter
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
