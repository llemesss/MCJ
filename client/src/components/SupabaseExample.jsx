import React, { useState, useEffect } from 'react';
import { useAuth, useSongs, useSchedules } from '../hooks/useSupabase';

const SupabaseExample = () => {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { songs, loading: songsLoading, fetchSongs, createSong } = useSongs();
  const { schedules, loading: schedulesLoading, fetchSchedules } = useSchedules();
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    name: '', 
    email: '', 
    password: '' 
  });
  const [songForm, setSongForm] = useState({ 
    title: '', 
    artist: '', 
    key: '', 
    lyrics: '' 
  });
  const [activeTab, setActiveTab] = useState('login');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchSongs();
      fetchSchedules();
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const { data, error } = await signIn(loginForm.email, loginForm.password);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Login realizado com sucesso!');
      setLoginForm({ email: '', password: '' });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const { data, error } = await signUp(
      registerForm.email, 
      registerForm.password,
      { name: registerForm.name }
    );
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Cadastro realizado com sucesso! Verifique seu email.');
      setRegisterForm({ name: '', email: '', password: '' });
    }
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      setError(error.message);
    } else {
      setMessage('Logout realizado com sucesso!');
    }
  };

  const handleCreateSong = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    const { data, error } = await createSong(songForm);
    
    if (error) {
      setError(error.message);
    } else {
      setMessage('Música criada com sucesso!');
      setSongForm({ title: '', artist: '', key: '', lyrics: '' });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="mb-4">
          <div className="flex border-b">
            <button
              className={`py-2 px-4 ${activeTab === 'login' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              className={`py-2 px-4 ${activeTab === 'register' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('register')}
            >
              Cadastro
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Senha
              </label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Entrar
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nome
              </label>
              <input
                type="text"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Senha
              </label>
              <input
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cadastrar
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">MCJ App - Supabase</h1>
            <p className="text-gray-600">Bem-vindo, {user.name}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Sair
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Músicas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Músicas</h2>
          
          {/* Formulário para criar música */}
          <form onSubmit={handleCreateSong} className="mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Título"
                value={songForm.title}
                onChange={(e) => setSongForm({...songForm, title: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Artista"
                value={songForm.artist}
                onChange={(e) => setSongForm({...songForm, artist: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Tom (ex: C, G, Am)"
                value={songForm.key}
                onChange={(e) => setSongForm({...songForm, key: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Adicionar Música
              </button>
            </div>
            <textarea
              placeholder="Letra da música"
              value={songForm.lyrics}
              onChange={(e) => setSongForm({...songForm, lyrics: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </form>

          {/* Lista de músicas */}
          {songsLoading ? (
            <div className="text-center">Carregando músicas...</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {songs.map((song) => (
                <div key={song.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{song.title}</h3>
                      <p className="text-gray-600">{song.artist}</p>
                      {song.key && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                          Tom: {song.key}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Tocada {song.play_count || 0} vezes
                    </div>
                  </div>
                  {song.lyrics && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {song.lyrics.substring(0, 100)}...
                    </div>
                  )}
                </div>
              ))}
              {songs.length === 0 && (
                <div className="text-center text-gray-500">Nenhuma música encontrada</div>
              )}
            </div>
          )}
        </div>

        {/* Escalas */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Escalas</h2>
          
          {schedulesLoading ? (
            <div className="text-center">Carregando escalas...</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{schedule.title}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(schedule.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {schedule.ministry && (
                    <p className="text-sm text-gray-600 mb-2">
                      Ministério: {schedule.ministry.name}
                    </p>
                  )}
                  
                  {schedule.time && (
                    <p className="text-sm text-gray-600 mb-2">
                      Horário: {schedule.time}
                    </p>
                  )}
                  
                  {schedule.location && (
                    <p className="text-sm text-gray-600 mb-2">
                      Local: {schedule.location}
                    </p>
                  )}
                  
                  {schedule.schedule_members && schedule.schedule_members.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Membros:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {schedule.schedule_members.map((member, index) => (
                          <span key={index} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {member.user?.name} ({member.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {schedule.schedule_songs && schedule.schedule_songs.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Músicas:</p>
                      <div className="space-y-1 mt-1">
                        {schedule.schedule_songs.map((scheduleSong, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {scheduleSong.song?.title} - {scheduleSong.song?.artist}
                            {scheduleSong.key && ` (Tom: ${scheduleSong.key})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {schedules.length === 0 && (
                <div className="text-center text-gray-500">Nenhuma escala encontrada</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupabaseExample;