import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Create socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Conectado ao servidor Socket.IO');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Desconectado do servidor Socket.IO');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Erro de conexão Socket.IO:', error);
        setConnected(false);
      });

      // Online users events
      newSocket.on('users_online', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('user_joined', (user) => {
        setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
      });

      newSocket.on('user_left', (userId) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== userId));
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
        setOnlineUsers([]);
      };
    } else {
      // If no user or token, disconnect socket
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
        setOnlineUsers([]);
      }
    }
  }, [user, token]);

  // Join ministry room
  const joinMinistry = (ministryId) => {
    if (socket && connected) {
      socket.emit('join-ministry', ministryId);
    }
  };

  // Leave ministry room
  const leaveMinistry = (ministryId) => {
    if (socket && connected) {
      socket.emit('leave-ministry', ministryId);
    }
  };

  // Send message
  const sendMessage = (messageData) => {
    if (socket && connected) {
      socket.emit('send-message', messageData);
    }
  };

  // Subscribe to new messages
  const onNewMessage = (callback) => {
    if (socket) {
      socket.on('new_message', callback);
      return () => socket.off('new_message', callback);
    }
  };

  // Subscribe to message updates (edit/delete)
  const onMessageUpdate = (callback) => {
    if (socket) {
      socket.on('message_updated', callback);
      return () => socket.off('message_updated', callback);
    }
  };

  // Subscribe to message reactions
  const onMessageReaction = (callback) => {
    if (socket) {
      socket.on('message_reaction', callback);
      return () => socket.off('message_reaction', callback);
    }
  };

  // Subscribe to typing events
  const onTyping = (callback) => {
    if (socket) {
      socket.on('user_typing', callback);
      return () => socket.off('user_typing', callback);
    }
  };

  const onStopTyping = (callback) => {
    if (socket) {
      socket.on('user_stop_typing', callback);
      return () => socket.off('user_stop_typing', callback);
    }
  };

  // Emit typing events
  const startTyping = (ministryId) => {
    if (socket && connected) {
      socket.emit('typing', ministryId);
    }
  };

  const stopTyping = (ministryId) => {
    if (socket && connected) {
      socket.emit('stop_typing', ministryId);
    }
  };

  // Subscribe to schedule updates
  const onScheduleUpdate = (callback) => {
    if (socket) {
      socket.on('schedule_updated', callback);
      return () => socket.off('schedule_updated', callback);
    }
  };

  // Subscribe to member updates
  const onMemberUpdate = (callback) => {
    if (socket) {
      socket.on('member_updated', callback);
      return () => socket.off('member_updated', callback);
    }
  };

  // Subscribe to notifications
  const onNotification = (callback) => {
    if (socket) {
      socket.on('notification', callback);
      return () => socket.off('notification', callback);
    }
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    joinMinistry,
    leaveMinistry,
    sendMessage,
    onNewMessage,
    onMessageUpdate,
    onMessageReaction,
    onTyping,
    onStopTyping,
    startTyping,
    stopTyping,
    onScheduleUpdate,
    onMemberUpdate,
    onNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider');
  }
  return context;
};