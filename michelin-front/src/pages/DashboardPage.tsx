import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.username}!</p>
      <p>{user?.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
