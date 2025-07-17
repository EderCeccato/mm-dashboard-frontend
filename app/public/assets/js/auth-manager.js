/**
 * Auth Manager - Sistema de Autenticação e Controle de Módulos
 * Inclua este script em todas as páginas do sistema para:
 * 1. Verificar autenticação
 * 2. Verificar acesso ao módulo atual
 * 3. Redirecionar para login se necessário
 */

const AuthManager = (function() {
   'use strict';

   // Chaves usadas no localStorage
   const KEYS = {
      USER_DATA: 'userData',     // Dados do usuário
      MODULES: 'userModules',    // Lista de módulos permitidos
      TOKEN_DATA: 'tokenData',   // Dados do token (data de login, expiração)
      LAST_USER_EMAIL: 'lastUserEmail', // Email do último usuário
      LAST_USER_NAME: 'lastUserName'    // Nome do último usuário
   };

   /**
    * Salva os dados de autenticação após login bem-sucedido
    * @param {Object} data Resposta do servidor após login
    */
   function saveAuthData(data) {
      if (!data) return false;

      try {
         // Estrutura esperada: { user: {...}, modules: [...] } ou { data: { user: {...} } }
         let userData = null;
         let userModules = [];

         // Verifica se os dados estão na estrutura antiga ou nova
         if (data.data && data.data.user) {
            // Nova estrutura: { data: { user: {...} } }
            userData = data.data.user;

            // Extrai os módulos da nova estrutura
            if (userData.modules && Array.isArray(userData.modules)) {
               userModules = userData.modules.map(m => m.name);
            }
         } else if (data.user) {
            // Estrutura antiga: { user: {...}, modules: [...] }
            userData = data.user;

            // Usa os módulos da estrutura antiga
            if (data.modules && Array.isArray(data.modules)) {
               userModules = data.modules;
            }
         }

         // Salva dados do usuário
         if (userData) {
            localStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
         } else {
            console.error('❌ Estrutura de dados de usuário inválida');
            return false;
         }

         // Salva lista de módulos
         localStorage.setItem(KEYS.MODULES, JSON.stringify(userModules));

         // Salva informações do token (data de login, expiração)
         localStorage.setItem(KEYS.TOKEN_DATA, JSON.stringify({
            loginTime: Date.now(),
            // 24 horas de expiração por padrão
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
         }));

         return true;
      } catch (error) {
         console.error('❌ Erro ao salvar dados de autenticação:', error);
         return false;
      }
   }

   /**
    * Verifica com o servidor se o token ainda é válido
    * @returns {Promise<boolean>} Verdadeiro se o token for válido
    */
   async function verifySessionWithServer() {
      try {
         // Usa a função Thefetch global para verificar a sessão
         if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            return false;
         }

         const response = await Thefetch('/api/auth/session', 'GET');

         // Se a resposta for bem-sucedida, a sessão é válida
         if (response && response.success === true) {
            // Atualiza os dados do usuário se disponíveis na resposta
            if (response.data && response.data.user) {
               saveAuthData(response);
            }

            return true;
         }

         // Se recebemos código SESSION_INVALID, a sessão expirou
         if (response && response.code === 'SESSION_INVALID') {
            console.log('❌ Sessão expirada no servidor');
            return false;
         }

         console.log('❌ Erro na verificação da sessão:', response?.message || 'Resposta inválida');
         return false;
      } catch (error) {
         console.error('❌ Erro ao verificar sessão com o servidor:', error);
         return false;
      }
   }

   /**
    * Verifica se o usuário está autenticado (token válido)
    * @returns {Promise<boolean>} Verdadeiro se autenticado
    */
   async function isAuthenticated() {
      try {
         // 1. Verifica se existem dados do usuário no localStorage
         const userData = localStorage.getItem(KEYS.USER_DATA);
         if (!userData) {
            console.log('❌ Dados do usuário não encontrados no localStorage');
            return false;
         }

         // 2. Verifica se o token expirou localmente
         const tokenData = JSON.parse(localStorage.getItem(KEYS.TOKEN_DATA) || '{}');
         if (!tokenData.expiresAt) {
            console.log('❌ Dados do token não encontrados no localStorage');
            return false;
         }

         // 3. Verifica expiração local
         if (Date.now() > tokenData.expiresAt) {
            console.log('❌ Token expirado localmente');
            return false;
         }

         // 4. Verifica com o servidor se a sessão ainda é válida
         const isValid = await verifySessionWithServer();
         if (!isValid) {
            console.log('❌ Sessão invalidada pelo servidor');
            // Limpa dados locais já que o token é inválido
            logout(false); // Não redireciona automaticamente
            return false;
         }

         return true;
      } catch (error) {
         console.error('❌ Erro ao verificar autenticação:', error);
         return false;
      }
   }

   /**
    * Retorna dados do usuário logado
    * @returns {Object|null} Dados do usuário ou null
    */
   function getUserData() {
      try {
         const userData = localStorage.getItem(KEYS.USER_DATA);
         return userData ? JSON.parse(userData) : null;
      } catch (error) {
         console.error('❌ Erro ao recuperar dados do usuário:', error);
         return null;
      }
   }

   /**
    * Retorna lista de módulos que o usuário tem acesso
    * @returns {Array} Lista de módulos
    */
   function getUserModules() {
      try {
         const modules = localStorage.getItem(KEYS.MODULES);
         return modules ? JSON.parse(modules) : [];
      } catch (error) {
         console.error('❌ Erro ao recuperar módulos do usuário:', error);
         return [];
      }
   }

   /**
    * Faz logout do usuário
    * @param {boolean} redirect - Se deve redirecionar para a página de login
    */
   function logout(redirect = true) {
      // Salva o email e nome do último usuário antes de limpar
      const userData = getUserData();
      if (userData) {
         localStorage.setItem(KEYS.LAST_USER_EMAIL, userData.email || '');
         localStorage.setItem(KEYS.LAST_USER_NAME, userData.name || '');
      }

      // Limpa dados do localStorage
      localStorage.removeItem(KEYS.USER_DATA);
      localStorage.removeItem(KEYS.MODULES);
      localStorage.removeItem(KEYS.TOKEN_DATA);

      // Limpa outros dados que possam existir
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('loginTime');

      // Limpa cookie do backend
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      // Redireciona para login se solicitado
      if (redirect) {
         window.location.href = '/login';
      }
   }

   /**
    * Verifica se pode acessar a página atual baseado no módulo
    * Se não estiver autenticado ou não tiver permissão, redireciona
    * @returns {Promise<boolean>} Verdadeiro se tem acesso
    */
   async function checkAccess() {
      // Se estiver na página de login, não verifica
      if (window.location.pathname === '/login' ||
         window.location.pathname.includes('/login/')) {
         return true;
      }

      // 1. Verifica autenticação com o servidor
      const authenticated = await isAuthenticated();
      if (!authenticated) {
         redirectToLogin();
         return false;
      }

      return true;
   }

   /**
    * Redireciona para a página de login
    */
   function redirectToLogin() {
      window.location.href = '/login';
   }

   /**
    * Cria elementos HTML para mostrar informações do usuário
    * (exemplo: nome do usuário no cabeçalho, etc)
    */
   function renderUserInfo() {
      const userData = getUserData();
      const lastEmail = localStorage.getItem(KEYS.LAST_USER_EMAIL);
      const lastName = localStorage.getItem(KEYS.LAST_USER_NAME);

      // Preenche com dados do usuário logado ou último usuário
      if (userData || lastEmail || lastName) {
         // Procura elementos com data-auth-user-* para preencher com dados
         document.querySelectorAll('[data-auth-user]').forEach(element => {
            const field = element.getAttribute('data-auth-user');
            if (userData && userData[field]) {
               element.textContent = userData[field];
            }
         });

         // Preenche o campo de email se existir
         const emailInput = document.getElementById('signin-email');
         if (emailInput) {
            emailInput.value = userData ? userData.email : lastEmail || '';
         }

         // Preenche a mensagem de boas-vindas se existir
         const loginMessage = document.getElementById('login-message');
         if (loginMessage) {
            const name = userData ? userData.name : lastName;
            if (name) {
               loginMessage.textContent = 'Bem-vindo de volta, ' + name + '!';
            }
         }
      }
   }

   /**
    * Renderiza o menu de acordo com as permissões do usuário
    */
   function renderModuleMenu() {
      const modules = getUserModules();
      const menuContainer = document.getElementById('moduleMenu');

      // Se não tiver o container de menu ou módulos, não faz nada
      if (!menuContainer || !modules || !modules.length) return;

      // Mapa de módulos e suas informações
      const moduleMap = {
         'home': { icon: '🏠', label: 'Início', url: '/pages/home/' },
         'users': { icon: '👥', label: 'Usuários', url: '/pages/users/' },
         'products': { icon: '📦', label: 'Produtos', url: '/pages/products/' },
         'reports': { icon: '📊', label: 'Relatórios', url: '/pages/reports/' },
         'settings': { icon: '⚙️', label: 'Configurações', url: '/pages/settings/' }
         // Adicione mais módulos conforme necessário
      };

      // Limpa o container
      menuContainer.innerHTML = '';

      // Admin tem acesso a tudo
      const isAdmin = modules.includes('admin') || modules.includes('*');

      // Cria itens de menu para cada módulo permitido
      Object.keys(moduleMap).forEach(moduleId => {
         // Se não tem permissão para este módulo, pula
         if (!isAdmin && !modules.includes(moduleId)) return;

         const module = moduleMap[moduleId];

         // Cria elemento de menu
         const menuItem = document.createElement('a');
         menuItem.href = module.url;
         menuItem.className = 'module-menu-item';
         menuItem.innerHTML = `
            <span class="module-icon">${module.icon}</span>
            <span class="module-label">${module.label}</span>
         `;

         // Adiciona ao menu
         menuContainer.appendChild(menuItem);
      });
   }

   // Inicializa verificações quando o script é carregado
   if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', async function() {
         // Verifica acesso (sem especificar módulo)
         await checkAccess();
         // Renderiza informações do usuário
         renderUserInfo();
         // Renderiza menu de módulos
         renderModuleMenu();
      });
   } else {
      // Se o DOM já carregou
      (async function() {
         await checkAccess();
         renderUserInfo();
         renderModuleMenu();
      })();
   }

   // Expõe API pública
   return {
      saveAuthData: saveAuthData,
      isAuthenticated: isAuthenticated,
      getUserData: getUserData,
      getUserModules: getUserModules,
      checkAccess: checkAccess,
      logout: logout,
      renderUserInfo: renderUserInfo,
      renderModuleMenu: renderModuleMenu
   };

})();
