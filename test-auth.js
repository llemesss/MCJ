const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('=== TESTE DE AUTENTICAÇÃO ===');
console.log('JWT_SECRET configurado:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

// Simular um token válido
const testPayload = {
  userId: 'test-user-id',
  email: 'test@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
};

try {
  // Gerar token
  const token = jwt.sign(testPayload, process.env.JWT_SECRET);
  console.log('Token gerado com sucesso:', token.substring(0, 50) + '...');
  
  // Verificar token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token verificado com sucesso:', decoded);
  
} catch (error) {
  console.error('Erro no teste de JWT:', error.message);
}

// Testar token inválido
try {
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token';
  const decoded = jwt.verify(invalidToken, process.env.JWT_SECRET);
  console.log('Token inválido foi aceito (ERRO!):', decoded);
} catch (error) {
  console.log('Token inválido rejeitado corretamente:', error.name);
}