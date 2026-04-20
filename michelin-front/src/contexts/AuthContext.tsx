import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../types/auth';
import { authService, extractApiError } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    authService
      .getMe()
      .then((fetchedUser) => setUser(fetchedUser))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (payload: LoginPayload): Promise<void> => {
    try {
      const { token, user: loggedInUser } = await authService.login(payload);
      localStorage.setItem('token', token);
      setUser(loggedInUser);
    } catch (err) {
      throw new Error(extractApiError(err, 'Login failed'));
    }
  };

  const register = async (payload: RegisterPayload): Promise<void> => {
    try {
      const { token, user: createdUser } = await authService.register(payload);
      localStorage.setItem('token', token);
      setUser(createdUser);
    } catch (err) {
      throw new Error(extractApiError(err, 'Registration failed'));
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
