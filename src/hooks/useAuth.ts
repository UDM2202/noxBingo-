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
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        balance: 1000,
      });
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Sign in result:', data, error);
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

  const updateBalance = async (amount: number) => {
    if (!user) return;
    const currentBalance = await getBalance();
    await supabase.from('profiles').update({ balance: currentBalance + amount }).eq('id', user.id);
  };

  const saveGameResult = async (result: 'win' | 'loss' | 'bonus', prizeAmount: number, _roomCode?: string, _mode?: string) => {
    if (!user) return;
    
    // Update profile stats
    if (result === 'win') {
      await supabase.rpc('increment_wins', { user_id: user.id });
    }
    await supabase.rpc('increment_games', { user_id: user.id });
    await updateBalance(prizeAmount);
    
    if (prizeAmount > 0) {
      await supabase.rpc('add_winnings', { user_id: user.id, amount: prizeAmount });
    }
  };

  return { user, loading, signUp, signIn, signOut, getBalance, updateBalance, saveGameResult };
}


