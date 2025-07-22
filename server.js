const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Caminho para os arquivos estáticos
const PUBLIC_DIR = path.join(__dirname, 'app', 'public');
const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');

// Middleware para cookies e JSON
app.use(cookieParser());
app.use(express.json());

// Redireciona '/' para '/login'
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Servir arquivos estáticos (css, js, imagens, etc)
app.use(express.static(PUBLIC_DIR));

// Middleware para proteger rotas (exceto login e arquivos públicos)
app.use((req, res, next) => {
  // Permite acesso livre à tela de login e arquivos estáticos
  if (
    req.path === '/login' ||
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
  // Remove query params e divide a rota em partes
  const route = req.path.replace(/\/$/, ''); // remove barra final
  const parts = route.split('/').filter(Boolean); // remove vazios
  let filePath = PAGES_DIR;
  for (const part of parts) {
    filePath = path.join(filePath, part);
  }
  filePath = path.join(filePath, 'index.html');

  // Log da tentativa de acesso para debug
  console.log(`Tentando acessar: ${req.path} -> ${filePath}`);

  res.sendFile(filePath, err => {
    if (err) {
      console.log(`Arquivo não encontrado: ${filePath}`);
      next(); // Passa para o middleware 404
    }
  });
});

// Rota específica para login
app.get('/login', (req, res) => {
  const filePath = path.join(PAGES_DIR, 'login', 'index.html');
  res.sendFile(filePath);
});

// 404 para rotas não encontradas
app.use((req, res) => {
  const filePath = path.join(PAGES_DIR, 'erro-404', 'index.html');
  res.status(404).sendFile(filePath, (err) => {
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
