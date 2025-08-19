const jwt = require('jsonwebtoken');
const supabaseService = require('../services/supabaseService');

// Middleware para verificar autenticação JWT
const authenticateToken = async (req, res, next) => {
  try {
    console.log('=== MIDDLEWARE DE AUTENTICAÇÃO ===');
    console.log('Headers recebidos:', req.headers.authorization ? 'Authorization header presente' : 'Authorization header ausente');
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Token extraído:', token ? `${token.substring(0, 20)}...` : 'Token vazio');
    console.log('JWT_SECRET configurado:', !!process.env.JWT_SECRET);

    if (!token) {
      console.log('❌ Erro: Token não fornecido');
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar e decodificar o token JWT
    console.log('Tentando verificar token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verificado com sucesso:', { userId: decoded.userId, email: decoded.email });
    
    // Buscar dados atualizados do usuário no Supabase
    const { user, error } = await supabaseService.getUserById(decoded.userId);
    
    if (error || !user) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado ou inativo',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Usuário inativo',
        code: 'USER_INACTIVE'
      });
    }

    // Adicionar dados do usuário ao request
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ Erro na verificação do token:', error.name, '-', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      console.log('Token inválido detectado');
      return res.status(403).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      console.log('Token expirado detectado');
      return res.status(403).json({ 
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN'
      });
    }

    console.error('Erro na autenticação:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar se o usuário tem permissão de administrador
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado. Permissão de administrador requerida.',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

// Middleware para verificar se o usuário é líder de ministério
const requireLeader = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (!['admin', 'leader'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Acesso negado. Permissão de líder requerida.',
      code: 'LEADER_REQUIRED'
    });
  }

  next();
};

// Middleware para verificar se o usuário pertence ao ministério
const requireMinistryMember = (ministryIdParam = 'ministryId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const ministryId = req.params[ministryIdParam] || req.body.ministry_id;
    
    // Admin tem acesso a todos os ministérios
    if (req.user.role === 'admin') {
      return next();
    }

    // Verificar se o usuário pertence ao ministério
    if (req.user.ministry_id !== parseInt(ministryId)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você não pertence a este ministério.',
        code: 'MINISTRY_ACCESS_DENIED'
      });
    }

    next();
  };
};

// Middleware para verificar se o usuário pode acessar/modificar um recurso próprio
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const targetUserId = req.params[userIdParam] || req.body.user_id;
    
    // Admin tem acesso a todos os recursos
    if (req.user.role === 'admin') {
      return next();
    }

    // Verificar se é o próprio usuário
    if (req.user.id !== parseInt(targetUserId)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você só pode acessar seus próprios recursos.',
        code: 'OWNERSHIP_REQUIRED'
      });
    }

    next();
  };
};

// Middleware opcional para autenticação (não bloqueia se não houver token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { user, error } = await supabaseService.getUserById(decoded.userId);
    
    if (!error && user && user.is_active) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireLeader,
  requireMinistryMember,
  requireOwnershipOrAdmin,
  optionalAuth
};