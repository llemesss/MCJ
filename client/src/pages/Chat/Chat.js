import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  Skeleton,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';

const Chat = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new-message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      return () => {
        socket.off('new-message');
      };
    }
  }, [socket]);

  const fetchMessages = async () => {
    try {
      if (!user?.ministries?.[0]?.ministry?._id) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const ministryId = user.ministries[0].ministry._id;
      
      const response = await axios.get(`/api/chat/ministry/${ministryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(response.data || []);
    } catch (err) {
      setError('Erro ao carregar mensagens');
      console.error('Erro ao buscar mensagens:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user?.ministries?.[0]?.ministry?._id) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const ministryId = user.ministries[0].ministry._id;
      
      const messageData = {
        content: newMessage.trim(),
        ministry: ministryId
      };

      await axios.post('/api/chat/send', messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Emitir via socket para atualização em tempo real
      if (socket) {
        socket.emit('send-message', {
          ...messageData,
          sender: {
            _id: user._id,
            name: user.name
          },
          timestamp: new Date()
        });
      }

      setNewMessage('');
    } catch (err) {
      setError('Erro ao enviar mensagem');
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={100} height={40} />
        </Box>
        <Paper sx={{ height: '70vh', p: 2 }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </Box>
            </Box>
          ))}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">
          Chat
        </Typography>
        {user?.ministries?.[0]?.ministry?.name && (
          <Chip 
            label={user.ministries[0].ministry.name} 
            color="primary" 
            variant="outlined" 
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
        {/* Área de mensagens */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
          {messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              textAlign: 'center'
            }}>
              <Typography variant="h6" color="text.secondary">
                Nenhuma mensagem ainda
                <br />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Seja o primeiro a enviar uma mensagem!
                </Typography>
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {messages.map((message, index) => {
                const isOwnMessage = message.sender?._id === user?._id;
                const showDivider = index > 0 && 
                  new Date(messages[index - 1].timestamp).toDateString() !== 
                  new Date(message.timestamp).toDateString();
                
                return (
                  <React.Fragment key={message._id || index}>
                    {showDivider && (
                      <Divider sx={{ my: 2 }}>
                        <Chip 
                          label={new Date(message.timestamp).toLocaleDateString('pt-BR')} 
                          size="small" 
                        />
                      </Divider>
                    )}
                    <ListItem 
                      sx={{ 
                        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                        py: 1
                      }}
                    >
                      <ListItemAvatar sx={{ 
                        minWidth: isOwnMessage ? 'auto' : 56,
                        ml: isOwnMessage ? 1 : 0,
                        mr: isOwnMessage ? 0 : 1
                      }}>
                        <Avatar sx={{ 
                          bgcolor: isOwnMessage ? 'primary.main' : 'secondary.main',
                          width: 32,
                          height: 32,
                          fontSize: '0.875rem'
                        }}>
                          {message.sender?.name ? getInitials(message.sender.name) : <PersonIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        sx={{ 
                          textAlign: isOwnMessage ? 'right' : 'left',
                          m: 0
                        }}
                        primary={
                          <Box sx={{ 
                            display: 'inline-block',
                            bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                            color: isOwnMessage ? 'white' : 'text.primary',
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                            maxWidth: '70%',
                            wordBreak: 'break-word'
                          }}>
                            {message.content}
                          </Box>
                        }
                        secondary={
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              display: 'block',
                              mt: 0.5,
                              fontSize: '0.75rem'
                            }}
                          >
                            {!isOwnMessage && message.sender?.name && `${message.sender.name} • `}
                            {formatTime(message.timestamp)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>

        {/* Área de input */}
        <Divider />
        <Box sx={{ p: 2 }}>
          <form onSubmit={handleSendMessage}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                variant="outlined"
                size="small"
                multiline
                maxRows={3}
                disabled={!user?.ministries?.[0]?.ministry?._id}
              />
              <IconButton 
                type="submit" 
                color="primary"
                disabled={!newMessage.trim() || !user?.ministries?.[0]?.ministry?._id}
                sx={{ alignSelf: 'flex-end' }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </form>
        </Box>
      </Paper>
    </Container>
  );
};

export default Chat;