import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate('/lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <img src="/michelin.png" alt="Michelin" className="h-14 w-auto object-contain" />
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
          <h1 className="text-2xl font-black text-white mb-1">Connexion</h1>
          <p className="text-sm text-neutral-500 mb-8">Content de te revoir.</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 text-sm font-semibold px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                placeholder="toi@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_20px_rgba(220,38,38,0.3)] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2 mt-1"
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
              ) : (
                <>
                  Se connecter
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-600 mt-6">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-red-500 font-bold hover:text-red-400 transition-colors">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
