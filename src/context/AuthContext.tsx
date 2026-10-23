import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import * as auth from '@/services/auth';
import type { User } from '@/services/auth';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth
      .restoreSession(db)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [db]);

  const value: AuthContextValue = {
    user,
    loading,
    signIn: async (email, password) => setUser(await auth.login(db, email, password)),
    signUp: async (name, email, password) => setUser(await auth.register(db, name, email, password)),
    signOut: async () => {
      await auth.logout();
      setUser(null);
    },
    deleteAccount: async () => {
      if (!user) return;
      await auth.deleteAccount(db, user.id);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}

/** Atalho para telas protegidas, onde o usuário com certeza está logado. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('Nenhum usuário logado.');
  return user;
}
