// Configuração da URL base do backend
const BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3301'  // Desenvolvimento
  : 'https://fy5gyeix2g.execute-api.sa-east-1.amazonaws.com/dev'; // Produção

/**
 * Sistema de Coleta de Erros para Debug
 * Acumula todos os erros que ocorrem durante o carregamento de uma página
 */
window.ErrorCollector = (function() {
   'use strict';

   const ERROR_STORAGE_KEY = 'collectedErrors';

   /**
    * Adiciona um erro à coleção
    */
   function addError(errorDetails) {
      try {
         const existingErrors = JSON.parse(sessionStorage.getItem(ERROR_STORAGE_KEY) || '[]');
         existingErrors.push(errorDetails);
         sessionStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(existingErrors));
      } catch (e) {
         console.warn('Erro ao salvar erro coletado:', e);
      }
   }

   /**
    * Obtém todos os erros coletados
    */
   function getCollectedErrors() {
      try {
         return JSON.parse(sessionStorage.getItem(ERROR_STORAGE_KEY) || '[]');
      } catch (e) {
         console.warn('Erro ao ler erros coletados:', e);
         return [];
      }
   }

   /**
    * Limpa todos os erros coletados
    */
   function clearCollectedErrors() {
      sessionStorage.removeItem(ERROR_STORAGE_KEY);
   }

   /**
    * Exibe relatório completo de erros no console
    */
   function displayErrorReport() {
      const errors = getCollectedErrors();

      if (errors.length === 0) {
         console.log('✅ Nenhum erro coletado nesta sessão');
         return;
      }

      console.group(`🚨 RELATÓRIO DE ERROS DA SESSÃO (${errors.length} erro${errors.length > 1 ? 's' : ''})`);
      console.log(`🕒 Período: ${new Date(errors[0].timestamp).toLocaleString()} - ${new Date(errors[errors.length - 1].timestamp).toLocaleString()}`);
      console.log('🔍 Detalhes de todos os erros encontrados:');
      console.log('═'.repeat(80));

      errors.forEach((error, index) => {
         console.group(`❌ Erro ${index + 1}/${errors.length}: ${error.code || 'UNKNOWN_ERROR'}`);
         console.error('📍 Rota:', error.route);
         console.error('🔧 Método:', error.method);
         console.error('📊 Status:', error.statusCode);
         console.error('💬 Mensagem:', error.message);
         console.error('🌐 URL completa:', error.url);
         console.error('🕒 Timestamp:', new Date(error.timestamp).toLocaleString());
         if (error.body) console.error('📦 Body enviado:', error.body);
         if (error.context) console.error('🎯 Contexto:', error.context);
         console.groupEnd();
      });

      console.log('═'.repeat(80));
      console.groupEnd();

      // Limpa os erros após exibir
      clearCollectedErrors();
   }

   return {
      addError: addError,
      getCollectedErrors: getCollectedErrors,
      clearCollectedErrors: clearCollectedErrors,
      displayErrorReport: displayErrorReport
   };
})();

// 🔑 Função para recuperar o token de acesso
function getAccessToken() {
   try {
      // Primeiro tenta obter do cookie (método mais seguro)
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
         const [name, value] = cookie.trim().split('=');
         if (name === 'accessToken') {
            return value;
         }
      }

      // Se não encontrar no cookie, verifica no localStorage
      const tokenData = localStorage.getItem('tokenData');
      if (tokenData) {
         const parsedTokenData = JSON.parse(tokenData);
         if (parsedTokenData.accessToken) {
            return parsedTokenData.accessToken;
         }
      }
      
      return null;
   } catch (error) {
      console.warn('❌ Erro ao recuperar token de acesso:', error);
      return null;
   }
}

