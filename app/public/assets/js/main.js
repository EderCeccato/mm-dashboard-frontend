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
});
