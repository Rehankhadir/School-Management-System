import { supabase } from '../lib/supabase';
import type { UserRole } from '../../../src/data/mockData';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  schoolName: string;
  token: string;
}

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  school_name: string;
  avatar_url: string | null;
};

function toAppUser(profile: ProfileRow, token = ''): AppUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    avatar: profile.avatar_url,
    schoolName: profile.school_name,
    token,
  };
}

export async function getProfileUser(userId: string, token = '') {
  if (!supabase) return { user: null, error: new Error('Supabase is not configured') };

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return { user: null, error };
  return { user: toAppUser(data, token), error: null };
}

export async function getCurrentProfileUser() {
  if (!supabase) return { user: null, error: new Error('Supabase is not configured') };

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { user: null, error: sessionError };
  const session = sessionData.session;
  if (!session?.user) return { user: null, error: null };

  return getProfileUser(session.user.id, session.access_token);
}

export async function loginWithPassword(email: string, password: string) {
  if (!supabase) return { user: null, error: new Error('Supabase is not configured') };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) return { user: null, error: error || new Error('Login failed') };
  return getProfileUser(data.user.id, data.session?.access_token || '');
}

export async function logoutSupabase() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
