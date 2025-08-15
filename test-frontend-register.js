// Teste para simular o registro do frontend
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsedBody });
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

async function testRegister() {
  try {
    console.log('Testando registro como o frontend faria...');
    
    const userData = {
      name: 'Usuario Frontend Test',
      email: 'frontend@test.com',
      password: '123456',
      phone: '(11) 99999-9999',
      instruments: ['vocal', 'teclado']
    };
    
    console.log('Dados enviados:', userData);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/supabase/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, userData);
    
    console.log('Resposta recebida:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
    return { success: response.status === 201, data: response.data };
  } catch (error) {
    console.error('Erro no teste:', error.message);
    return { success: false, error: error.message };
  }
}

// Executar o teste
testRegister().then(result => {
  console.log('\nResultado final:', result);
  process.exit(result.success ? 0 : 1);
});