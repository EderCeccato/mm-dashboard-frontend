// Defina a URL base do backend aqui
const BASE_URL = 'https://mm-dashboard-backend.vercel.app'; // Troque para a URL de produção quando necessário

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

// Função utilitária para requisições autenticadas usando cookies
async function Thefetch(path, method = 'GET', body = null) {
   const url = BASE_URL + path;
   const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Fundamental para enviar cookies entre domínios
   };

   if (body) {
      options.body = JSON.stringify(body);
   }

   try {
      const response = await fetch(url, options);
      // Tenta extrair JSON (pode falhar se ser HTML puro)
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
            url: url,
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

         // Se veio erro e indicou redirectTo, redireciona e interrompe
         if (!response.ok && payload.redirectTo) {
            window.location.href = payload.redirectTo;
            // interrompe a execução desta função
            return;
         }
      }

      // Se veio erro sem redirectTo, lança para o catch lá embaixo
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
            context: `Erro de rede/catch em ${method} ${path}`
         });
      }

      // aqui você pode mostrar um toast/modal ou re-lançar o erro pro chamador
      throw error;
   }
}



// Configura o botão de logout para chamar AuthManager.logout()
function setupLogoutButton() {
   // Procura pelo botão de logout usando o ID ou a classe
   const logoutButton = document.getElementById('logout-link');

   if (logoutButton) {
      // Adiciona o evento de clique
      logoutButton.addEventListener('click', function() {
         // Verifica se o AuthManager está disponível
         if (typeof AuthManager !== 'undefined' && AuthManager.logout) {
            // Chama a função de logout do AuthManager
            AuthManager.logout();
         } else {
            console.error('AuthManager não está disponível. Redirecionando manualmente.');
            // Fallback: redireciona para a página de login
            window.location.href = '/login';
         }
      });

      // Adiciona cursor pointer para indicar que é clicável
      logoutButton.style.cursor = 'pointer';
   }
};

// A função getUserData foi movida para o AuthManager.renderUserInfo()
// que agora cuida de todos os dados do usuário automaticamente

// Inicializa o sistema de personalização de marca em todas as páginas
document.addEventListener('DOMContentLoaded', function() {
   // Verifica se o sistema de personalização está disponível
   if (typeof CompanyBranding !== 'undefined') {
      // Se o loader não estiver sendo usado, inicializa diretamente
      if (!document.documentElement.hasAttribute('loader')) {
         CompanyBranding.init()
      }
      // Caso contrário, o loader.js já vai cuidar da inicialização
   }

   // Configurar o botão de logout
   setupLogoutButton();
   // Os dados do usuário são carregados automaticamente pelo AuthManager.renderUserInfo()
});
