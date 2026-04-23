import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { ToastProvider } from './contexts/ToastContext';
import { Toaster } from './components/ui/Toaster';
import { InstallBanner } from './components/ui/InstallBanner';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserOnlyRoute } from './components/UserOnlyRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LobbyPage } from './pages/LobbyPage';
import { DeckBuilderPage } from './pages/DeckBuilderPage';
import { RoulettePage } from './pages/RoulettePage';
import { VerdictPage } from './pages/VerdictPage';
import { JoinPage } from './pages/JoinPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <GameProvider>
          <Toaster />
          <InstallBanner />
          <OfflineIndicator />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/join/:roomId" element={<JoinPage />} />
            {/* Accessible aux guests (rejoindre ou participer à une partie) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/deck" element={<DeckBuilderPage />} />
              <Route path="/roulette" element={<RoulettePage />} />
              <Route path="/verdict" element={<VerdictPage />} />
            </Route>
            {/* Réservé aux comptes connectés uniquement */}
            <Route element={<UserOnlyRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/lobby" replace />} />
          </Routes>
        </GameProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
