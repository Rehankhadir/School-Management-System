import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { mockUsers, UserRole } from '@/data/mockData';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  schoolName: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'REHYDRATE'; payload: User };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'REHYDRATE':
      return { user: action.payload, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('sms_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        dispatch({ type: 'REHYDRATE', payload: user });
      } catch {
        sessionStorage.removeItem('sms_user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));

    const found = mockUsers.find(u => u.email === email && u.password === password);
    if (found) {
      const user: User = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        avatar: found.avatar,
        schoolName: found.schoolName,
        token: 'mock-jwt-token-' + found.id,
      };
      sessionStorage.setItem('sms_user', JSON.stringify(user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    }
    dispatch({ type: 'SET_LOADING', payload: false });
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('sms_user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      role: state.user?.role || null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
