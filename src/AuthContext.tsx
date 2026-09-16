import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (sbUser: SupabaseUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: sbUser.email || '',
          created_at: profile.created_at,
        });
      } else {
        setUser({
          id: sbUser.id,
          name: sbUser.user_metadata?.name || 'User',
          email: sbUser.email || '',
          created_at: sbUser.created_at || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setUser({
        id: sbUser.id,
        name: sbUser.user_metadata?.name || 'User',
        email: sbUser.email || '',
        created_at: sbUser.created_at || new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: 'Неверный email или пароль' };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (password.length < 4) {
      return { success: false, error: 'Пароль должен быть не менее 4 символов' };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { success: false, error: 'Пользователь с таким email уже существует' };
      }
      return { success: false, error: error.message };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Проверьте email для подтверждения аккаунта' };
    }

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
