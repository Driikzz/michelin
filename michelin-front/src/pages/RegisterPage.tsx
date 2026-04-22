import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({ username, email, password });
      navigate('/lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création du compte impossible');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <img src="/michelin.png" alt="Michelin" className="h-14 w-auto object-contain" />
        </div>

        <div className="bg-white border border-neutral-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-2xl font-black text-neutral-900 mb-1">Créer un compte</h1>
          <p className="text-sm text-neutral-600 mb-8">La table t'attend.</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Pseudo</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                maxLength={32}
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                placeholder="ton pseudo"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                placeholder="toi@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-bold text-neutral-600 uppercase tracking-widest">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="bg-white border border-neutral-300 rounded-xl px-4 py-3 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                placeholder="8 caractères minimum"
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
                  Créer mon compte
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-700 mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-red-500 font-bold hover:text-red-400 transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
