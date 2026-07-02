import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { UserRole } from '@/data/mockData';
import { getCurrentProfileUser, loginWithPassword, logoutSupabase, type AppUser } from '@/services/authService';

type User = AppUser;

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
    let active = true;

    async function hydrate() {
      const { user } = await getCurrentProfileUser();
      if (!active) return;
      if (user) {
        sessionStorage.setItem('sms_user', JSON.stringify(user));
        dispatch({ type: 'REHYDRATE', payload: user });
      } else {
        sessionStorage.removeItem('sms_user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    hydrate();
    return () => { active = false; };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    const { user, error } = await loginWithPassword(email, password);
    if (user && !error) {
      sessionStorage.setItem('sms_user', JSON.stringify(user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return true;
    }

    dispatch({ type: 'SET_LOADING', payload: false });
    return false;
  };

  const logout = async () => {
    await logoutSupabase();
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
