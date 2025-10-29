'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types/supabase';
import { useRouter } from 'next/navigation';

const supabase = createClient();

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  role: Profile['role'] | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Profile['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(userProfile as Profile);
        setRole((userProfile as Profile)?.role);

        // This is a workaround to create a profile for an OAuth user if it doesn't exist.
        if (!userProfile && _event === 'SIGNED_IN') {
            const { data: newUserProfile, error } = await supabase.from('profiles').insert([
                {
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata.full_name || session.user.email,
                    role: 'candidate',
                }
            ]).select().single();
            if(newUserProfile) {
                setProfile(newUserProfile as Profile);
                setRole((newUserProfile as Profile).role);
            }
        }

      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    // Do not await signOut to make the logout process feel instant.
    // The network request will proceed in the background.
    supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    router.push('/');
  };

  const value = {
    user,
    profile,
    session,
    role,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
