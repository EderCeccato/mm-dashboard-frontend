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

const app = express();
const PORT = process.env.PORT || 3000;

// Caminho para os arquivos estáticos
const PUBLIC_DIR = path.join(__dirname, 'app', 'public');
const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');

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
    req.path.startsWith('/icon-fonts')
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
  console.log('✅ Sistema pronto para uso!');
});
