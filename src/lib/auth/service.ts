'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types/supabase';

type Role = Profile['role'];

export type LoginParams = {
  supabase: SupabaseClient;
  email: string;
  password: string;
  expectedRole: 'admin' | 'super_admin' | 'candidate';
};

export type LoginResult =
  | { success: true; redirect: string; role: Role }
  | { success: false; message: string };

export async function loginWithEmail({
  supabase,
  email,
  password,
  expectedRole,
}: LoginParams): Promise<LoginResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  const user = data?.user;
  if (!user) {
    return { success: false, message: 'User not found after sign-in.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return { success: false, message: profileError.message };
  }

  const userRole = profile?.role as Role | undefined;
  if (!userRole) {
    return { success: false, message: 'User role is missing.' };
  }

  const allowedRoles =
    expectedRole === 'super_admin' ? (['super_admin'] as Role[]) : (['admin', 'super_admin'] as Role[]);

  if (!allowedRoles.includes(userRole)) {
    await supabase.auth.signOut();
    return { success: false, message: 'Access denied. You do not have the required permissions.' };
  }

  const redirect =
    userRole === 'super_admin' ? '/super-admin/dashboard' : userRole === 'admin' ? '/admin' : '/';

  return { success: true, redirect, role: userRole };
}

export type RegisterParams = {
  supabase: SupabaseClient;
  email: string;
  password: string;
};

export type RegisterResult =
  | { success: true; message: string }
  | { success: false; message: string };

export async function registerCandidateWithEmail({
  supabase,
  email,
  password,
}: RegisterParams): Promise<RegisterResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: email.split('@')[0],
      },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  const userId = data?.user?.id;
  if (!userId) {
    return { success: false, message: 'User was not created.' };
  }

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', userId).single();

  if (!profile) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      full_name: email.split('@')[0],
      email,
      role: 'candidate',
    });

    if (insertError) {
      return { success: false, message: insertError.message };
    }
  }

  return {
    success: true,
    message: 'Registration successful! Please check your email to verify your account.',
  };
}

export type MagicLinkParams = {
  supabase: SupabaseClient;
  email: string;
};

export async function sendMagicLink({ supabase, email }: MagicLinkParams): Promise<RegisterResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: 'Link login terkirim ke email kamu.' };
}