// 🚀 Função utilitária para requisições - USA URL DIRETA DO BACKEND
async function Thefetch(path, method = 'GET', body = null) {
   // Constrói a URL completa combinando BASE_URL com o path
   const url = `${BASE_URL}${path}`;

   const options = {
      method,
      headers: { 
         'Content-Type': 'application/json',
         'Accept': 'application/json',
         'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include' // Necessário para JWT cookies
   };

   // Adiciona o token de acesso ao header Authorization se disponível
   const accessToken = getAccessToken();
   if (accessToken) {
      options.headers['Authorization'] = `Bearer ${accessToken}`;
   }

   // Log da requisição para debug (apenas em desenvolvimento)
   if (window.location.hostname === 'localhost') {
      console.log(`📡 ${method} ${path}`, {
         url,
         headers: options.headers,
         body,
         hasToken: !!accessToken
      });
   }

   if (body) {
      options.body = JSON.stringify(body);
   }

   try {
      const response = await fetch(url, options);

      // Tenta extrair JSON (pode falhar se for HTML puro)
      const payload = await response.json().catch(() => ({}));

      if (payload.success === false) {
         // Cria informações detalhadas do erro para debug
         const errorDetails = {
            code: payload.code,
            message: payload.message,
            route: path,
            method: method,
            statusCode: response.status,
            timestamp: new Date().toISOString(),
            url: url, // URL completa do backend
            body: body,
            context: `Falha na requisição ${method} ${path}`
         };

         // Adiciona o erro à coleção para debug posterior
         if (window.ErrorCollector) {
            ErrorCollector.addError(errorDetails);
         }

         // Log simples no console atual (não detalhado)
         console.error(`🚫 Erro ${payload.code || 'UNKNOWN'}: ${method} ${path} (${response.status})`);

         // Salva apenas os dados básicos para o toast do usuário
         sessionStorage.setItem('errorCode', payload.code);
         sessionStorage.setItem('errorMessage', payload.message);

         // Se é erro de token de acesso, lança uma exceção específica
         if (payload.code === 'ACCESS_TOKEN_MISSING' || payload.code === 'INVALID_TOKEN' || response.status === 401) {
            const tokenError = new Error(payload.message || 'Token de acesso não fornecido');
            tokenError.code = payload.code || 'ACCESS_TOKEN_MISSING';
            tokenError.route = path;
            tokenError.method = method;
            tokenError.statusCode = response.status;
            throw tokenError;
         }

         // Se veio erro e indicou redirectTo, redireciona e interrompe
         if (!response.ok && payload.redirectTo) {
            window.location.href = payload.redirectTo;
            return;
         }
      }

      // Se veio erro sem redirectTo, lança para o catch
      if (!response.ok) {
         const err = new Error(payload.message || 'Erro desconhecido');
         err.payload = payload;
         err.route = path;
         err.method = method;
         err.statusCode = response.status;

         // Adiciona também erros de catch à coleção
         if (window.ErrorCollector) {
            ErrorCollector.addError({
               code: payload.code || 'NETWORK_ERROR',
               message: payload.message || 'Erro de rede ou servidor',
               route: path,
               method: method,
               statusCode: response.status,
               timestamp: new Date().toISOString(),
               url: url,
               body: body,
               context: `Exceção lançada em ${method} ${path}`
            });
         }

         throw err;
      }

      // Se tudo ok, retorna o JSON normalmente
      return payload;
   } catch (error) {
      // Log simples para não poluir o console
      console.error(`❌ Erro de rede: ${method} ${path}`);

      // Adiciona erros de catch à coleção
      if (window.ErrorCollector) {
         ErrorCollector.addError({
            code: 'NETWORK_ERROR',
            message: error.message || 'Erro de rede ou conectividade',
            route: path,
            method: method,
            statusCode: 0,
            timestamp: new Date().toISOString(),
            url: url,
            body: body,
            context: `Erro de rede/conectividade em ${method} ${path}`
         });
      }

      // Re-lança o erro para que seja tratado por quem chama
      throw error;
   }
}

// Função utilitária para exibir toasts de erro/sucesso
function showToast(message, type = 'error', duration = 5000) {
   // Remove toasts existentes
   const existingToasts = document.querySelectorAll('.custom-toast');
   existingToasts.forEach(toast => toast.remove());

   // Cria o toast
   const toast = document.createElement('div');
   toast.className = `custom-toast toast-${type}`;
   toast.innerHTML = `
      <div class="toast-content">
         <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
         <span class="toast-message">${message}</span>
         <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
   `;

   // Adiciona estilos se não existirem
   if (!document.querySelector('#toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'toast-styles';
      styles.textContent = `
         .custom-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: slideIn 0.3s ease-out;
         }
         .toast-error { background: #fee; border-left: 4px solid #dc3545; color: #721c24; }
         .toast-success { background: #d4edda; border-left: 4px solid #28a745; color: #155724; }
         .toast-content { display: flex; align-items: center; gap: 10px; }
         .toast-icon { font-size: 16px; }
         .toast-message { flex: 1; }
         .toast-close { background: none; border: none; font-size: 20px; cursor: pointer; color: inherit; }
         @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `;
      document.head.appendChild(styles);
   }

   // Adiciona ao DOM
   document.body.appendChild(toast);

   // Remove automaticamente após o tempo especificado
   setTimeout(() => {
      if (toast.parentNode) {
         toast.remove();
      }
   }, duration);
}

// Função para configurar o botão de logout globalmente
function setupLogoutButton() {
   // Procura por botões de logout na página
   const logoutButtons = document.querySelectorAll('[data-logout], .logout-btn, #logout-btn');
   
   logoutButtons.forEach(button => {
      button.addEventListener('click', async function(e) {
         e.preventDefault();
         
         if (typeof AuthManager !== 'undefined' && AuthManager.logout) {
            await AuthManager.logout();
         } else {
            // Fallback básico se o AuthManager não estiver disponível
            localStorage.clear();
            sessionStorage.clear();
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.href = '/login';
         }
      });
   });
}

// Verifica erros de sessão armazenados e exibe toast se necessário
function checkSessionErrors() {
   const errorCode = sessionStorage.getItem('errorCode');
   const errorMessage = sessionStorage.getItem('errorMessage');
   
   if (errorCode && errorMessage) {
      showToast(errorMessage, 'error');
      sessionStorage.removeItem('errorCode');
      sessionStorage.removeItem('errorMessage');
   }
}

// Inicializa o sistema quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
   // Verifica se o sistema de personalização está disponível
   if (typeof CompanyBranding !== 'undefined') {
      if (!document.documentElement.hasAttribute('loader')) {
         CompanyBranding.init();
      }
   }

   // Configurar o botão de logout
   setupLogoutButton();

   // Verificar erros de sessão
   checkSessionErrors();
});