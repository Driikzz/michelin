import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LobbyPage } from './pages/LobbyPage';
import { DeckBuilderPage } from './pages/DeckBuilderPage';
import { RoulettePage } from './pages/RoulettePage';
import { VerdictPage } from './pages/VerdictPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/deck" element={<DeckBuilderPage />} />
          <Route path="/roulette" element={<RoulettePage />} />
          <Route path="/verdict" element={<VerdictPage />} />
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
