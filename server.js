require('dotenv').config(); // Carrega variáveis de ambiente

// Suprime warnings de deprecação específicos (opcional)
process.noDeprecation = false; // Mantém outros warnings importantes
const originalEmitWarning = process.emitWarning;
process.emitWarning = function(warning, name, code) {
  // Suprime apenas o warning específico do util._extend
  if (code === 'DEP0060') {
    return;
  }
  return originalEmitWarning.call(this, warning, name, code);
};

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do backend baseada no ambiente
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const BACKEND_URL = ENVIRONMENT === 'development'
  ? process.env.BACKEND_URL_DEV || 'http://localhost:3301'
  : process.env.BACKEND_URL_PROD || process.env.BACKEND_URL || 'https://sua-api-producao.com';

console.log(`🚀 Ambiente: ${ENVIRONMENT}`);

// Caminho para os arquivos estáticos
const PUBLIC_DIR = path.join(__dirname, 'app', 'public');
const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');

// Middleware para cookies e JSON - configurações aprimoradas
app.use(cookieParser());
app.use(express.json({
  limit: '50mb',
  strict: false
}));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

// Configuração do proxy para as rotas da API - versão otimizada
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  secure: ENVIRONMENT === 'production',
  logLevel: ENVIRONMENT === 'development' ? 'info' : 'warn', // Mudança de 'debug' para 'info'

  // Configurações de timeout mais robustas
  timeout: 60000, // 60 segundos
  proxyTimeout: 60000,

  // Mantém os cookies e headers necessários
  onProxyReq: (proxyReq, req, res) => {
    // Garante que os cookies sejam enviados
    if (req.headers.cookie) {
      proxyReq.setHeader('Cookie', req.headers.cookie);
    }

    // Para requisições POST/PUT, reescreve o body se necessário
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }

    // Log apenas em desenvolvimento
    if (ENVIRONMENT === 'development') {
      // console.log(`🔄 Proxy: ${req.method} ${req.path} -> ${BACKEND_URL}${req.path}`);
    }
  },

  // Manipula resposta do backend
  onProxyRes: (proxyRes, req, res) => {
    if (ENVIRONMENT === 'development') {
      // console.log(`✅ Resposta: ${proxyRes.statusCode} para ${req.method} ${req.path}`);
    }
  },

  // Manipula erros de proxy
  onError: (err, req, res) => {
    console.error('❌ Erro no proxy:', err.message);
    console.error('🔍 Detalhes do erro:', {
      code: err.code,
      target: BACKEND_URL,
      path: req.path,
      method: req.method,
      headers: req.headers['content-type']
    });

    // Verifica se a resposta já foi enviada
    if (!res.headersSent) {
      let errorMessage = 'Erro de comunicação com o servidor';
      let errorCode = 'PROXY_ERROR';

      switch (err.code) {
        case 'ECONNREFUSED':
          errorMessage = 'Backend não está rodando ou não está acessível';
          errorCode = 'BACKEND_OFFLINE';
          break;
        case 'ECONNRESET':
        case 'ECONNABORTED':
          errorMessage = 'Conexão com o backend foi interrompida';
          errorCode = 'CONNECTION_INTERRUPTED';
          break;
        case 'ETIMEDOUT':
          errorMessage = 'Timeout na comunicação com o backend';
          errorCode = 'BACKEND_TIMEOUT';
          break;
      }

      res.status(503).json({
        success: false,
        code: errorCode,
        message: errorMessage,
        details: ENVIRONMENT === 'development' ? {
          target: BACKEND_URL,
          error: err.code,
          originalError: err.message
        } : undefined
      });
    }
  },

  // Headers customizados
  headers: {
    'X-Forwarded-Host': process.env.FRONTEND_HOST || 'localhost:3000',
    'X-Forwarded-Proto': 'http'
  },

  // Configurações adicionais para evitar problemas
  followRedirects: false,
  selfHandleResponse: false,
  ignorePath: false
}));

