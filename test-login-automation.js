const puppeteer = require('puppeteer');

(async () => {
  console.log('Iniciando teste automatizado de login...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capturar logs do console
  page.on('console', msg => {
    console.log('CONSOLE:', msg.text());
  });
  
  // Capturar erros
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  try {
    console.log('Navegando para a página de login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    
    console.log('Aguardando formulário de login...');
    await page.waitForSelector('#email', { timeout: 10000 });
    
    console.log('Preenchendo formulário...');
    await page.type('#email', 'teste.login@gmail.com');
    await page.type('#password', 'senha123');
    
    console.log('Clicando no botão de login...');
    await page.click('button[type="submit"]');
    
    console.log('Aguardando redirecionamento ou mudança de página...');
    
    // Aguardar por 5 segundos para ver o que acontece
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('URL atual após login:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login bem-sucedido! Redirecionado para o dashboard.');
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Login falhou ou não redirecionou. Ainda na página de login.');
    } else {
      console.log('🤔 Redirecionado para uma página inesperada:', currentUrl);
    }
    
    // Verificar se há token no localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('Token no localStorage:', token ? 'Presente' : 'Ausente');
    
    // Aguardar mais um pouco para capturar logs adicionais
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Erro durante o teste:', error.message);
  } finally {
    console.log('Fechando navegador...');
    await browser.close();
  }
})();