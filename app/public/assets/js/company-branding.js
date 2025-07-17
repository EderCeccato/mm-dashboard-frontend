/**
 * Sistema de personalização baseada no domínio
 * Este script busca informações da empresa com base no domínio atual
 * e aplica personalizações como cores e logotipos
 */

const CompanyBranding = (function() {
   'use strict';

   // Chaves usadas no localStorage
   const COMPANY_DATA_KEY = 'companyData';

   /**
      * Extrai o domínio principal da URL atual
      * @returns {string} Domínio (ex: 'empresa.meudominio.com.br', 'localhost')
   */
   function extractDomain() {
      const hostname = window.location.hostname;

      // Caso seja localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
         return hostname;
      }

      // Obtém os componentes do domínio
      const parts = hostname.split('.');

      // Se tiver www, remove
      if (parts[0] === 'www') {
         parts.shift();
      }

      // Se tiver pelo menos 3 partes, pega as últimas 3 (ex: empresa.meudominio.com.br)
      // Se tiver menos, usa todo o hostname
      if (parts.length >= 3) {
         return parts.join('.');
      }

      return hostname;
   }

   /**
    * Busca informações da empresa com base no domínio
    * @returns {Promise<Object|null>} Dados da empresa ou null em caso de erro
    */
   async function fetchCompanyData() {
      try {
         const domain = extractDomain();

         // Usa a função global Thefetch
         if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            return null;
         }

         const response = await Thefetch(`/api/company/by-url/${domain}`, 'GET');

         if (response && response.success && response.data) {

            // Salva no localStorage para uso futuro
            localStorage.setItem(COMPANY_DATA_KEY, JSON.stringify(response.data));

            return response.data;
         }

         console.error('❌ Erro ao obter dados da empresa:', response?.message || 'Resposta inválida');
         return null;
      } catch (error) {
         console.error('❌ Erro ao buscar informações da empresa:', error);
         return null;
      }
   }

   /**
    * Aplica a cor primária ao CSS
    * @param {string} colorRgb Cor no formato "R, G, B" (ex: "0, 129, 0")
    */
   function applyPrimaryColor(colorRgb) {
      if (!colorRgb) return;

      try {
         // Cria um estilo personalizado
         const style = document.createElement('style');
         style.id = 'company-primary-color';

         // Define a variável CSS --primary-rgb
         style.textContent = `:root { --primary-rgb: ${colorRgb}; }`;

         // Remove estilo anterior se existir
         const existingStyle = document.getElementById('company-primary-color');
         if (existingStyle) {
            existingStyle.remove();
         }

         // Adiciona o novo estilo ao head
         document.head.appendChild(style);
      } catch (error) {
         console.error('❌ Erro ao aplicar cor primária:', error);
      }
   }

   /**
    * Aplica o favicon da empresa
    * @param {string} faviconUrl URL do favicon
    */
   function applyFavicon(faviconUrl) {
      if (!faviconUrl) return;

      try {
         // Procura por links de favicon existentes
         const existingFavicons = document.querySelectorAll('link[rel*="icon"]');

         // Se encontrou algum favicon existente
         if (existingFavicons.length > 0) {
            // Atualiza o href do primeiro favicon encontrado
            existingFavicons[0].href = faviconUrl;

            // Remove os demais favicons, se houver
            for (let i = 1; i < existingFavicons.length; i++) {
               existingFavicons[i].remove();
            }
         } else {
            // Se não encontrou nenhum favicon, cria um novo
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.type = 'image/x-icon';
            favicon.href = faviconUrl;
            document.head.appendChild(favicon);
         }
      } catch (error) {
         console.error('❌ Erro ao aplicar favicon:', error);
      }
   }

   /**
    * Substitui as imagens de marca
    * @param {Object} data Dados da empresa
    */
   function replaceImages(data) {
      if (!data) return;

      try {
         // Mapeamento de classes para URLs
         const imageMapping = {
            'desktop-logo': data.logo_url,
            'toggle-logo': data.logo_square_url,
            'desktop-dark': data.logo_dark_url,
            'toggle-dark': data.logo_square_dark_url,
            'desktop-white': data.logo_white_url,
            'toggle-white': data.logo_square_white_url,
            'authentication-image': data.background_url
         };

         // Percorre todas as imagens na página
         document.querySelectorAll('img').forEach(img => {
            // Verifica se a imagem tem uma das classes mapeadas
            Object.keys(imageMapping).forEach(className => {
               if (img.classList.contains(className) && imageMapping[className]) {
                  // Substitui o src da imagem
                  img.src = imageMapping[className];
               }
            });
         });
      } catch (error) {
         console.error('❌ Erro ao substituir imagens:', error);
      }
   }

   /**
    * Inicializa o sistema de personalização
    * @param {boolean} forceRefresh Se verdadeiro, ignora o cache e busca dados novos
    */
   async function init(forceRefresh = false) {
      try {
         // Tenta obter dados do localStorage primeiro (cache)
         let companyData = null;

         if (!forceRefresh) {
            const cachedData = localStorage.getItem(COMPANY_DATA_KEY);
            if (cachedData) {
               try {
                  companyData = JSON.parse(cachedData);
               } catch (e) {
                  console.warn('⚠️ Cache de dados da empresa inválido');
               }
            }
         }

         // Se não tiver cache ou for inválido, ou se forceRefresh for true, busca do servidor
         if (!companyData || forceRefresh) {
            companyData = await fetchCompanyData();
         }

         // Se encontrou dados da empresa, aplica personalizações
         if (companyData) {
            // Aplica a cor primária
            if (companyData.color) {
               applyPrimaryColor(companyData.color);
            }

            // Aplica o favicon
            if (companyData.favicon_url) {
               applyFavicon(companyData.favicon_url);
            }

            // Substitui imagens de marca
            replaceImages(companyData);

            // Atualiza o background da página de login
            if (companyData.background_url) {
                // Cria um novo estilo para sobrescrever o background original
                const style = document.createElement('style');
                style.textContent = `
                    .authentication .authentication-cover {
                        background-image: url('${companyData.background_url}') !important;
                    }
                `;
                document.head.appendChild(style);
            }
         } else {
            console.warn('⚠️ Dados da empresa não encontrados');
         }

         return companyData;
      } catch (error) {
         console.error('❌ Erro ao inicializar personalização:', error);
         return null;
      }
   }

   // Expõe API pública
   return {
      init: init,
      forceRefresh: function() {
         return init(true);
      },
      getCompanyData: function() {
         try {
            const data = localStorage.getItem(COMPANY_DATA_KEY);
            return data ? JSON.parse(data) : null;
         } catch (e) {
            return null;
         }
      }
   };
})();