// Redireciona '/' para '/login'
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Servir arquivos estáticos (css, js, imagens, etc)
app.use(express.static(PUBLIC_DIR));

// Middleware para proteger rotas (exceto login, validação de acesso, acompanhamento e arquivos públicos)
app.use((req, res, next) => {
  // Permite acesso livre à tela de login, validação de acesso, acompanhamento e arquivos estáticos
  if (
    req.path === '/login' ||
    req.path.startsWith('/validacao-acesso') ||
    req.path.startsWith('/acompanhamento') ||
    req.path.startsWith('/assets') ||
    req.path.startsWith('/js') ||
    req.path.startsWith('/libs') ||
    req.path.startsWith('/images') ||
    req.path.startsWith('/icon-fonts') ||
    req.path.startsWith('/api') // API já é tratada pelo proxy
  ) {
    return next();
  }
  next();
});

// Roteamento dinâmico para qualquer subpasta (ex: /home, /home/teste, /modulo/abc/xyz)
app.get(/^\/(.+)/, (req, res, next) => {
  // Verifica se a resposta já foi enviada
  if (res.headersSent) {
    return;
  }

  // Remove query params e divide a rota em partes
  const route = req.path.replace(/\/$/, ''); // remove barra final
  const parts = route.split('/').filter(Boolean); // remove vazios
  let filePath = PAGES_DIR;
  for (const part of parts) {
    filePath = path.join(filePath, part);
  }
  filePath = path.join(filePath, 'index.html');

  res.sendFile(filePath, err => {
    if (err && !res.headersSent) {
      next(); // Passa para o middleware 404 apenas se headers não foram enviados
    }
  });
});

// Rota específica para login
app.get('/login', (req, res) => {
  if (res.headersSent) {
    return;
  }

  const filePath = path.join(PAGES_DIR, 'login', 'index.html');
  res.sendFile(filePath);
});

// Rota específica para validação de acesso
app.get('/validacao-acesso', (req, res) => {
  if (res.headersSent) {
    return;
  }

  const filePath = path.join(PAGES_DIR, 'validacao-acesso', 'index.html');
  res.sendFile(filePath);
});

// Rota específica para acompanhamento com hash
app.get('/acompanhamento/:hash', (req, res) => {
  if (res.headersSent) {
    return;
  }

  const filePath = path.join(PAGES_DIR, 'acompanhamento', 'index.html');
  res.sendFile(filePath);
});

// Rota específica para acompanhamento sem hash (redireciona para validação)
app.get('/acompanhamento', (req, res) => {
  if (res.headersSent) {
    return;
  }

  res.redirect('/validacao-acesso');
});

// 404 para rotas não encontradas
app.use((req, res) => {
  // Verifica se a resposta já foi enviada para evitar ERR_HTTP_HEADERS_SENT
  if (res.headersSent) {
    return;
  }

  const filePath = path.join(PAGES_DIR, 'erro-404', 'index.html');
  res.status(404).sendFile(filePath, (err) => {
    // Verifica novamente se os headers já foram enviados antes de responder
    if (res.headersSent) {
      return;
    }

    if (err) {
      // Fallback se a página 404 não existir
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Página não encontrada</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>404 - Página não encontrada</h1>
          <p>A página que você procura não existe.</p>
          <a href="/pages/home/">Voltar ao início</a>
        </body>
        </html>
      `);
    }
  });
});

// Middleware de tratamento global de erros
app.use((error, req, res, next) => {
  console.error('💥 Erro interno do servidor:', error);

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: ENVIRONMENT === 'development' ? error.message : 'Erro interno do servidor'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor frontend rodando em http://localhost:${PORT}`);
  // console.log(`🔄 Proxy configurado: /api/* -> ${BACKEND_URL}/api/*`);
  console.log('✅ Sistema pronto para uso!');
});
