import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    // The username travels with the signup; a database trigger creates the
    // profile row (the browser is not allowed to insert one itself).
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getBalance = async (): Promise<number> => {
    if (!user) return 1000;
    const { data } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
    return data?.balance || 1000;
  };

  // Balance is server-controlled now; browser edits are ignored by the database.
  const updateBalance = async (_amount: number) => {};

  // Wins, games played and winnings are recorded by the game server, which
  // knows who really won. The browser no longer reports them.
  const saveGameResult = async (_result: 'win' | 'loss' | 'bonus', _prizeAmount: number, _roomCode?: string, _mode?: string) => {};

  return { user, loading, signUp, signIn, signOut, getBalance, updateBalance, saveGameResult };
}