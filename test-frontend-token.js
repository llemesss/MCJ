// Script para testar se o token do frontend é válido
const jwt = require('jsonwebtoken');
require('dotenv').config();

console.log('=== TESTE DE TOKEN DO FRONTEND ===');

// Simular tokens que podem estar sendo enviados pelo frontend
const testTokens = [
  // Token vazio
  '',
  // Token null
  null,
  // Token undefined
  undefined,
  // Token com Bearer
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
  // Token sem Bearer
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
];

function testToken(token, description) {
  console.log(`\n--- Testando: ${description} ---`);
  console.log('Token:', token);
  
  try {
    // Simular o que o middleware faz
    const authHeader = token;
    const extractedToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('Token extraído:', extractedToken);
    
    if (!extractedToken) {
      console.log('❌ Erro: Token de acesso requerido');
      return;
    }
    
    // Tentar verificar o token
    const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET);
    console.log('✅ Token válido:', decoded);
    
  } catch (error) {
    console.log('❌ Erro na verificação:', error.name, '-', error.message);
  }
}

testTokens.forEach((token, index) => {
  testToken(token, `Token ${index + 1}`);
});

// Testar um token válido
console.log('\n--- Testando token válido ---');
const validPayload = {
  userId: 'valid-user-id',
  email: 'user@example.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60)
};

const validToken = jwt.sign(validPayload, process.env.JWT_SECRET);
const bearerToken = `Bearer ${validToken}`;
testToken(bearerToken, 'Token válido com Bearer');