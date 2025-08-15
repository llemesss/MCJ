import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

// Hook personalizado para autenticação com Supabase
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Função para fazer login
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Função para fazer cadastro
  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  };

  // Função para fazer logout
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
};

// Hook para operações com músicas
export const useSongs = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Buscar todas as músicas
  const fetchSongs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title');
      
      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error('Erro ao buscar músicas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova música
  const createSong = async (songData) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .insert([songData])
        .select()
        .single();
      
      if (error) throw error;
      setSongs(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar música:', error);
      return { data: null, error };
    }
  };

  // Atualizar música
  const updateSong = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setSongs(prev => prev.map(song => song.id === id ? data : song));
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao atualizar música:', error);
      return { data: null, error };
    }
  };

  // Deletar música
  const deleteSong = async (id) => {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setSongs(prev => prev.filter(song => song.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Erro ao deletar música:', error);
      return { error };
    }
  };

  return {
    songs,
    loading,
    fetchSongs,
    createSong,
    updateSong,
    deleteSong,
  };
};

// Hook para operações com escalas
export const useSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // Buscar escalas
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          ministry:ministries(name),
          schedule_members(
            *,
            user:users(name, email)
          ),
          schedule_songs(
            *,
            song:songs(title, artist, key)
          )
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Erro ao buscar escalas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova escala
  const createSchedule = async (scheduleData) => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert([scheduleData])
        .select()
        .single();
      
      if (error) throw error;
      await fetchSchedules(); // Recarregar para pegar os relacionamentos
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao criar escala:', error);
      return { data: null, error };
    }
  };

  return {
    schedules,
    loading,
    fetchSchedules,
    createSchedule,
  };
};

export default {
  useAuth,
  useSongs,
  useSchedules,
};