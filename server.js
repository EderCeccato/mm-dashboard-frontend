require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Caminho para os arquivos estáticos
const PUBLIC_DIR = path.join(__dirname, 'app', 'public');
const PAGES_DIR = path.join(PUBLIC_DIR, 'pages');

// Middleware para cookies
app.use(cookieParser());

// Função para checar autenticação via JWT no cookie
function isAuthenticated(req) {
  const token = req.cookies.token;
  if (!token) return false;
  try {
    // Usa o segredo do .env
    jwt.verify(token, process.env.JWT_SECRET);
    return true;
  } catch (err) {
    return false;
  }
}

// Redireciona '/' para '/login'
app.get('/', (req, res) => {
  res.redirect('/login');
});

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
  if (!isAuthenticated(req)) {
    return res.redirect('/login');
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
  res.sendFile(filePath, err => {
    if (err) next();
  });
});

// Rota específica para login
app.get('/login', (req, res) => {
  const filePath = path.join(PAGES_DIR, 'login', 'index.html');
  res.sendFile(filePath);
});

// Servir arquivos estáticos (css, js, imagens, etc)
app.use(express.static(PUBLIC_DIR));

// 404 para rotas não encontradas
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
