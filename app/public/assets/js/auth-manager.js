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
      TOKEN_DATA: 'tokenData',   // Dados do token (data de login, expiração)
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

         // Verifica se os dados estão na estrutura antiga ou nova
         if (data.data && data.data.user) {
            // Nova estrutura: { data: { user: {...} } }
            userData = data.data.user;

         } else if (data.user) {
            // Estrutura antiga: { user: {...}, modules: [...] }
            userData = data.user;
         }

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
    * Verifica e atualiza os módulos do usuário
    * @returns {Promise<boolean>} Verdadeiro se a verificação foi bem-sucedida
    */
   async function verifyAndUpdateUserModules() {
      try {
         // Usa a função Thefetch global para verificar os módulos
         if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            return false;
         }

         const response = await Thefetch('/api/modules/user-modules', 'GET');

         // Se a resposta for bem-sucedida, atualiza os módulos
         if (response && response.success === true && response.data && response.data.modules) {
            const currentUserData = getUserData();
            if (currentUserData) {
               // Atualiza apenas os módulos mantendo outros dados do usuário
               currentUserData.modules = response.data.modules;
               localStorage.setItem(KEYS.USER_DATA, JSON.stringify(currentUserData));

               // Atualiza o menu lateral automaticamente
               if (typeof ModuleManager !== 'undefined' && ModuleManager.refreshMenu) {
                  ModuleManager.refreshMenu();
               }

               return true;
            }
         }

         // Se recebemos código de erro, trata adequadamente
         if (response && response.code === 'SESSION_INVALID') {
            console.log('❌ Sessão expirada ao verificar módulos');
            return false;
         }

         return true; // Não considera erro crítico
      } catch (error) {
         console.error('❌ Erro ao verificar módulos do usuário:', error);
         return true; // Não considera erro crítico para não bloquear o sistema
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
            // Verifica e atualiza os módulos do usuário
            const modulesUpdated = await verifyAndUpdateUserModules();
            if (!modulesUpdated) {
               // Se falhou ao verificar módulos por sessão inválida, retorna false
               return false;
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
         const userDataString = localStorage.getItem(KEYS.USER_DATA);
         if (!userDataString) {
            console.log('❌ Dados do usuário não encontrados no localStorage');
            return false;
         }

         // Verifica se o userData tem campos obrigatórios de um usuário autenticado
         const userData = JSON.parse(userDataString);
         if (!userData.uuid || userData.hasOwnProperty('companyUuid') === false) {
            console.log('❌ Dados do usuário incompletos (não autenticado)');
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
            await logout(false); // Não redireciona automaticamente
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
         // Primeiro tenta pegar do userData
         const userData = getUserData();
         if (userData && userData.modules && Array.isArray(userData.modules)) {
            return userData.modules.map(m => m.name || m);
         }

         // Fallback para o método antigo
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
   async function logout(redirect = true) {
      // Preserva apenas dados básicos do usuário para melhor UX no próximo login
      const userData = getUserData();
      if (userData) {
         const preservedData = {
            name: userData.name || '',
            email: userData.email || '',
            picture: userData.picture || ''
         };
         localStorage.setItem(KEYS.USER_DATA, JSON.stringify(preservedData));
      }

      // Limpa outros dados do localStorage
      localStorage.removeItem(KEYS.MODULES);
      localStorage.removeItem(KEYS.TOKEN_DATA);

      // Limpa outros dados que possam existir
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('lastUserEmail');
      localStorage.removeItem('lastUserName');

      // Limpa cookie do backend
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      await Thefetch('/api/auth/logout', 'POST');

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

      if (userData) {
         const isAuthenticatedUser = userData.uuid && userData.hasOwnProperty('companyUuid');

         // Para usuários autenticados: preenche elementos com data-auth-user
         if (isAuthenticatedUser) {
            document.querySelectorAll('[data-auth-user]').forEach(element => {
               const field = element.getAttribute('data-auth-user');
               if (userData[field]) {
                  element.textContent = userData[field];
               }
            });

            // Preenche o nome do usuário se existir (para páginas internas)
            const userNameElement = document.getElementById('user-name');
            if (userNameElement && userData.name) {
               userNameElement.textContent = userData.name;
            }

            // Preenche a foto do usuário se existir (para páginas internas)
            const userPictureElement = document.getElementById('user-picture');
            if (userPictureElement && userData.picture) {
               userPictureElement.src = userData.picture;
            }
         }

         // Para todos os usuários (autenticados ou com dados preservados): preenche dados da tela de login
         const emailInput = document.getElementById('signin-email');
         if (emailInput && userData.email) {
            emailInput.value = userData.email;
         }

         const loginMessage = document.getElementById('login-message');
         if (loginMessage && userData.name) {
            loginMessage.textContent = 'Bem-vindo de volta, ' + userData.name + '!';
         }
      }
   }

   /**
    * Renderiza o menu de acordo com as permissões do usuário
    * Agora usa o ModuleManager para gerenciar os módulos
    */
   function renderModuleMenu() {
      // Verifica se o ModuleManager está disponível
      if (typeof ModuleManager !== 'undefined' && ModuleManager.renderSidebarMenu) {
         ModuleManager.renderSidebarMenu();
      } else {
         console.warn('⚠️ ModuleManager não encontrado. Certifique-se de incluir module-manager.js');
      }
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

   /**
    * Força a verificação e atualização dos módulos do usuário
    * Útil para atualizar módulos sem recarregar a página
    * @returns {Promise<boolean>} Verdadeiro se a atualização foi bem-sucedida
    */
   async function refreshUserModules() {
      const userData = getUserData();
      if (!userData || !userData.uuid) {
         console.log('❌ Usuário não autenticado para atualizar módulos');
         return false;
      }

      return await verifyAndUpdateUserModules();
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
      renderModuleMenu: renderModuleMenu,
      refreshUserModules: refreshUserModules,
   };

})();
