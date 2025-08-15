import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  IconButton,
  Button,
  Chip,
  LinearProgress,
  CircularProgress,
  Collapse,
  Alert,
  Tooltip,
  TextField,
  Switch,
  FormControlLabel,
  useMediaQuery,
  useTheme,
  Fab,
  Drawer,
  Stack,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  Help as HelpIcon,
  Keyboard as KeyboardIcon,
  Settings as SettingsIcon,
  Loop as LoopIcon,
  GraphicEq as WaveformIcon,
  Menu as MenuIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FastForward as FastForwardIcon,
  FastRewind as FastRewindIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  CloudOff as CloudOffIcon,
  Wifi as WifiIcon
} from '@mui/icons-material';
import PlayerSettings from './Settings/PlayerSettings';
import useOnlineStatus from '../hooks/useOnlineStatus';
import ConnectionStatus from './Common/ConnectionStatus';

const MultitrackPlayer = ({ 
  tracks = [], 
  title = 'Música Sem Título',
  bpm = null,
  songKey = null,
  artist = null,
  duration: songDuration = null
}) => {
  // Hook de conectividade
  const { isOnline, canUseMultitrack, connectionQuality, recommendedQuality } = useOnlineStatus();
  
  // Logs otimizados para performance
  console.log('🎵 MultitrackPlayer inicializado:', { 
    title, 
    tracks: tracks.length, 
    bpm, 
    songKey, 
    artist,
    tracksData: tracks,
    isOnline,
    canUseMultitrack
  });
  console.log('🔍 DEBUG - Props recebidas:', { title, artist, bpm, songKey });
  console.log('🔍 DEBUG - Condição de exibição:', (artist || bpm || songKey));
  console.log('🌐 DEBUG - Status de conectividade:', { isOnline, canUseMultitrack, connectionQuality });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackVolumes, setTrackVolumes] = useState({});
  const [trackMuted, setTrackMuted] = useState({});
  const [trackSolo, setTrackSolo] = useState({});
  const [vuLevels, setVuLevels] = useState({});
  // Waveform removido para otimização
  const [isLoading, setIsLoading] = useState(true);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({});
  const [loadingStatus, setLoadingStatus] = useState('');
  const [playbackState, setPlaybackState] = useState('stopped'); // 'stopped', 'playing', 'paused'
  
  // Estados para loop de seções
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  
  // Estados para visualização de forma de onda
  const [showWaveform, setShowWaveform] = useState(false);
  const [waveformData, setWaveformData] = useState({});
  
  // Mobile UX states
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  
  // Advanced touch controls
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [lastTap, setLastTap] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  // Performance optimization states
  const [visibleTracks, setVisibleTracks] = useState(new Set());
  const [lazyLoadOffset, setLazyLoadOffset] = useState(5);
  const [intersectionObserver, setIntersectionObserver] = useState(null);
  
  const audioRefs = useRef({});
  const audioContextRef = useRef(null);
  const analyserRefs = useRef({});
  const intervalRef = useRef(null);
  const vuIntervalRef = useRef(null);
  const playPromises = useRef({});
  const playerRef = useRef(null);

  // Carregar configurações do player
  const [playerSettings, setPlayerSettings] = useState(() => {
    const saved = localStorage.getItem('playerSettings');
    return saved ? JSON.parse(saved) : {
      autoPlay: false,
      showVUMeters: true,
      defaultVolume: 80,
      seekStep: 10,
      volumeStep: 5,
      keyboardShortcuts: true,
      compactMode: false,
      vuSensitivity: 0.8,
      smoothTransitions: true,
    };
  });

  // Cores para cada tipo de track
  const getTrackColor = (trackName) => {
    const name = trackName.toLowerCase();
    if (name.includes('vocal') || name.includes('voice') || name.includes('mic')) return '#ff6b6b';
    if (name.includes('drum') || name.includes('bateria')) return '#4ecdc4';
    if (name.includes('bass') || name.includes('baixo')) return '#45b7d1';
    if (name.includes('guitar') || name.includes('guitarra')) return '#f9ca24';
    if (name.includes('piano') || name.includes('teclado') || name.includes('keys')) return '#6c5ce7';
    if (name.includes('bell') || name.includes('sino')) return '#a55eea';
    if (name.includes('string') || name.includes('violino') || name.includes('viola')) return '#26de81';
    return '#778ca3';
  };

  // Inicializar volumes e estados dos tracks - Otimizado
  useEffect(() => {
    if (tracks.length === 0) {
      setIsLoading(false);
      return;
    }
    
    console.log('🎵 Inicializando player com', tracks.length, 'tracks');
    
    const initialVolumes = {};
    const initialMuted = {};
    const initialSolo = {};
    const initialVuLevels = {};
    const initialLoadingProgress = {};
    
    tracks.forEach((track, index) => {
      initialVolumes[index] = playerSettings.defaultVolume;
      initialMuted[index] = false;
      initialSolo[index] = false;
      initialVuLevels[index] = 0;
      initialLoadingProgress[index] = 0;
    });
    
    setTrackVolumes(initialVolumes);
    setTrackMuted(initialMuted);
    setTrackSolo(initialSolo);
    setVuLevels(initialVuLevels);
    setLoadingProgress(initialLoadingProgress);
    setIsLoading(true);
    
    // Inicializar Web Audio API
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API não disponível:', error.message);
      }
    }
  }, [tracks]);

  // Funções de controle de reprodução (definidas antes para evitar dependência circular)
  const handlePlay = useCallback(async () => {
    if (playbackState === 'playing') return;
    
    setPlaybackState('playing');
    setIsPlaying(true);
    
    // Preparar para reprodução
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API não disponível:', error.message);
      }
    }
    
    // Retomar contexto de áudio se necessário
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.warn('Erro ao retomar contexto de áudio:', error.message);
      }
    }
    
    // Cancelar promises anteriores
    Object.values(playPromises.current).forEach(promise => {
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {}); // Silenciar erros de promises canceladas
      }
    });
    playPromises.current = {};
    
    const audioElements = Object.entries(audioRefs.current);
    const validAudios = audioElements.filter(([index, audio]) => audio && audio.readyState >= 2);
    
    // Sincronizar todos os áudios primeiro
    validAudios.forEach(([index, audio]) => {
      if (Math.abs(audio.currentTime - currentTime) > 0.1) {
        audio.currentTime = currentTime;
      }
    });
    
    // Aguardar um frame para sincronização
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Reproduzir todos simultaneamente para melhor sincronização
    try {
      const playPromises = validAudios.map(([index, audio]) => {
        const playPromise = audio.play();
        playPromises.current[index] = playPromise;
        return playPromise;
      });
      
      await Promise.all(playPromises);
    } catch (error) {
      console.warn('Erro na reprodução simultânea, tentando individualmente:', error.message);
      
      // Fallback: reproduzir individualmente
      for (const [index, audio] of validAudios) {
        try {
          const playPromise = audio.play();
          playPromises.current[index] = playPromise;
          await playPromise;
        } catch (individualError) {
          if (individualError.name !== 'AbortError') {
            console.warn(`Erro ao reproduzir track ${index}:`, individualError.message);
          }
        }
      }
    }
  }, [currentTime, playbackState]);

  const handlePause = useCallback(() => {
    if (playbackState !== 'playing') return;
    
    setPlaybackState('paused');
    setIsPlaying(false);
    
    // Cancelar promises de reprodução
    Object.values(playPromises.current).forEach(promise => {
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {});
      }
    });
    playPromises.current = {};
    
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause();
      }
    });
  }, [playbackState]);

  const handleStop = useCallback(() => {
    setPlaybackState('stopped');
    setIsPlaying(false);
    setCurrentTime(0);
    
    // Cancelar promises de reprodução
    Object.values(playPromises.current).forEach(promise => {
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {});
      }
    });
    playPromises.current = {};
    
    
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    if (!playerSettings.keyboardShortcuts) return;
    
    const handleKeyPress = (event) => {
      // Verificar se o foco está em um input ou textarea
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          isPlaying ? handlePause() : handlePlay();
          break;
        case 'KeyS':
          event.preventDefault();
          handleStop();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          const newTimeLeft = Math.max(0, currentTime - playerSettings.seekStep);
          setCurrentTime(newTimeLeft);
          Object.values(audioRefs.current).forEach(audio => {
            if (audio) audio.currentTime = newTimeLeft;
          });
          break;
        case 'ArrowRight':
          event.preventDefault();
          const newTimeRight = Math.min(duration, currentTime + playerSettings.seekStep);
          setCurrentTime(newTimeRight);
          Object.values(audioRefs.current).forEach(audio => {
            if (audio) audio.currentTime = newTimeRight;
          });
          break;
        case 'KeyM':
          event.preventDefault();
          // Mutar/desmutar todas as faixas
          const allMuted = Object.values(trackMuted).every(muted => muted);
          const newMutedState = {};
          tracks.forEach((_, index) => {
            newMutedState[index] = !allMuted;
          });
          setTrackMuted(newMutedState);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime, duration, trackMuted, tracks, playerSettings]);

  // Atualizar tempo atual e VU meters
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const firstAudio = Object.values(audioRefs.current)[0];
        if (firstAudio && !firstAudio.paused) {
          setCurrentTime(firstAudio.currentTime);
          
          // Verificar loop de seção
          if (loopEnabled && loopEnd > loopStart && firstAudio.currentTime >= loopEnd) {
            // Voltar para o início do loop
            Object.values(audioRefs.current).forEach(audio => {
              if (audio) {
                audio.currentTime = loopStart;
              }
            });
          }
          
          if (firstAudio.ended) {
            handleStop();
          }
        }
      }, 100);
      
      // VU Meter updates - sincronizado com batida em tempo real
      vuIntervalRef.current = setInterval(() => {
        const newVuLevels = {};
        Object.keys(analyserRefs.current).forEach(index => {
          const analyser = analyserRefs.current[index];
          const audio = audioRefs.current[index];
          
          if (analyser && audio && !audio.paused && !audio.muted) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const timeDataArray = new Uint8Array(analyser.fftSize);
            
            // Usar dados de tempo para capturar transientes (batidas)
            analyser.getByteTimeDomainData(timeDataArray);
            analyser.getByteFrequencyData(dataArray);
            
            // Detectar transientes (batidas) através de mudanças bruscas no sinal
            let rms = 0;
            let peak = 0;
            for (let i = 0; i < timeDataArray.length; i++) {
              const sample = (timeDataArray[i] - 128) / 128; // Normalizar para -1 a 1
              rms += sample * sample;
              peak = Math.max(peak, Math.abs(sample));
            }
            rms = Math.sqrt(rms / timeDataArray.length);
            
            // Análise de frequência para diferentes bandas (graves, médios, agudos)
            const bassRange = Math.floor(dataArray.length * 0.05); // 0-5% (graves)
            const midRange = Math.floor(dataArray.length * 0.3);   // 5-30% (médios)
            const highRange = Math.floor(dataArray.length * 0.8);  // 30-80% (agudos)
            
            let bassLevel = 0, midLevel = 0, highLevel = 0;
            
            // Calcular níveis por banda
            for (let i = 0; i < bassRange; i++) {
              bassLevel += dataArray[i];
            }
            for (let i = bassRange; i < midRange; i++) {
              midLevel += dataArray[i];
            }
            for (let i = midRange; i < highRange; i++) {
              highLevel += dataArray[i];
            }
            
            bassLevel = (bassLevel / bassRange) / 255;
            midLevel = (midLevel / (midRange - bassRange)) / 255;
            highLevel = (highLevel / (highRange - midRange)) / 255;
            
            // Combinar RMS, peak e análise de frequência para resposta mais precisa
            const combinedLevel = (rms * 0.4 + peak * 0.3 + bassLevel * 0.2 + midLevel * 0.1) * 100;
            
            // Aplicar volume do track
            const trackVolume = (trackVolumes[index] || 80) / 100;
            const level = Math.min(100, combinedLevel * trackVolume * 1.5);
            
            // Resposta mais rápida para batidas (menos suavização)
            const currentLevel = vuLevels[index] || 0;
            const smoothingFactor = level > currentLevel ? 0.9 : 0.3; // Subida muito rápida, descida moderada
            newVuLevels[index] = currentLevel + (level - currentLevel) * smoothingFactor;
          } else {
            // Decaimento rápido quando não há áudio
            const currentLevel = vuLevels[index] || 0;
            newVuLevels[index] = Math.max(0, currentLevel * 0.7);
          }
        });
        setVuLevels(newVuLevels);
      }, 8); // ~120 FPS para capturar batidas rápidas
    } else {
      clearInterval(intervalRef.current);
      clearInterval(vuIntervalRef.current);
      setVuLevels({});
    }

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(vuIntervalRef.current);
    };
  }, [isPlaying]);

  // Configurar Intersection Observer para otimização de performance
  useEffect(() => {
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Faixa está visível, pode processar waveform
              const trackElement = entry.target;
              const trackIndex = parseInt(trackElement.dataset.trackIndex || '0');
              // Processar waveform se necessário
            }
          });
        },
        {
          root: null,
          rootMargin: '50px',
          threshold: 0.1
        }
      );
      
      setIntersectionObserver(observer);
      
      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // Função para gerar dados de forma de onda
  const generateWaveformData = useCallback((index, analyser) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateWaveform = () => {
      if (analyser && showWaveform) {
        analyser.getByteFrequencyData(dataArray);
        
        // Reduzir dados para visualização (pegar apenas alguns pontos)
        const reducedData = [];
        const step = Math.floor(bufferLength / 100); // 100 pontos para a forma de onda
        
        for (let i = 0; i < bufferLength; i += step) {
          const value = dataArray[i] / 255; // Normalizar para 0-1
          reducedData.push(value);
        }
        
        setWaveformData(prev => ({ ...prev, [index]: reducedData }));
        
        if (showWaveform) {
          requestAnimationFrame(updateWaveform);
        }
      }
    };
    
    if (showWaveform) {
      updateWaveform();
    }
  }, [showWaveform]);
  
  // Efeito para inicializar/parar waveform quando a opção é alterada
  useEffect(() => {
    if (showWaveform) {
      // Inicializar waveform para todos os analysers existentes
      Object.keys(analyserRefs.current).forEach(index => {
        const analyser = analyserRefs.current[index];
        if (analyser) {
          generateWaveformData(parseInt(index), analyser);
        }
      });
    } else {
      // Limpar dados de waveform
      setWaveformData({});
    }
  }, [showWaveform, generateWaveformData]);
  
  // Função para definir ponto de início do loop
  const setLoopStartPoint = useCallback(() => {
    setLoopStart(currentTime);
    if (loopEnd <= currentTime) {
      setLoopEnd(Math.min(currentTime + 10, duration)); // 10 segundos por padrão
    }
  }, [currentTime, duration, loopEnd]);
  
  // Função para definir ponto de fim do loop
  const setLoopEndPoint = useCallback(() => {
    setLoopEnd(currentTime);
    if (loopStart >= currentTime) {
      setLoopStart(Math.max(currentTime - 10, 0)); // 10 segundos antes por padrão
    }
  }, [currentTime, loopStart]);
  
  // Função para formatar tempo em MM:SS
  const formatTimeLoop = useCallback((time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Touch gesture handlers
  // Funções de controle de reprodução (definidas primeiro para evitar dependência circular)
  // Funções de controle de reprodução (definidas primeiro para evitar dependência circular)
  // Funções duplicadas removidas - já definidas anteriormente

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const minSwipeDistance = 50;

    // Swipe horizontal para navegação entre faixas
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && currentTrackIndex > 0) {
        // Swipe right - faixa anterior
        setCurrentTrackIndex(prev => prev - 1);
      } else if (deltaX < 0 && currentTrackIndex < tracks.length - 1) {
        // Swipe left - próxima faixa
        setCurrentTrackIndex(prev => prev + 1);
      }
    }
  }, [touchStartX, touchStartY, currentTrackIndex, tracks.length]);

  // Double tap para play/pause
  const handleDoubleTap = useCallback((e) => {
    const now = Date.now();
    const timeDiff = now - lastTap;
    
    if (timeDiff < 300 && timeDiff > 0) {
      e.preventDefault();
      isPlaying ? handlePause() : handlePlay();
    }
    setLastTap(now);
  }, [lastTap, isPlaying, handlePlay, handlePause]);

  // Pinch to zoom para waveform
  const handlePinchZoom = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Implementar lógica de zoom baseada na distância
      setZoomLevel(prev => Math.max(0.5, Math.min(3, prev * (distance / 100))));
    }
  }, []);

  // Performance optimization: Lazy loading de faixas
  const getVisibleTracks = useMemo(() => {
    if (!isMobile || tracks.length <= 10) {
      return tracks; // Mostrar todas se for desktop ou poucas faixas
    }
    
    const startIndex = Math.max(0, currentTrackIndex - lazyLoadOffset);
    const endIndex = Math.min(tracks.length, currentTrackIndex + lazyLoadOffset + 1);
    
    return tracks.slice(startIndex, endIndex).map((track, index) => ({
      ...track,
      originalIndex: startIndex + index
    }));
  }, [tracks, currentTrackIndex, lazyLoadOffset, isMobile]);

  // Performance optimization: Intersection Observer para faixas visíveis
  useEffect(() => {
    if (!isMobile) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const newVisibleTracks = new Set(visibleTracks);
        
        entries.forEach((entry) => {
          const trackIndex = parseInt(entry.target.dataset.trackIndex);
          if (entry.isIntersecting) {
            newVisibleTracks.add(trackIndex);
          } else {
            newVisibleTracks.delete(trackIndex);
          }
        });
        
        setVisibleTracks(newVisibleTracks);
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    // Observar elementos de faixa quando montados
    const trackElements = document.querySelectorAll('[data-track-index]');
    trackElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [isMobile, visibleTracks]);

  // Performance optimization: Debounced waveform updates
  const debouncedWaveformUpdate = useCallback(
    useMemo(() => {
      let timeoutId;
      return (callback) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(callback, 100);
      };
    }, []),
    []
  );

  // Configurar duração quando os áudios carregam
  const handleLoadedMetadata = useCallback(async (index) => {
    const audio = audioRefs.current[index];
    const track = tracks[index];
    const trackName = track?.name || track?.filename || `Faixa ${index + 1}`;
    
    console.log(`🎵 Carregando faixa ${index + 1}/${tracks.length}: ${trackName}`);
    
    setLoadingStatus(`Carregando ${trackName}...`);
    setLoadingProgress(prev => ({ ...prev, [index]: 25 }));
    
    if (audio && audio.duration > duration) {
      setDuration(audio.duration);
    }
    
    try {
      setLoadingProgress(prev => ({ ...prev, [index]: 50 }));
      
      // Configurar Web Audio API apenas se ainda não foi configurado para este áudio
      if (!analyserRefs.current[index]) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Criar analyser para VU meter
        try {
          const source = audioContextRef.current.createMediaElementSource(audio);
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 1024; // Maior resolução para melhor precisão e waveform
          analyser.smoothingTimeConstant = 0.2; // Menos suavização para resposta mais rápida
          
          source.connect(analyser);
          analyser.connect(audioContextRef.current.destination);
          analyserRefs.current[index] = analyser;
          
          // Gerar dados de forma de onda se habilitado
          if (showWaveform) {
            generateWaveformData(index, analyser);
          }
        } catch (webAudioError) {
          console.warn(`Erro ao configurar Web Audio para faixa ${index}:`, webAudioError.message);
        }
      }
      
      setLoadingProgress(prev => ({ ...prev, [index]: 75 }));
      
      // Carregamento otimizado sem waveform
      setLoadingProgress(prev => ({ ...prev, [index]: 75 }));
      setLoadingStatus(`Finalizando ${trackName}...`);
      console.log(`✅ Track ${index} carregado e pronto`);
      
      setLoadingProgress(prev => ({ ...prev, [index]: 100 }));
      console.log(`✅ Faixa ${index + 1} carregada: ${trackName} (${Math.round(audio.duration)}s)`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar faixa ${index}:`, error.message);
      // Erro no carregamento do track
      console.warn(`❌ Erro ao carregar track ${index}:`, error);
      setLoadingProgress(prev => ({ ...prev, [index]: 100 }));
    }
  }, [duration, tracks]);

  // Tratar erros de carregamento de áudio
  const handleAudioError = useCallback((index, errorMessage) => {
    const track = tracks[index];
    const trackName = track?.name || track?.filename || `Faixa ${index + 1}`;
    
    console.error(`❌ ERRO AO CARREGAR ÁUDIO ${index} (${trackName}):`, errorMessage);
    console.error('URL do áudio:', track?.url);
    console.error('Detalhes do track:', track);
    
    // Marcar como carregado mesmo com erro para não travar o loading
    setLoadingProgress(prev => ({ ...prev, [index]: 100 }));
    setLoadingStatus(`Erro ao carregar ${trackName}`);
    
    setLoadingStatus(`Erro ao carregar ${trackName}`);
  }, [tracks]);

  // Verificar se todos os tracks foram carregados (sem waveforms)
  useEffect(() => {
    if (tracks.length > 0) {
      const loadedTracks = Object.keys(loadingProgress).filter(key => loadingProgress[key] === 100);
      
      const allTracksLoaded = loadedTracks.length >= tracks.length;
      
      console.log('📊 Status de carregamento:', {
        tracks: `${loadedTracks.length}/${tracks.length}`,
        allReady: allTracksLoaded
      });
      
      if (allTracksLoaded) {
        console.log('✅ TODOS OS TRACKS CARREGADOS! Finalizando loading...');
        setLoadingStatus('Finalizando...');
        setTimeout(() => {
          console.log('🎵 LOADING FINALIZADO - MOSTRANDO PLAYER');
          setIsLoading(false);
        }, 200);
      }
    } else {
      setIsLoading(false);
    }
  }, [loadingProgress, tracks.length]);
  
  // Fallback de segurança - forçar parada do loading após 8 segundos
  useEffect(() => {
    if (tracks.length > 0 && isLoading) {
      const fallbackTimer = setTimeout(() => {
        console.log('⚠️ FALLBACK ATIVADO - Forçando parada do loading após 8 segundos');
        setIsLoading(false);
      }, 8000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [tracks.length, isLoading]);

  // Inicializar carregamento quando tracks mudarem
  useEffect(() => {
    if (tracks.length > 0) {
      console.log('🎵 Iniciando carregamento de', tracks.length, 'tracks');
      setIsLoading(true);
      setLoadingProgress({});
      setLoadingStatus('Inicializando...');
    } else {
      setIsLoading(false);
    }
  }, [tracks]);

  // Funções removidas - movidas para antes do handleKeyPress

  const handleSeek = (event, newValue) => {
    const newTime = (newValue / 100) * duration;
    setCurrentTime(newTime);
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) audio.currentTime = newTime;
    });
  };

  const handleVolumeChange = (trackIndex, newValue) => {
    setTrackVolumes(prev => ({ ...prev, [trackIndex]: newValue }));
    updateAudioVolume(trackIndex, newValue);
  };

  const updateAudioVolume = (trackIndex, trackVolume) => {
    const audio = audioRefs.current[trackIndex];
    if (audio) {
      const hasSolo = Object.values(trackSolo).some(solo => solo);
      let finalVolume = 0;
      
      if (trackMuted[trackIndex]) {
        finalVolume = 0;
      } else if (hasSolo) {
        finalVolume = trackSolo[trackIndex] ? trackVolume / 100 : 0;
      } else {
        finalVolume = trackVolume / 100;
      }
      
      audio.volume = Math.max(0, Math.min(1, finalVolume));
    }
  };

  const handleMuteToggle = (trackIndex) => {
    const newMuted = !trackMuted[trackIndex];
    setTrackMuted(prev => ({ ...prev, [trackIndex]: newMuted }));
    updateAudioVolume(trackIndex, trackVolumes[trackIndex]);
  };

  const handleSoloToggle = (trackIndex) => {
    const newSolo = !trackSolo[trackIndex];
    setTrackSolo(prev => ({ ...prev, [trackIndex]: newSolo }));
    
    // Atualizar volumes de todos os tracks
    Object.keys(trackVolumes).forEach(index => {
      updateAudioVolume(parseInt(index), trackVolumes[index]);
    });
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const tracksToUse = tracks.length > 0 ? tracks : [];
  
  if (tracksToUse.length === 0) {
    return (
      <Box sx={{ bgcolor: '#1a1a1a', color: 'white', minHeight: '400px', p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="#666">
          Nenhuma faixa disponível para reprodução
        </Typography>
      </Box>
    );
  }

  // Tela de carregamento com blur
  if (isLoading) {
    const totalProgress = tracks.length > 0 ? 
      Object.values(loadingProgress).reduce((sum, progress) => sum + progress, 0) / tracks.length : 0;
    
    return (
      <Box sx={{ bgcolor: '#1e1e1e', color: 'white', minHeight: '100vh', position: 'relative' }}>
        {/* Conteúdo em blur */}
        <Box sx={{ 
          filter: 'blur(3px)', 
          opacity: 0.3,
          pointerEvents: 'none'
        }}>
          {/* Transport Controls */}
          <Paper sx={{ bgcolor: '#2a2a2a', p: 2, borderRadius: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 2,
          width: '100%'
        }}>
              <IconButton disabled sx={{ bgcolor: '#333', color: '#666', width: 48, height: 36 }}>
                <PlayIcon />
              </IconButton>
            </Box>
          </Paper>
          
          {/* Preview dos tracks */}
           {tracks.slice(0, 3).map((track, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              height: '80px', 
              bgcolor: index % 2 === 0 ? '#252525' : '#2a2a2a',
              borderBottom: '1px solid #333'
            }}>
              <Box sx={{ width: 200, bgcolor: '#1e1e1e', borderRight: '1px solid #333' }} />
              <Box sx={{ flex: 1, bgcolor: '#1a1a1a' }} />
              <Box sx={{ width: 120, bgcolor: '#1e1e1e', borderLeft: '1px solid #333' }} />
            </Box>
          ))}
        </Box>
        
        {/* Overlay de carregamento com spinner do sistema */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(26, 26, 26, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 10
        }}>
          <Box sx={{ textAlign: 'center', maxWidth: 500, width: '100%', p: 4 }}>
            {/* Spinner circular do sistema */}
            <Box sx={{ mb: 4, position: 'relative', display: 'inline-flex' }}>
              <CircularProgress 
                size={80} 
                thickness={3}
                sx={{ 
                  color: '#4CAF50',
                  animationDuration: '1.4s'
                }}
              />
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  🎵
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="h4" sx={{ mb: 1, color: '#fff', fontWeight: 400 }}>
              {title}
            </Typography>
            
            {(artist || bpm || songKey) && (
              <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {artist && (
                  <Chip 
                    label={`🎤 ${artist}`} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(76, 175, 80, 0.2)', 
                      color: '#4CAF50',
                      border: '1px solid rgba(76, 175, 80, 0.3)'
                    }} 
                  />
                )}
                {bpm && (
                  <Chip 
                    label={`♩ ${bpm} BPM`} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(33, 150, 243, 0.2)', 
                      color: '#2196F3',
                      border: '1px solid rgba(33, 150, 243, 0.3)'
                    }} 
                  />
                )}
                {songKey && (
                  <Chip 
                    label={`🎼 ${songKey}`} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(156, 39, 176, 0.2)', 
                      color: '#9C27B0',
                      border: '1px solid rgba(156, 39, 176, 0.3)'
                    }} 
                  />
                )}
              </Box>
            )}
            
            <Typography variant="body1" sx={{ mb: 4, color: '#ccc', opacity: 0.8 }}>
              {loadingStatus || 'Preparando faixas de áudio...'}
            </Typography>
            
            {/* Progresso geral simplificado */}
            <Box sx={{ mb: 3, width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  Progresso
                </Typography>
                <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                  {Math.round(totalProgress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={totalProgress} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#4CAF50',
                    borderRadius: 3
                  }
                }}
              />
            </Box>
            
            {/* Lista compacta de faixas */}
            <Box sx={{ textAlign: 'left', maxHeight: 200, overflowY: 'auto' }}>
              {tracks.map((track, index) => {
                const progress = loadingProgress[index] || 0;
                const trackName = track.name || track.filename?.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') || `Faixa ${index + 1}`;
                
                return (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    py: 0.5,
                    px: 1,
                    mb: 0.5,
                    bgcolor: progress === 100 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)',
                    borderRadius: 1,
                    border: progress === 100 ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid transparent'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: progress === 100 ? '#4CAF50' : '#FFA726',
                        mr: 1,
                        animation: progress < 100 ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                          '100%': { opacity: 1 }
                        }
                      }} />
                      <Typography variant="caption" sx={{ 
                        color: progress === 100 ? '#4CAF50' : '#ccc',
                        fontSize: '0.75rem'
                      }}>
                        {trackName}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ 
                      color: progress === 100 ? '#4CAF50' : '#aaa',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}>
                      {progress === 100 ? '✓' : `${progress}%`}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Verificação de conectividade - bloquear player multitrack se offline
  if (!canUseMultitrack) {
    return (
      <Box sx={{ 
        bgcolor: '#1e1e1e', 
        color: 'white', 
        minHeight: '400px', 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 3
      }}>
        <CloudOffIcon sx={{ fontSize: 80, color: '#666' }} />
        
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <Typography variant="h5" sx={{ mb: 2, color: '#fff' }}>
            {!isOnline ? 'Sem Conexão' : 'Conexão Instável'}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, color: '#ccc', lineHeight: 1.6 }}>
            {!isOnline 
              ? 'O player multitrack requer conexão com a internet para funcionar. Conecte-se e tente novamente.'
              : `Sua conexão está ${connectionQuality === 'poor' ? 'muito lenta' : 'instável'}. O player multitrack pode não funcionar adequadamente.`
            }
          </Typography>
          
          <ConnectionStatus showAlert={false} />
          
          {!isOnline && (
            <Button 
              variant="contained" 
              startIcon={<WifiIcon />}
              onClick={() => window.location.reload()}
              sx={{ 
                mt: 2,
                bgcolor: '#4CAF50',
                '&:hover': { bgcolor: '#45a049' }
              }}
            >
              Tentar Reconectar
            </Button>
          )}
        </Box>
        
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: 'rgba(255,255,255,0.05)', 
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography variant="caption" sx={{ color: '#999' }}>
            💡 Dica: Use o Player Simples para reproduzir arquivos locais sem internet
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#1e1e1e', color: 'white', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Status de Conectividade */}
      <Box sx={{ 
        position: 'fixed', 
        top: 70, 
        right: 16, 
        zIndex: 1200,
        display: { xs: 'none', sm: 'block' }
      }}>
        <ConnectionStatus compact={true} />
      </Box>
      {/* Keyboard Help */}
      <Collapse in={showKeyboardHelp}>
        <Alert 
          severity="info" 
          sx={{ mb: 2, bgcolor: '#2a2a2a', color: 'white', border: '1px solid #444' }}
          onClose={() => setShowKeyboardHelp(false)}
        >
          <Typography variant="subtitle2" gutterBottom sx={{ color: '#4CAF50' }}>
            Atalhos de Teclado:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
            <Typography variant="body2" sx={{ color: '#ccc' }}><strong>Espaço:</strong> Play/Pause</Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}><strong>S:</strong> Stop</Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}><strong>← →:</strong> Voltar/Avançar {playerSettings.seekStep}s</Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}><strong>M:</strong> Mutar/Desmutar todas</Typography>
          </Box>
        </Alert>
      </Collapse>

      {/* Transport Controls */}
      <Paper sx={{ bgcolor: '#2a2a2a', p: 2, borderRadius: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        {/* Controles de Loop e Visualização */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 2, 
          mb: 2, 
          pb: 2, 
          borderBottom: '1px solid #444' 
        }}>
          <FormControlLabel
            control={
              <Switch
                checked={loopEnabled}
                onChange={(e) => setLoopEnabled(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#4CAF50',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#4CAF50',
                  },
                }}
              />
            }
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LoopIcon /> Loop</Box>}
            sx={{ color: 'white' }}
          />
          
          {loopEnabled && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 2,
              width: isMobile ? '100%' : 'auto'
            }}>
              <TextField
                 label="Início"
                 value={formatTimeLoop(loopStart)}
                 size="small"
                sx={{
                  width: 80,
                  '& .MuiInputLabel-root': { color: '#aaa' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#777' },
                    '&.Mui-focused fieldset': { borderColor: '#4CAF50' },
                  },
                }}
                InputProps={{ readOnly: true }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={setLoopStartPoint}
                sx={{ color: '#4CAF50', borderColor: '#4CAF50' }}
              >
                Definir
              </Button>
              
              <TextField
                 label="Fim"
                 value={formatTimeLoop(loopEnd)}
                 size="small"
                sx={{
                  width: 80,
                  '& .MuiInputLabel-root': { color: '#aaa' },
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: '#555' },
                    '&:hover fieldset': { borderColor: '#777' },
                    '&.Mui-focused fieldset': { borderColor: '#4CAF50' },
                  },
                }}
                InputProps={{ readOnly: true }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={setLoopEndPoint}
                sx={{ color: '#4CAF50', borderColor: '#4CAF50' }}
              >
                Definir
              </Button>
            </Box>
          )}
          
          <FormControlLabel
            control={
              <Switch
                checked={showWaveform}
                onChange={(e) => setShowWaveform(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#2196F3',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#2196F3',
                  },
                }}
              />
            }
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><WaveformIcon /> Forma de Onda</Box>}
            sx={{ color: 'white', ml: 2 }}
          />
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 2,
          width: '100%'
        }}>
          {/* Transport Buttons */}
          <Box sx={{ 
            display: 'flex', 
            gap: isMobile ? 2 : 1,
            justifyContent: isMobile ? 'center' : 'flex-start',
            width: isMobile ? '100%' : 'auto'
          }}>
            <IconButton
              onClick={handleStop}
              disabled={isLoading}
              sx={{ 
                bgcolor: '#333', 
                color: 'white', 
                width: isMobile ? 48 : 36, 
                height: isMobile ? 48 : 36,
                '&:hover': { bgcolor: '#444' },
                '&:disabled': { bgcolor: '#222', color: '#666' }
              }}
            >
              <StopIcon fontSize={isMobile ? "medium" : "small"} />
            </IconButton>
            
            <IconButton
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={isLoading}
              sx={{ 
                bgcolor: isPlaying ? '#ff6b35' : '#4CAF50', 
                color: 'white', 
                width: isMobile ? 56 : 48, 
                height: isMobile ? 48 : 36,
                '&:hover': { bgcolor: isPlaying ? '#e55a2b' : '#45a049' },
                '&:disabled': { bgcolor: '#222', color: '#666' }
              }}
            >
              {isPlaying ? <PauseIcon fontSize={isMobile ? "large" : "medium"} /> : <PlayIcon fontSize={isMobile ? "large" : "medium"} />}
            </IconButton>
          </Box>
          
          {/* Time Display */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? 1 : 2, 
            minWidth: isMobile ? 'auto' : 200,
            justifyContent: isMobile ? 'center' : 'flex-start',
            width: isMobile ? '100%' : 'auto'
          }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '16px', color: '#4CAF50', minWidth: 60 }}>
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>/</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '16px', color: '#ccc', minWidth: 60 }}>
              {formatTime(duration)}
            </Typography>
          </Box>
          
          {/* Progress Bar */}
          <Box sx={{ 
            flex: 1, 
            mx: isMobile ? 0 : 2,
            width: isMobile ? '100%' : 'auto',
            mt: isMobile ? 1 : 0
          }}>
            <Slider
              value={duration > 0 ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              disabled={isLoading}
              sx={{ 
                color: '#4CAF50',
                height: isMobile ? 8 : 6,
                '& .MuiSlider-thumb': {
                  width: isMobile ? 20 : 14,
                  height: isMobile ? 20 : 14,
                  bgcolor: '#4CAF50',
                  '&:hover': { boxShadow: '0 0 0 8px rgba(76, 175, 80, 0.16)' }
                },
                '& .MuiSlider-track': { bgcolor: '#4CAF50', border: 'none' },
                '& .MuiSlider-rail': { bgcolor: '#444' }
              }}
            />
          </Box>
          
          {/* Track Count and Controls */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 1 : 2,
            justifyContent: isMobile ? 'center' : 'flex-start',
            width: isMobile ? '100%' : 'auto',
            mt: isMobile ? 1 : 0
          }}>
            <Typography variant="body2" sx={{ color: '#ccc', minWidth: isMobile ? 'auto' : 80, fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              {getVisibleTracks.length} tracks
            </Typography>
            
            {/* Keyboard Help Button */}
            <Tooltip title="Atalhos de Teclado">
              <IconButton 
                onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                size={isMobile ? "medium" : "small"}
                sx={{
                  color: showKeyboardHelp ? '#4CAF50' : '#ccc',
                  bgcolor: showKeyboardHelp ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.2)' }
                }}
              >
                <KeyboardIcon fontSize={isMobile ? "medium" : "small"} />
               </IconButton>
             </Tooltip>
             
             {/* Settings Button */}
             <Tooltip title="Configurações">
               <IconButton 
                 onClick={() => setShowSettings(true)}
                 size={isMobile ? "medium" : "small"}
                 sx={{
                   color: '#ccc',
                   '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                 }}
               >
                 <SettingsIcon fontSize={isMobile ? "medium" : "small"} />
               </IconButton>
             </Tooltip>
           </Box>
          
          {/* Loading Indicator */}
          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress sx={{ width: 60, height: 4, bgcolor: '#333', '& .MuiLinearProgress-bar': { bgcolor: '#4CAF50' } }} />
              <Typography variant="caption" sx={{ color: '#666' }}>Loading...</Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Tracks Container */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 100px)', 
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px'
        },
        '&::-webkit-scrollbar-track': {
          background: '#1a1a1a'
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#555',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#777'
        }
      }}>
        {getVisibleTracks.map((track, index) => {
          const trackName = track.filename?.replace(/\.(wav|mp3|flac|m4a|aac|ogg)$/i, '') || `Track ${index + 1}`;
          const trackColor = getTrackColor(trackName);
          const trackWaveformData = waveformData[index] || [];
          
          return (
            <Box 
              key={index} 
              ref={el => {
                if (el && intersectionObserver) {
                  intersectionObserver.observe(el);
                }
              }}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchEnd={(e) => handleTouchEnd(e, index)}
              sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                height: isMobile ? 'auto' : '80px', 
              minHeight: isMobile ? '120px' : '80px',
              bgcolor: index % 2 === 0 ? '#252525' : '#2a2a2a',
              borderBottom: '1px solid #333',
              '&:hover': { bgcolor: '#2f2f2f' }
            }}>
              {/* Track Info Panel */}
              <Box sx={{ 
                width: isMobile ? '100%' : 200, 
                minWidth: isMobile ? 'auto' : 200,
                display: 'flex', 
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'center' : 'stretch',
                p: isMobile ? 2 : 1, 
                bgcolor: '#1e1e1e',
                borderRight: isMobile ? 'none' : '1px solid #333',
                borderBottom: isMobile ? '1px solid #333' : 'none',
                gap: isMobile ? 2 : 0
              }}>
                {/* Track Number & Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ 
                    color: '#666', 
                    fontFamily: 'monospace', 
                    minWidth: 20,
                    fontSize: '11px'
                  }}>
                    {(index + 1).toString().padStart(2, '0')}
                  </Typography>
                  <Chip
                    label={trackName}
                    size="small"
                    sx={{ 
                      bgcolor: trackColor, 
                      color: 'white',
                      fontSize: '10px',
                      height: 20,
                      maxWidth: 140,
                      '& .MuiChip-label': { px: 1 }
                    }}
                  />
                </Box>
                
                {/* Control Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: isMobile ? 1 : 0.5, 
                  mb: isMobile ? 0 : 1,
                  flexDirection: isMobile ? 'row' : 'row'
                }}>
                  <Button
                    size={isMobile ? "medium" : "small"}
                    variant={trackMuted[index] ? 'contained' : 'outlined'}
                    onClick={() => handleMuteToggle(index)}
                    sx={{ 
                      minWidth: isMobile ? 40 : 28, 
                      width: isMobile ? 40 : 28, 
                      height: isMobile ? 32 : 20,
                      fontSize: isMobile ? '12px' : '9px',
                      color: trackMuted[index] ? 'white' : '#999',
                      bgcolor: trackMuted[index] ? '#f44336' : 'transparent',
                      borderColor: '#555',
                      '&:hover': { borderColor: '#777' }
                    }}
                  >
                    M
                  </Button>
                  <Button
                    size={isMobile ? "medium" : "small"}
                    variant={trackSolo[index] ? 'contained' : 'outlined'}
                    onClick={() => handleSoloToggle(index)}
                    sx={{ 
                      minWidth: isMobile ? 40 : 28, 
                      width: isMobile ? 40 : 28, 
                      height: isMobile ? 32 : 20,
                      fontSize: isMobile ? '12px' : '9px',
                      color: trackSolo[index] ? 'white' : '#999',
                      bgcolor: trackSolo[index] ? '#ff9800' : 'transparent',
                      borderColor: '#555',
                      '&:hover': { borderColor: '#777' }
                    }}
                  >
                    S
                  </Button>
                </Box>
                
                {/* Volume Control - Melhorado */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? 1 : 0.5, 
                  height: isMobile ? 32 : 24,
                  width: isMobile ? '100%' : 'auto',
                  minWidth: isMobile ? 120 : 'auto'
                }}>
                  <IconButton
                    size="small"
                    onClick={() => handleMuteToggle(index)}
                    sx={{ 
                      color: trackMuted[index] ? '#f44336' : trackColor, 
                      p: 0.25,
                      width: 20,
                      height: 20,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    {trackMuted[index] ? <MuteIcon sx={{ fontSize: 14 }} /> : <VolumeIcon sx={{ fontSize: 14 }} />}
                  </IconButton>
                  <Box sx={{ flex: 1, px: 0.5 }}>
                    <Slider
                      value={trackVolumes[index] || 80}
                      onChange={(e, value) => handleVolumeChange(index, value)}
                      size={isMobile ? "medium" : "small"}
                      min={0}
                      max={100}
                      disabled={trackMuted[index]}
                      sx={{ 
                        color: trackMuted[index] ? '#666' : trackColor,
                        height: isMobile ? 6 : 3,
                        '& .MuiSlider-thumb': {
                          bgcolor: trackMuted[index] ? '#666' : trackColor,
                          width: isMobile ? 16 : 10,
                          height: isMobile ? 16 : 10,
                          '&:hover': {
                            boxShadow: `0 0 0 6px ${trackMuted[index] ? 'rgba(102,102,102,0.16)' : `${trackColor}16`}`
                          }
                        },
                        '& .MuiSlider-track': { 
                          bgcolor: trackMuted[index] ? '#666' : trackColor,
                          border: 'none'
                        },
                        '& .MuiSlider-rail': { bgcolor: '#333' }
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ 
                    minWidth: 28, 
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    color: trackMuted[index] ? '#666' : '#ccc',
                    fontSize: '10px',
                    fontWeight: 500
                  }}>
                    {trackMuted[index] ? 'MUTE' : `${Math.round(trackVolumes[index] || 80)}`}
                  </Typography>
                </Box>
              </Box>
              
              {/* Track Waveform Display */}
              <Box sx={{ 
                flex: 1, 
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#1a1a1a',
                px: isMobile ? 1 : 2,
                py: isMobile ? 0.5 : 1,
                minHeight: isMobile ? 60 : 'auto'
              }}>
                <Typography variant="caption" sx={{ 
                  color: trackColor,
                  fontWeight: 500,
                  opacity: isPlaying ? 1 : 0.7,
                  fontSize: '10px',
                  mb: 0.5
                }}>
                  {track.name || track.filename || `Track ${index + 1}`}
                </Typography>
                
                {/* Waveform ou Progress Bar */}
                <Box sx={{ 
                  flex: 1, 
                  height: showWaveform ? (isMobile ? 50 : 40) : (isMobile ? 8 : 6), 
                  bgcolor: '#333', 
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: isMobile ? 40 : 'auto'
                }}>
                  {showWaveform && trackWaveformData.length > 0 ? (
                    // Visualização de forma de onda
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '100%',
                      gap: '1px'
                    }}>
                      {trackWaveformData.map((value, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: `${2 * zoomLevel}px`,
                            height: `${Math.max(2, value * 100)}%`,
                            bgcolor: i < (trackWaveformData.length * (currentTime / duration)) ? trackColor : '#555',
                            transition: 'background-color 0.1s ease',
                            borderRadius: '1px'
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    // Barra de progresso simples
                    <Box sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                      bgcolor: trackColor,
                      borderRadius: 1,
                      transition: 'width 0.1s ease'
                    }} />
                  )}
                  
                  {/* Indicadores de loop */}
                  {loopEnabled && duration > 0 && (
                    <>
                      <Box sx={{
                        position: 'absolute',
                        left: `${(loopStart / duration) * 100}%`,
                        top: 0,
                        width: '2px',
                        height: '100%',
                        bgcolor: '#4CAF50',
                        zIndex: 2
                      }} />
                      <Box sx={{
                        position: 'absolute',
                        left: `${(loopEnd / duration) * 100}%`,
                        top: 0,
                        width: '2px',
                        height: '100%',
                        bgcolor: '#f44336',
                        zIndex: 2
                      }} />
                    </>
                  )}
                </Box>
              </Box>
              
              {/* VU Meter Horizontal */}
              <Box sx={{ 
                width: 120, 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                p: 1, 
                bgcolor: '#1e1e1e',
                borderLeft: '1px solid #333'
              }}>
                {/* Canal L */}
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#666', fontSize: '8px', mb: 0.5, display: 'block' }}>L</Typography>
                  <Box sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: '#0a0a0a',
                    borderRadius: 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.min(100, (vuLevels[index] || 0))}%`,
                      bgcolor: (vuLevels[index] || 0) > 85 ? '#f44336' : 
                               (vuLevels[index] || 0) > 70 ? '#ff9800' : 
                               (vuLevels[index] || 0) > 50 ? '#ffeb3b' : trackColor,
                      transition: 'width 0.05s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.1s ease',
                      borderRadius: 1,
                      boxShadow: (vuLevels[index] || 0) > 50 ? `0 0 4px ${trackColor}` : 'none'
                    }} />
                    {/* Scale marks */}
                    {[25, 50, 75].map(mark => (
                      <Box key={mark} sx={{
                        position: 'absolute',
                        left: `${mark}%`,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        bgcolor: '#333',
                        opacity: 0.6
                      }} />
                    ))}
                  </Box>
                </Box>
                
                {/* Canal R */}
                <Box>
                  <Typography variant="caption" sx={{ color: '#666', fontSize: '8px', mb: 0.5, display: 'block' }}>R</Typography>
                  <Box sx={{
                    width: '100%',
                    height: 8,
                    bgcolor: '#0a0a0a',
                    borderRadius: 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.min(100, (vuLevels[index] || 0) * 0.9)}%`, // Canal R ligeiramente diferente
                      bgcolor: (vuLevels[index] || 0) > 85 ? '#f44336' : 
                               (vuLevels[index] || 0) > 70 ? '#ff9800' : 
                               (vuLevels[index] || 0) > 50 ? '#ffeb3b' : trackColor,
                      transition: 'width 0.05s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.1s ease',
                      borderRadius: 1,
                      boxShadow: (vuLevels[index] || 0) > 50 ? `0 0 4px ${trackColor}` : 'none'
                    }} />
                    {/* Scale marks */}
                    {[25, 50, 75].map(mark => (
                      <Box key={mark} sx={{
                        position: 'absolute',
                        left: `${mark}%`,
                        top: 0,
                        bottom: 0,
                        width: 1,
                        bgcolor: '#333',
                        opacity: 0.6
                      }} />
                    ))}
                  </Box>
                </Box>
              </Box>
              
              {/* Hidden Audio Element */}
              <audio
                ref={el => {
                  if (el) {
                    audioRefs.current[index] = el;
                    setTimeout(() => {
                      updateAudioVolume(index, trackVolumes[index] || 80);
                    }, 100);
                  }
                }}
                src={track.url}
                onLoadedMetadata={() => handleLoadedMetadata(index)}
                onError={(e) => {
                  console.error(`❌ Erro na faixa ${index + 1}:`, e.target.error?.message);
                  handleAudioError(index, e.target.error?.message || 'Erro desconhecido');
                }}
                onCanPlay={() => {}}
                onLoadStart={() => {}}
                preload="metadata"
              />
            </Box>
          );
        })}
      </Box>
      
      {/* Mobile Menu Compacto */}
      {isMobile && (
        <SwipeableDrawer
          anchor="bottom"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onOpen={() => setMobileMenuOpen(true)}
          disableSwipeToOpen={false}
          sx={{
            '& .MuiDrawer-paper': {
              bgcolor: '#1a1a1a',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '70vh'
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, textAlign: 'center' }}>
              Controles Avançados
            </Typography>
            
            <List>
              <ListItem button onClick={() => setShowWaveform(!showWaveform)}>
                <ListItemIcon>
                  <WaveformIcon sx={{ color: showWaveform ? '#4CAF50' : '#fff' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Visualização de Forma de Onda" 
                  sx={{ color: '#fff' }}
                />
              </ListItem>
              
              <Divider sx={{ bgcolor: '#333', my: 1 }} />
              
              <ListItem button onClick={() => setLoopEnabled(!loopEnabled)}>
                <ListItemIcon>
                  <LoopIcon sx={{ color: loopEnabled ? '#4CAF50' : '#fff' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Loop de Seção" 
                  sx={{ color: '#fff' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <ZoomInIcon sx={{ color: '#fff' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={`Zoom: ${Math.round(zoomLevel * 100)}%`}
                  sx={{ color: '#fff' }}
                />
                <Box sx={{ width: 100, ml: 2 }}>
                  <Slider
                    value={zoomLevel}
                    onChange={(e, value) => setZoomLevel(value)}
                    min={0.5}
                    max={3}
                    step={0.1}
                    size="small"
                    sx={{ color: '#4CAF50' }}
                  />
                </Box>
              </ListItem>
              
              <Divider sx={{ bgcolor: '#333', my: 1 }} />
              
              <ListItem button onClick={() => {
                setShowSettings(true);
                setMobileMenuOpen(false);
              }}>
                <ListItemIcon>
                  <SettingsIcon sx={{ color: '#fff' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Configurações" 
                  sx={{ color: '#fff' }}
                />
              </ListItem>
              
              <ListItem button onClick={() => {
                setShowKeyboardHelp(true);
                setMobileMenuOpen(false);
              }}>
                <ListItemIcon>
                  <KeyboardIcon sx={{ color: '#fff' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Atalhos de Teclado" 
                  sx={{ color: '#fff' }}
                />
              </ListItem>
            </List>
          </Box>
        </SwipeableDrawer>
      )}
      
      {/* FAB para Menu Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          onClick={() => setMobileMenuOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            bgcolor: '#4CAF50',
            '&:hover': {
              bgcolor: '#45a049'
            },
            zIndex: 1000
          }}
        >
          <MenuIcon />
        </Fab>
      )}

      {/* Configurações do Player */}
      <PlayerSettings 
        open={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={playerSettings}
        onSettingsChange={setPlayerSettings}
      />
    </Box>
  );
};

export default MultitrackPlayer;