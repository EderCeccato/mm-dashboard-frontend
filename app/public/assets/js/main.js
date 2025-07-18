// Defina a URL base do backend aqui
const BASE_URL = 'http://localhost:3301'; // Troque para a URL de produção quando necessário

// Função utilitária para requisições autenticadas usando cookies
async function Thefetch(path, method = 'GET', body = null) {
   const url = BASE_URL + path;
   const options = {
      method,
      headers: {
         'Content-Type': 'application/json',
      },
      credentials: 'include' // Fundamental para enviar cookies entre domínios
   };

   if (body) {
      options.body = JSON.stringify(body);
   }

   try {
      const response = await fetch(url, options);
      return await response.json();
   } catch (error) {
      console.error('Error:', error);
      return error;
   }
}

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
   // Pega o nome do usuário
   getUserData();
});

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

// Pega o nome do usuário
function getUserData() {
   const userName = document.getElementById('user-name');
   const userNameLocalStorage = localStorage.getItem('lastUserName');

   if (userNameLocalStorage) userName.textContent = userNameLocalStorage;
};
