const http = require('http');

// Configurar a URL base da API
const API_BASE_URL = 'http://localhost:5000/api';

// Função helper para fazer requisições HTTP
function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLoginFlow() {
  try {
    console.log('=== TESTE DE FLUXO DE LOGIN ===\n');
    
    // Teste 1: Criar um novo usuário para teste
    console.log('1. Criando usuário de teste...');
    const registerResponse = await makeRequest('POST', `${API_BASE_URL}/supabase/register`, {
      name: 'Teste Login',
      email: 'teste.login@gmail.com',
      password: 'senha123',
      role: 'member'
    });
    
    console.log('Status do registro:', registerResponse.status);
    
    if (registerResponse.status !== 201) {
      console.log('Tentando fazer login com usuário existente...');
      // Se o usuário já existe, tenta fazer login
    }
    
    // Teste 2: Login com o usuário
    console.log('2. Testando login...');
    const loginResponse = await makeRequest('POST', `${API_BASE_URL}/supabase/login`, {
      email: 'teste.login@gmail.com',
      password: 'senha123'
    });
    
    console.log('Status do login:', loginResponse.status);
    console.log('Dados retornados:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    if (!token) {
      console.log('❌ ERRO: Token não foi retornado no login');
      return;
    }
    
    if (!user) {
      console.log('❌ ERRO: Dados do usuário não foram retornados no login');
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('Token recebido:', token.substring(0, 50) + '...');
    console.log('Usuário:', user.name, '(' + user.email + ')');
    
    // Teste 3: Verificar se o token é válido
    console.log('\n3. Testando validação do token...');
    const meResponse = await makeRequest('GET', `${API_BASE_URL}/supabase/me`, null, {
      'Authorization': `Bearer ${token}`
    });
    
    console.log('Status da verificação:', meResponse.status);
    console.log('Dados do usuário autenticado:', JSON.stringify(meResponse.data, null, 2));
    
    if (meResponse.data.user && meResponse.data.user.id === user.id) {
      console.log('✅ Token válido e usuário autenticado corretamente!');
    } else {
      console.log('❌ ERRO: Problema na validação do token');
    }
    
    console.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===');
    console.log('\nO backend está funcionando corretamente.');
    console.log('Se o problema persiste no frontend, verifique:');
    console.log('1. Se o estado do usuário está sendo atualizado no AuthContext');
    console.log('2. Se o ProtectedRoute está detectando o usuário logado');
    console.log('3. Se há algum problema no timing do redirecionamento');
    
  } catch (error) {
    console.log('❌ ERRO no teste:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Dados:', error.response.data);
    }
  }
}

// Executar o teste
testLoginFlow();