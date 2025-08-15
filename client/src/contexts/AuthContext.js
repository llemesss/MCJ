import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  console.log('AuthReducer - Action:', action.type, 'Payload:', action.payload);
  switch (action.type) {
    case 'SET_LOADING':
      console.log('AuthReducer - SET_LOADING:', action.payload);
      return {
        ...state,
        loading: action.payload,
      };
    case 'LOGIN_SUCCESS':
      console.log('AuthReducer - LOGIN_SUCCESS, user:', action.payload.user);
      localStorage.setItem('token', action.payload.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
      const newState = {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
      console.log('AuthReducer - Novo estado após LOGIN_SUCCESS:', newState);
      return newState;
    case 'LOGOUT':
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set up api interceptor for token
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    }

    // Response interceptor to handle token expiration
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && state.token) {
          dispatch({ type: 'LOGOUT' });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [state.token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && !state.user) {
        try {
          console.log('Verificando token armazenado...');
          const response = await api.get('/supabase/me');
          console.log('Token válido, usuário autenticado:', response.data.user);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.user,
              token: token,
            },
          });
        } catch (error) {
          console.log('Token inválido ou expirado, fazendo logout:', error.message);
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        }
      } else if (!token) {
        console.log('Nenhum token encontrado, definindo loading como false');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Só executa na inicialização da aplicação
    if (state.loading) {
      checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez na inicialização

  const login = async (email, password) => {
    try {
      console.log('Iniciando login...');
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await api.post('/supabase/login', {
        email,
        password,
      });

      console.log('Resposta do login:', response.data);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data,
      });

      console.log('Login realizado com sucesso');
      console.log('Estado do usuário após login:', response.data.user);
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Iniciando registro...', userData);
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await api.post('/supabase/register', userData);

      console.log('Resposta do registro:', response.data);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: response.data,
      });

      console.log('Registro realizado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('Erro no registro:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar conta';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/supabase/profile', profileData);
      dispatch({ type: 'UPDATE_USER', payload: response.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar perfil';
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};