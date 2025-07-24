const CompaniesManager = (function() {
   'use strict';
   // Estado global
   let companies = [];
   let users = [];
   let modules = [];

   /**
      * Inicializa o sistema
   */
   function init() {
      loadInitialData();
   }

   /**
    * Carrega dados iniciais
   */
   async function loadInitialData() {
      try {
         await Promise.all([
            loadCompanies(),
            loadUsers(),
            loadModules()
         ]);

      } catch (error) {
         console.error('❌ Erro ao carregar dados iniciais:', error);
      }
   }

   /**
      * Carrega lista de empresas
   */
   async function loadCompanies() {
      try {
         if (typeof Thefetch !== 'function') {
            throw new Error('Função Thefetch não encontrada');
         }

         const response = await Thefetch('/api/company', 'GET');

         if (response && response.success && response.data) {
            companies = response.data;
            renderTableCompanies(); // Renderiza a tabela de empresas
         } else {
            companies = [];
            console.log('⚠️ Nenhuma empresa encontrada');
         }

      } catch (error) {
         console.error('❌ Erro ao carregar empresas:', error);
         companies = [];
      }
   }

   /**
      * Carrega lista de usuários
   */
   async function loadUsers() {
      try {
         if (typeof Thefetch !== 'function') {
            throw new Error('Função Thefetch não encontrada');
         }

         const response = await Thefetch('/api/user', 'GET');

         if (response && response.success && response.data) {
            users = response.data;
            // renderTableUsers();
         } else {
            users = [];
            console.log('⚠️ Nenhum usuário encontrado');
         }

      } catch (error) {
         console.error('❌ Erro ao carregar usuários:', error);
         users = [];
      }
   }

   /**
      * Carrega módulos disponíveis
   */
   async function loadModules() {
      try {
         if (typeof Thefetch !== 'function') {
            throw new Error('Função Thefetch não encontrada');
         }

         const response = await Thefetch('/api/company/modules', 'GET');

         if (response && response.success && response.data) {
            modules = response.data;
         } else {
            modules = [];
            console.log('⚠️ Nenhum módulo encontrado');
         }

      } catch (error) {
         console.error('❌ Erro ao carregar módulos:', error);
         modules = [];
      }
   }

   /**
      * Renderiza tabela de empresas
   */
   function renderTableCompanies() {
      const tbody = document.querySelector('#table-companies tbody');
      if (!tbody) return;

      if (companies.length === 0) {
         tbody.innerHTML = `
            <tr>
               <td colspan="6" class="text-center text-muted py-4">
                  <i class="bi bi-building text-muted fs-1 d-block mb-2"></i>
                  <p class="mb-2">Nenhuma empresa encontrada</p>
                  <small class="text-muted">Clique em "Nova Empresa" para cadastrar a primeira empresa</small>
               </td>
            </tr>
         `;
         return;
      }

      tbody.innerHTML = companies.map(company => `
         <tr>
            <td class="text-center">
               ${company.logo_url
                  ? `
                     <div class="d-flex align-items-center justify-content-center">
                        <img src="${company.logo_url}" alt="logo" class="desktop-logo" width="40">
                        <img src="${company.logo_dark_url}" alt="logo" class="desktop-dark" width="40">
                        <img src="${company.logo_white_url}" alt="logo" class="desktop-white" width="40">
                        <img src="${company.logo_square_url}" alt="logo" class="desktop-white" width="40">
                        <img src="${company.logo_square_dark_url}" alt="logo" class="desktop-white" width="40">
                        <img src="${company.logo_square_white_url}" alt="logo" class="desktop-white" width="40">
                     </div>
                  `
                  : `<div class="bg-primary text-white rounded d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; font-weight: bold;">${company.name.charAt(0).toUpperCase()}</div>`
               }
            </td>
            <td class="text-center">
               <div class="fw-semibold">${company.name}</div>
               <small class="text-muted">UUID: ${company.uuid}</small>
            </td>
            <td class="text-center">${company.cnpj}</td>
            <td class="text-center">
               <span class="badge ${company.status === 'active' ? 'bg-success' : 'bg-danger'}">
                  ${company.status === 'active' ? 'Ativo' : 'Inativo'}
               </span>
            </td>
            <td class="text-center">
               <div class="btn-group" role="group">
                  <button type="button" class="btn btn-sm btn-outline-primary" onclick="CompaniesManager.editCompany(${company.uuid})" title="Editar">
                     <i class="bi bi-pencil"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-info" onclick="CompaniesManager.viewCompanyModules(${company.uuid})" title="Módulos">
                     <i class="bi bi-grid-3x3-gap"></i>
                  </button>
                  <button type="button" class="btn btn-sm ${company.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}" onclick="CompaniesManager.toggleStatusCompany(${company.uuid})" title="${company.status === 'active' ? 'Inativar' : 'Ativar'}">
                     <i class="bi ${company.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}"></i>
                  </button>
               </div>
            </td>
         </tr>
      `).join('');
   }

   init();

   // API pública
   return {
      loadInitialData: loadInitialData,
      loadCompanies: loadCompanies,
      loadUsers: loadUsers,
      loadModules: loadModules,
      renderTableCompanies: renderTableCompanies
   };
})();

// Expõe globalmente
window.CompaniesManager = CompaniesManager;
