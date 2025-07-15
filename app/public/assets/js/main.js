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
