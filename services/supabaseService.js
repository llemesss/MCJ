const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class SupabaseService {
  // Autenticação e Usuários
  async createUser(userData) {
    try {
      // Hash da senha
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          ...userData,
          password: hashedPassword
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Remover senha do retorno
      const { password, ...userWithoutPassword } = data;
      return { user: userWithoutPassword, error: null };
    } catch (error) {
      return { user: null, error };
    }
  }

  async authenticateUser(email, password) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();
      
      if (error || !user) {
        return { user: null, token: null, error: 'Usuário não encontrado' };
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return { user: null, token: null, error: 'Senha inválida' };
      }
      
      // Gerar JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Remover senha do retorno
      const { password: _, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token, error: null };
    } catch (error) {
      return { user: null, token: null, error: error.message };
    }
  }

  async getUserById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, ministry_id, is_active, created_at')
        .eq('id', id)
        .single();
      
      return { user: data, error };
    } catch (error) {
      return { user: null, error };
    }
  }

  // Músicas
  async getAllSongs() {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title');
      
      return { songs: data || [], error };
    } catch (error) {
      return { songs: [], error };
    }
  }

  async createSong(songData) {
    try {
      const { data, error } = await supabase
        .from('songs')
        .insert([songData])
        .select()
        .single();
      
      return { song: data, error };
    } catch (error) {
      return { song: null, error };
    }
  }

  async updateSong(id, updates) {
    try {
      const { data, error } = await supabase
        .from('songs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      return { song: data, error };
    } catch (error) {
      return { song: null, error };
    }
  }

  async deleteSong(id) {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
      
      return { error };
    } catch (error) {
      return { error };
    }
  }

  async incrementPlayCount(songId) {
    try {
      const { data, error } = await supabase
        .rpc('increment_play_count', { song_id: songId });
      
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Escalas
  async getAllSchedules() {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          ministry:ministries(name),
          created_by_user:users!schedules_created_by_fkey(name),
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
      
      return { schedules: data || [], error };
    } catch (error) {
      return { schedules: [], error };
    }
  }

  async createSchedule(scheduleData) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert([scheduleData])
        .select()
        .single();
      
      return { schedule: data, error };
    } catch (error) {
      return { schedule: null, error };
    }
  }

  async addMemberToSchedule(scheduleId, userId, role, instrument) {
    try {
      const { data, error } = await supabase
        .from('schedule_members')
        .insert([{
          schedule_id: scheduleId,
          user_id: userId,
          role,
          instrument
        }])
        .select()
        .single();
      
      return { member: data, error };
    } catch (error) {
      return { member: null, error };
    }
  }

  async addSongToSchedule(scheduleId, songId, orderIndex, key, notes) {
    try {
      const { data, error } = await supabase
        .from('schedule_songs')
        .insert([{
          schedule_id: scheduleId,
          song_id: songId,
          order_index: orderIndex,
          key,
          notes
        }])
        .select()
        .single();
      
      return { scheduleSong: data, error };
    } catch (error) {
      return { scheduleSong: null, error };
    }
  }

  // Ministérios
  async getAllMinistries() {
    try {
      const { data, error } = await supabase
        .from('ministries')
        .select(`
          *,
          leader:users!ministries_leader_id_fkey(name, email),
          members:users!users_ministry_id_fkey(id, name, email)
        `)
        .order('name');
      
      return { ministries: data || [], error };
    } catch (error) {
      return { ministries: [], error };
    }
  }

  async createMinistry(ministryData) {
    try {
      const { data, error } = await supabase
        .from('ministries')
        .insert([ministryData])
        .select()
        .single();
      
      return { ministry: data, error };
    } catch (error) {
      return { ministry: null, error };
    }
  }

  // Mensagens
  async getMessages(scheduleId = null, ministryId = null) {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          user:users(name, email)
        `)
        .order('created_at', { ascending: true });
      
      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }
      
      if (ministryId) {
        query = query.eq('ministry_id', ministryId);
      }
      
      const { data, error } = await query;
      
      return { messages: data || [], error };
    } catch (error) {
      return { messages: [], error };
    }
  }

  async createMessage(messageData) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select(`
          *,
          user:users(name, email)
        `)
        .single();
      
      return { message: data, error };
    } catch (error) {
      return { message: null, error };
    }
  }
}

module.exports = new SupabaseService();