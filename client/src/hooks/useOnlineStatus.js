import { useState, useEffect } from 'react';

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnectionQuality();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    const checkConnectionQuality = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline');
        return;
      }

      try {
        const startTime = Date.now();
        const response = await fetch('/api/ping', {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const endTime = Date.now();
        const latency = endTime - startTime;

        if (response.ok) {
          if (latency < 100) {
            setConnectionQuality('excellent');
          } else if (latency < 300) {
            setConnectionQuality('good');
          } else if (latency < 1000) {
            setConnectionQuality('fair');
          } else {
            setConnectionQuality('poor');
          }
        } else {
          setConnectionQuality('poor');
        }
      } catch (error) {
        setConnectionQuality('poor');
      }
    };

    // Verificar qualidade da conexão periodicamente
    const qualityInterval = setInterval(checkConnectionQuality, 30000); // 30 segundos

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificação inicial
    if (navigator.onLine) {
      checkConnectionQuality();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(qualityInterval);
    };
  }, []);

  const canUseMultitrack = () => {
    return isOnline && ['excellent', 'good', 'fair'].includes(connectionQuality);
  };

  const getRecommendedQuality = () => {
    if (!isOnline) return 'offline';
    
    switch (connectionQuality) {
      case 'excellent':
        return 'high'; // 320kbps
      case 'good':
        return 'medium'; // 128kbps
      case 'fair':
        return 'low'; // 64kbps
      default:
        return 'disabled';
    }
  };

  return {
    isOnline,
    connectionQuality,
    canUseMultitrack: canUseMultitrack(),
    recommendedQuality: getRecommendedQuality()
  };
};

export default useOnlineStatus;