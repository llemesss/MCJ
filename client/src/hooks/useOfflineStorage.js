import { useState, useEffect, useCallback } from 'react';
import useOnlineStatus from './useOnlineStatus';

const STORAGE_KEYS = {
  SONGS: 'mcj_offline_songs',
  SCHEDULES: 'mcj_offline_schedules',
  MEMBERS: 'mcj_offline_members',
  USER_PROFILE: 'mcj_offline_user_profile',
  CHORDS: 'mcj_offline_chords',
  LAST_SYNC: 'mcj_last_sync',
  SETTINGS: 'mcj_offline_settings'
};

const useOfflineStorage = () => {
  const { isOnline } = useOnlineStatus();
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'

  // Carregar última sincronização
  useEffect(() => {
    const lastSyncTime = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime));
    }
  }, []);

  // Salvar dados no localStorage
  const saveToStorage = useCallback((key, data) => {
    try {
      const dataWithTimestamp = {
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
      return true;
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      return false;
    }
  }, []);

  // Carregar dados do localStorage
  const loadFromStorage = useCallback((key) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return parsed.data || parsed; // Compatibilidade com dados antigos
    } catch (error) {
      console.error('Erro ao carregar do localStorage:', error);
      return null;
    }
  }, []);

  // Sincronizar dados específicos
  const syncData = useCallback(async (dataType, apiEndpoint, transform = (data) => data) => {
    if (!isOnline) {
      console.log('Offline: não é possível sincronizar', dataType);
      return loadFromStorage(STORAGE_KEYS[dataType.toUpperCase()]);
    }

    try {
      setSyncStatus('syncing');
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const transformedData = transform(data);
      
      // Salvar dados sincronizados
      saveToStorage(STORAGE_KEYS[dataType.toUpperCase()], transformedData);
      
      setSyncStatus('success');
      return transformedData;
    } catch (error) {
      console.error(`Erro ao sincronizar ${dataType}:`, error);
      setSyncStatus('error');
      
      // Retornar dados offline como fallback
      return loadFromStorage(STORAGE_KEYS[dataType.toUpperCase()]);
    }
  }, [isOnline, saveToStorage, loadFromStorage]);

  // Sincronizar músicas com cifras
  const syncSongs = useCallback(async () => {
    return syncData('songs', '/api/songs', (songs) => {
      // Manter apenas dados essenciais para economizar espaço
      return songs.map(song => ({
        _id: song._id,
        title: song.title,
        artist: song.artist,
        key: song.key,
        bpm: song.bpm,
        lyrics: song.lyrics,
        chords: song.chords,
        ministry: song.ministry,
        tags: song.tags,
        createdAt: song.createdAt
      }));
    });
  }, [syncData]);

  // Sincronizar cronogramas
  const syncSchedules = useCallback(async () => {
    return syncData('schedules', '/api/schedules', (schedules) => {
      // Filtrar apenas cronogramas dos próximos 30 dias
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      return schedules
        .filter(schedule => new Date(schedule.date) <= thirtyDaysFromNow)
        .map(schedule => ({
          _id: schedule._id,
          title: schedule.title,
          date: schedule.date,
          time: schedule.time,
          type: schedule.type,
          location: schedule.location,
          description: schedule.description,
          ministry: schedule.ministry,
          songs: schedule.songs,
          members: schedule.members
        }));
    });
  }, [syncData]);

  // Sincronizar membros
  const syncMembers = useCallback(async () => {
    return syncData('members', '/api/members', (members) => {
      return members.map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        instruments: member.instruments,
        ministries: member.ministries,
        avatar: member.avatar
      }));
    });
  }, [syncData]);

  // Sincronização completa
  const syncAll = useCallback(async () => {
    if (!isOnline) {
      console.log('Offline: sincronização completa não disponível');
      return false;
    }

    try {
      setSyncStatus('syncing');
      
      await Promise.all([
        syncSongs(),
        syncSchedules(),
        syncMembers()
      ]);
      
      // Atualizar timestamp da última sincronização
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      setLastSync(new Date(now));
      
      setSyncStatus('success');
      return true;
    } catch (error) {
      console.error('Erro na sincronização completa:', error);
      setSyncStatus('error');
      return false;
    }
  }, [isOnline, syncSongs, syncSchedules, syncMembers]);

  // Limpar dados offline
  const clearOfflineData = useCallback(() => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    setLastSync(null);
    setSyncStatus('idle');
  }, []);

  // Verificar se dados estão desatualizados (mais de 24 horas)
  const isDataStale = useCallback(() => {
    if (!lastSync) return true;
    
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    return lastSync < twentyFourHoursAgo;
  }, [lastSync]);

  // Obter tamanho dos dados offline
  const getStorageSize = useCallback(() => {
    let totalSize = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    });
    return totalSize;
  }, []);

  // Auto-sincronização quando voltar online
  useEffect(() => {
    if (isOnline && isDataStale()) {
      console.log('Dados desatualizados, iniciando sincronização automática...');
      syncAll();
    }
  }, [isOnline, isDataStale, syncAll]);

  return {
    // Estados
    isOnline,
    lastSync,
    syncStatus,
    isDataStale: isDataStale(),
    storageSize: getStorageSize(),
    
    // Métodos de sincronização
    syncAll,
    syncSongs,
    syncSchedules,
    syncMembers,
    
    // Métodos de armazenamento
    saveToStorage,
    loadFromStorage,
    clearOfflineData,
    
    // Métodos de acesso rápido
    getSongs: () => loadFromStorage(STORAGE_KEYS.SONGS) || [],
    getSchedules: () => loadFromStorage(STORAGE_KEYS.SCHEDULES) || [],
    getMembers: () => loadFromStorage(STORAGE_KEYS.MEMBERS) || [],
    getUserProfile: () => loadFromStorage(STORAGE_KEYS.USER_PROFILE),
    
    // Constantes
    STORAGE_KEYS
  };
};

export default useOfflineStorage;