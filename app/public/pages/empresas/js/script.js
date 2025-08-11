// Configurações globais para validação de arquivos
const FILE_VALIDATION_CONFIG = {
   'company-background': {
      maxWidth: 700,
      maxHeight: 1000,
      maxSize: 5 * 1024 * 1024, // 5MB
      label: 'Background da Empresa'
   },
   'company-logo': {
      maxWidth: 800,
      maxHeight: 400,
      maxSize: 5 * 1024 * 1024,
      label: 'Logo Principal'
   },
   'company-logo-white': {
      maxWidth: 800,
      maxHeight: 400,
      maxSize: 5 * 1024 * 1024,
      label: 'Logo Branca'
   },
   'company-logo-dark': {
      maxWidth: 800,
      maxHeight: 400,
      maxSize: 5 * 1024 * 1024,
      label: 'Logo Escura'
   },
   'company-logo-square': {
      maxWidth: 512,
      maxHeight: 512,
      maxSize: 5 * 1024 * 1024,
      label: 'Logo Quadrada'
   },
   'company-logo-square-white': {
      maxWidth: 512,
      maxHeight: 512,
      maxSize: 5 * 1024 * 1024,
      label: 'Logo Quadrada Branca'
   },
   'company-logo-square-dark': {
      maxWidth: 512,
      maxHeight: 512,
      maxSize: 5 * 1024 * 1024,
      label: 'Logo Quadrada Escura'
   },
   'company-favicon': {
      maxWidth: 32,
      maxHeight: 32,
      maxSize: 1 * 1024 * 1024, // 1MB
      label: 'Favicon'
   },
   'user-avatar': {
      maxWidth: 512,
      maxHeight: 512,
      maxSize: 2 * 1024 * 1024, // 2MB
      label: 'Avatar do Usuário'
   }
};

// Configurações para tipos de usuário
const CONFIG = {
   TIPOS_USUARIO: {
      'superuser': { label: 'Super Usuário', badge: 'bg-danger' },
      'admin': { label: 'Administrador', badge: 'bg-warning' },
      'user': { label: 'Usuário', badge: 'bg-info' },
      'client': { label: 'Cliente', badge: 'bg-teal' }
   },
   TIPOS_MODULO: {
      'superuser': { label: 'Super Usuário', badge: 'bg-danger' },
      'admin': { label: 'Administrador', badge: 'bg-warning' },
      'user': { label: 'Usuário', badge: 'bg-info' },
      'client': { label: 'Cliente', badge: 'bg-teal' }
   }
};

const URL_BASE = 'http://localhost:3301';

const CompaniesManager = (function() {
   'use strict';
   // Estado global
   let companies = [];
   let users = [];
   let modules = [];
   let companySelected = null;
   let userSelected = null;
   let availableModules = [];

   /**
    * Máscara para CNPJ
    */
   function applyCnpjMask(input) {
      input.addEventListener('input', function(e) {
         let value = e.target.value.replace(/\D/g, '');

         if (value.length <= 14) {
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
         }

         e.target.value = value;
      });
   }

   /**
    * Máscara para domínio
    */
   function applyDomainMask(input) {
      input.addEventListener('input', function(e) {
         let value = e.target.value.toLowerCase();

         // Remove caracteres especiais, exceto pontos e hífens
         value = value.replace(/[^a-z0-9.-]/g, '');

         // Remove pontos múltiplos
         value = value.replace(/\.{2,}/g, '.');

         // Remove hífens múltiplos
         value = value.replace(/-{2,}/g, '-');

         // Remove pontos e hífens no início
         value = value.replace(/^[.-]+/, '');

         e.target.value = value;
      });

      // Aplica máscara quando o campo perde o foco
      input.addEventListener('blur', function(e) {
         let value = e.target.value.toLowerCase().trim();

         if (value && !value.endsWith('.com.br')) {
            if (!value.includes('.')) {
               value = value + '.m2softwares.com.br';
            } else if (!value.includes('.com.br')) {
               value = value + '.com.br';
            }
            e.target.value = value;
         }
      });
   }

   /**
      * Inicializa o sistema
   */
   function init() {
      // Verifica se a função Thefetch está disponível
      if (typeof Thefetch !== 'function') {
         console.error('❌ Função Thefetch não encontrada. Aguardando...');
         // Tenta novamente após um delay
         setTimeout(() => {
            if (typeof Thefetch === 'function') {
               bindEvents();
               loadInitialData();
            } else {
               console.error('❌ Função Thefetch ainda não encontrada após delay');
            }
         }, 1000);
         return;
      }

      // Continua inicialização
      bindEvents();
      loadInitialData();

      // O monitoramento será iniciado após os dados serem carregados
      // na função loadInitialData
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

         // Verifica se os dados foram carregados com sucesso antes de iniciar o monitoramento
         if (users && Array.isArray(users) && users.length > 0) {
            // Inicia o monitoramento de status de bloqueio após os dados serem carregados
            setTimeout(() => {
               startLockStatusMonitoring();
            }, 2000); // 2 segundos após o carregamento
         } else {
            console.log('⚠️ Dados de usuários não carregados, monitoramento não iniciado');
         }

      } catch (error) {
         console.error('❌ Erro ao carregar dados iniciais:', error);
      }
   }

   /**
      * Carrega lista de empresas
   */
   async function loadCompanies() {
      try {
         // Verifica se a função Thefetch está disponível
         if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            return;
         }

         const response = await Thefetch('/api/company', 'GET');

         if (response && response.success && response.data) {
            companies = response.data;
            popularSelectCompanies();
            renderTableCompanies();
         } else {
            console.error('❌ Erro ao carregar empresas:', response);
         }
      } catch (error) {
         console.error('❌ Erro ao carregar empresas:', error);
      }
   }

   /**
      * Carrega lista de usuários
   */
   async function loadUsers() {
      try {
         // Verifica se a função Thefetch está disponível
         if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            users = [];
            return;
         }

         const response = await Thefetch('/api/user', 'GET');

         if (response && response.success && response.data) {
            users = response.data || [];
            renderTableUsers();
         } else {
            console.error('❌ Erro ao carregar usuários:', response);
            users = []; // Garante que a variável seja um array vazio
         }
      } catch (error) {
         console.error('❌ Erro ao carregar usuários:', error);
         users = []; // Garante que a variável seja um array vazio em caso de erro
      }
   }

   /**
      * Carrega módulos disponíveis
   */
   async function loadModules() {
      try {
         // Verifica se a função Thefetch está disponível
         if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            return;
         }

         const response = await Thefetch('/api/modules', 'GET');

         if (response && response.success && response.data) {
            availableModules = response.data;
         } else {
            console.error('❌ Erro ao carregar módulos:', response);
         }
      } catch (error) {
         console.error('❌ Erro ao carregar módulos:', error);
      }
   }

   /**
    * Verifica se o usuário está bloqueado baseado no campo locked_until
    * @param {Object} user - Dados do usuário
    * @returns {Object} - {isLocked: boolean, lockInfo: string}
    */
   function checkUserLockStatus(user) {
      if (!user.locked_until) {
         return { isLocked: false, lockInfo: null };
      }

      const lockDate = new Date(user.locked_until);
      const now = new Date();

      // Se a data de bloqueio é futura, o usuário está bloqueado
      if (lockDate > now) {
         const timeDiff = lockDate - now;
         const hours = Math.floor(timeDiff / (1000 * 60 * 60));
         const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

         let lockInfo = '';
         if (hours > 0) {
            lockInfo = `${hours}h ${minutes}m restantes`;
         } else {
            lockInfo = `${minutes}m restantes`;
         }

         return { isLocked: true, lockInfo };
      }

      return { isLocked: false, lockInfo: null };
   }

   /**
    * Renderiza tabela de usuários
    */
   function renderTableUsers() {
      const tbody = document.querySelector('#tabelaUsuarios tbody');
      if (!tbody) {
         console.error('❌ Tabela de usuários não encontrada');
         return;
      }


      // Aplica filtros
      let filteredUsers = [...users];

      const companyFilter = document.getElementById('filtroEmpresa')?.value;
      const userTypeFilter = document.getElementById('filtroTipoUsuario')?.value;

      if (companyFilter && companyFilter !== '') {
         filteredUsers = filteredUsers.filter(user => user.company_name === companies.find(c => c.uuid === companyFilter)?.name);
      }

      if (userTypeFilter && userTypeFilter !== '') {
         filteredUsers = filteredUsers.filter(user => user.user_type === userTypeFilter);
      }

      if (filteredUsers.length === 0) {
         tbody.innerHTML = `
            <tr>
               <td colspan="6" class="text-center text-muted py-4">
                  <i class="bi bi-people text-muted fs-1 d-block mb-2"></i>
                  <p class="mb-2">Nenhum usuário encontrado</p>
                  <small class="text-muted">Clique em "Novo Usuário" para cadastrar o primeiro usuário</small>
               </td>
            </tr>
         `;
         return;
      }

      tbody.innerHTML = filteredUsers.map(user => {
         const lockStatus = checkUserLockStatus(user);

         return `
         <tr class="${lockStatus.isLocked ? 'table-warning' : ''}">
            <td>
               <div class="d-flex align-items-center">
                  ${user.profile_picture_url
                     ? `<img src="${user.profile_picture_url}" alt="Avatar" class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                     : `<div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; font-weight: bold;">
                          ${user.name.charAt(0).toUpperCase()}
                        </div>`
                  }
                  <div>
                     <div class="fw-semibold d-flex align-items-center">
                        ${user.name}
                        ${lockStatus.isLocked ? '<i class="bi bi-lock-fill text-warning ms-2" title="Usuário bloqueado"></i>' : ''}
                     </div>
                     <small class="text-muted">${user.email}</small>
                     ${lockStatus.isLocked ? `<br><small class="text-warning"><i class="bi bi-clock me-1"></i>${lockStatus.lockInfo}</small>` : ''}
                  </div>
               </div>
            </td>
            <td class="text-center">
               <span class="badge ${CONFIG.TIPOS_USUARIO[user.user_type]?.badge || 'bg-secondary'}">
                  ${CONFIG.TIPOS_USUARIO[user.user_type]?.label || user.user_type}
               </span>
            </td>
            <td class="text-center">
               ${user.company_name || '-'}
            </td>
            <td class="text-center">
               <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">
                  ${user.status === 'active' ? 'Ativo' : 'Inativo'}
               </span>
            </td>
            <td class="text-center">
               <small class="text-muted">${user.modules || '-'}</small>
            </td>
            <td class="text-center">
               <div class="btn-group" role="group">
                  <button type="button" class="btn btn-sm btn-outline-primary" onclick="CompaniesManager.editUser('${user.uuid}')" title="Editar">
                     <i class="bi bi-pencil"></i>
                  </button>
                  ${lockStatus.isLocked
                     ? `<button type="button" class="btn btn-sm btn-outline-warning" onclick="CompaniesManager.unlockUser('${user.uuid}')" title="Desbloquear Usuário (${lockStatus.lockInfo})">
                          <i class="bi bi-unlock-fill"></i>
                        </button>`
                     : `<button type="button" class="btn btn-sm btn-outline-secondary" onclick="CompaniesManager.unlockUser('${user.uuid}')" title="Desbloquear Sessão" disabled>
                          <i class="bi bi-unlock"></i>
                        </button>`
                  }
                  <button type="button" class="btn btn-sm ${user.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="CompaniesManager.toggleStatusUser('${user.uuid}')" title="${user.status === 'active' ? 'Inativar' : 'Ativar'}">
                     <i class="bi ${user.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}"></i>
                  </button>
               </div>
            </td>
         </tr>
      `}).join('');

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
                  <button type="button" class="btn btn-sm btn-outline-primary" onclick="CompaniesManager.editCompany('${company.uuid}')" title="Editar">
                     <i class="bi bi-pencil"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-info" onclick="CompaniesManager.viewCompanyModules('${company.uuid}')" title="Módulos">
                     <i class="bi bi-grid-3x3-gap"></i>
                  </button>
                  <button type="button" class="btn btn-sm ${company.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}" onclick="CompaniesManager.toggleStatusCompany('${company.uuid}')" title="${company.status === 'active' ? 'Inativar' : 'Ativar'}">
                     <i class="bi ${company.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}"></i>
                  </button>
               </div>
            </td>
         </tr>
      `).join('');
   }

   /**
      * Popula select de empresas
   */
   function popularSelectCompanies() {

      // Popula select de filtro
      const companyFilter = document.getElementById('filtroEmpresa');
      if (companyFilter) {
         companyFilter.innerHTML = '<option value="">Todas as empresas</option>';
         companies.forEach(company => {
            companyFilter.innerHTML += `<option value="${company.uuid}">${company.name}</option>`;
         });
      }

      // Popula select do modal de usuário
      const userCompanySelect = document.getElementById('user-company');
      if (userCompanySelect) {
         userCompanySelect.innerHTML = '<option value="">Selecione uma empresa</option>';
         companies.forEach(company => {
            userCompanySelect.innerHTML += `<option value="${company.uuid}">${company.name}</option>`;
         });
      }
   }

   /**
    * Carrega módulos disponíveis para uma empresa
    */
   async function loadCompanyModules(companyUuid) {
      try {
         const response = await Thefetch(`/api/company/${companyUuid}/modules`, 'GET');

         if (response && response.success && response.data && response.data.modules) {
            return response.data.modules;
         }

         return [];
      } catch (error) {
         console.error('❌ Erro ao carregar módulos da empresa:', error);
         return [];
      }
   }

   /**
    * Carrega todos os módulos disponíveis no sistema
    */
   async function loadAllModules() {
      try {

         // Adiciona timeout de 10 segundos
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 10000);

         const response = await Thefetch('/api/modules', 'GET', null, { signal: controller.signal });
         clearTimeout(timeoutId);

         if (response && response.success && response.data) {
            availableModules = response.data;
            return response.data;
         }

         console.log('⚠️ Nenhum módulo encontrado no sistema');
         return [];
      } catch (error) {
         console.error('❌ Erro ao carregar todos os módulos:', error);

         if (error.name === 'AbortError') {
            console.error('⏰ Timeout ao carregar módulos');
            return [];
         }

         return [];
      }
   }

   /**
    * Renderiza módulos disponíveis no modal de usuário
    */
   function renderUserModules(modules, selectedModules = []) {
      const modulesContainer = document.getElementById('user-modules-list');
      const modulesLoading = document.getElementById('user-modules-loading');
      const modulesSection = document.getElementById('modules-selection-section');

      if (!modulesContainer) {
         console.error('❌ Container de módulos do usuário não encontrado');
         return;
      }

      // Esconde o loading imediatamente
      if (modulesLoading) {
         modulesLoading.style.display = 'none';
      }

      if (!modules || modules.length === 0) {
         // Esconde a seção de módulos se não há módulos
         if (modulesSection) {
            modulesSection.style.display = 'none';
         }

         modulesContainer.innerHTML = `
            <div class="text-center text-muted py-3">
               <i class="bi bi-grid-3x3-gap fs-1 d-block mb-2"></i>
               <p>Nenhum módulo disponível</p>
            </div>
         `;
         modulesContainer.style.display = 'block';
         console.log('⚠️ Nenhum módulo disponível para renderizar');
         return;
      }

      // Mostra o container de módulos
      if (modulesSection) {
         modulesSection.style.display = 'block';
      }

      // Mostra o container de lista de módulos
      modulesContainer.style.display = 'block';

      const modulesHtml = modules.map(module => {
         const isSelected = selectedModules.includes(module.id);
         return `
            <div class="col-md-6 mb-3">
               <div class="card module-card ${isSelected ? 'border-primary' : ''}" data-module-id="${module.id}">
                  <div class="card-body p-3">
                     <div class="form-check">
                        <input class="form-check-input module-checkbox" type="checkbox"
                               id="user-module-${module.id}"
                               value="${module.id}"
                               ${isSelected ? 'checked' : ''}>
                        <label class="form-check-label w-100" for="user-module-${module.id}">
                           <div class="d-flex justify-content-between align-items-start">
                              <div>
                                 <h6 class="card-title mb-1">${module.name}</h6>
                                 ${module.description ? `<small class="text-muted">${module.description}</small>` : ''}
                                 <br><span class="badge ${CONFIG.TIPOS_MODULO[module.module_type]?.badge || 'bg-secondary'} badge-sm mt-1">${CONFIG.TIPOS_MODULO[module.module_type]?.label || module.module_type}</span>
                              </div>
                              <i class="bi bi-check-circle-fill text-primary module-check-icon" style="display: ${isSelected ? 'inline' : 'none'}"></i>
                           </div>
                        </label>
                     </div>
                  </div>
               </div>
            </div>
         `;
      }).join('');

      modulesContainer.innerHTML = `
         <div class="row">
            ${modulesHtml}
         </div>
      `;


      // Adiciona event listeners para os checkboxes
      const checkboxes = modulesContainer.querySelectorAll('.module-checkbox');

      checkboxes.forEach(checkbox => {
         checkbox.addEventListener('change', function() {
            const card = this.closest('.module-card');
            const icon = card.querySelector('.module-check-icon');

            if (this.checked) {
               card.classList.add('border-primary');
               icon.style.display = 'inline';
            } else {
               card.classList.remove('border-primary');
               icon.style.display = 'none';
            }
         });
      });

   }

   /**
    * Handler para mudança no tipo de usuário
    */
   async function onUserTypeChange() {
      const userType = document.getElementById('user-type');
      const companySelect = document.getElementById('user-company');
      const modulesContainer = document.getElementById('user-modules-list');
      const companyGroup = document.getElementById('company-selection-section');
      const modulesLoading = document.getElementById('user-modules-loading');
      const clientsSection = document.getElementById('clients-selection-section');
      const modulesSection = document.getElementById('modules-selection-section');

      // Verifica se os elementos existem antes de usar
      if (!userType) return;

      const userTypeValue = userType.value;

      // Esconde o loading imediatamente
      if (modulesLoading) {
         modulesLoading.style.display = 'none';
      }

      // Limpa módulos
      if (modulesContainer) {
         modulesContainer.innerHTML = '';
         modulesContainer.style.display = 'none';
      }

      // Reset de seções
      if (clientsSection) clientsSection.style.display = 'none';
      if (modulesSection) modulesSection.style.display = 'none';

      // Configura visibilidade do campo empresa
      if (companyGroup && companySelect) {
         if (userTypeValue === 'superuser') {
            companyGroup.style.display = 'none';
            companySelect.value = '';
         } else {
            companyGroup.style.display = 'block';
         }
      }

      // Carrega módulos apropriados
      if (userTypeValue === 'superuser') {
         // Para superuser, carrega todos os módulos de superuser
         try {
            // Mostra a seção de módulos
            if (modulesSection) {
               modulesSection.style.display = 'block';
            }

            const allModules = await loadAllModules();
            const superuserModules = allModules.filter(module => module.module_type === 'superuser');
            renderUserModules(superuserModules);
         } catch (error) {
            console.error('❌ Erro ao carregar módulos de superuser:', error);
            if (modulesContainer) {
               modulesContainer.innerHTML = `
                  <div class="text-center text-danger py-3">
                     <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
                     <p>Erro ao carregar módulos</p>
                  </div>
               `;
               modulesContainer.style.display = 'block';
            }
         }
      } else if (userTypeValue === 'client') {
         // Para client, mostra apenas a seção de clientes
         if (clientsSection) clientsSection.style.display = 'block';

         // Inicializa seletor de clientes com delay para garantir que o DOM está pronto
         setTimeout(async () => {
            try {
               await initializeClientsSelect();
            } catch (error) {
               console.error('❌ Erro ao inicializar seletor de clientes:', error);
            }
         }, 100);
      } else if (userTypeValue && companySelect && companySelect.value) {
         // Para admin/user, carrega módulos da empresa selecionada
         await onCompanyChange();
      } else if (userTypeValue && (userTypeValue === 'admin' || userTypeValue === 'user')) {
         // Para admin/user sem empresa selecionada, mostra mensagem
         console.log('⚠️ Usuário admin/user selecionado, mas empresa não selecionada');
         if (modulesContainer) {
            modulesContainer.innerHTML = `
               <div class="text-center text-muted py-3">
                  <i class="bi bi-building fs-1 d-block mb-2"></i>
                  <p>Selecione uma empresa para ver os módulos disponíveis</p>
               </div>
            `;
            modulesContainer.style.display = 'block';
         }
      }
   }

   /**
    * Handler para mudança na empresa
    */
   async function onCompanyChange() {
      const userType = document.getElementById('user-type');
      const companyUser = document.getElementById('user-company');

      if (!userType || !companyUser) return;

      const userTypeValue = userType.value;
      const companyUuid = companyUser.value;

      if (!userTypeValue || !companyUuid) return;

      try {
         const companyModules = await loadCompanyModules(companyUuid);

         // Filtra módulos baseado no tipo de usuário
         let availableModules = [];

         if (userTypeValue === 'admin') {
            availableModules = companyModules.filter(module =>
               module.module_type === 'admin' || module.module_type === 'user'
            );
         } else if (userTypeValue === 'user') {
            availableModules = companyModules.filter(module =>
               module.module_type === 'user'
            );
         }

         renderUserModules(availableModules);

      } catch (error) {
         console.error('❌ Erro ao carregar módulos da empresa:', error);
         const modulesContainer = document.getElementById('user-modules-list');
         if (modulesContainer) {
            modulesContainer.innerHTML = `
               <div class="text-center text-danger py-3">
                  <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
                  <p>Erro ao carregar módulos da empresa</p>
               </div>
            `;
            modulesContainer.style.display = 'block';
         }
      }
   }

   /**
    * Valida senhas (apenas para novo cadastro)
    */
   function validatePasswords() {
      const password = document.getElementById('user-password');
      const userUuid = document.getElementById('user-uuid');

      if (!password) return;

      // Se é edição (tem UUID), senha é opcional
      if (userUuid && userUuid.value) {
         password.removeAttribute('required');
         password.setCustomValidity('');
         return;
      }

      // Se é novo cadastro, senha é obrigatória
      password.setAttribute('required', 'required');

      // Por enquanto, apenas valida se a senha tem pelo menos 6 caracteres
      if (password.value && password.value.length < 6) {
         password.setCustomValidity('A senha deve ter pelo menos 6 caracteres');
      } else {
         password.setCustomValidity('');
      }
   }

   /**
    * Salva usuário (criar ou editar)
    */
   async function saveUser() {
      try {
         const form = document.getElementById('form-new-user');
         if (!form) {
            showErrorToast('Formulário de usuário não encontrado');
            return;
         }

         if (!form.checkValidity()) {
            form.reportValidity();
            return;
         }

         const userUuid = document.getElementById('user-uuid')?.value;
         const userType = document.getElementById('user-type')?.value;
         const companyUuid = document.getElementById('user-company')?.value;
         const passwordField = document.getElementById('user-password');

         // Validações específicas
         if (!userType) {
            showErrorToast('Tipo de usuário é obrigatório');
            return;
         }

         if (userType !== 'superuser' && !companyUuid) {
            showErrorToast('Empresa é obrigatória para usuários admin e user');
            return;
         }

         // Coleta módulos selecionados
         const selectedModules = [];
         const moduleCheckboxes = document.querySelectorAll('#user-modules-list .module-checkbox:checked');
         moduleCheckboxes.forEach(checkbox => {
            selectedModules.push(parseInt(checkbox.value));
         });

         const formData = new FormData(form);
         const dados = {};

         // Converte FormData para objeto
         for (let [key, value] of formData.entries()) {
            if (key !== 'user-uuid' && typeof value === 'string' && value.trim() !== '') {
               dados[key] = value;
            }
         }

         // Remove senha vazia na edição
         if (userUuid && passwordField && (!passwordField.value || passwordField.value.trim() === '')) {
            delete dados['user-password'];
         }

         // Adiciona dados específicos
         dados.user_type = userType;
         if (companyUuid) {
            const company = companies.find(c => c.uuid === companyUuid);
            dados.company_id = company?.id;
         }
         dados.moduleIds = selectedModules;

         const method = userUuid ? 'PUT' : 'POST';
         const url = userUuid ? `/api/user/${userUuid}` : '/api/user';

         const response = await Thefetch(url, method, dados);

         if (response && response.success) {
            // Se há avatar para upload, faz o upload
            if (window.FilePondManager) {
               const avatarFile = FilePondManager.getFile('user-avatar');
               if (avatarFile) {
                  try {
                     // Para novos usuários, usa o UUID retornado na resposta
                     const targetUuid = userUuid || response.user?.uuid || response.data?.uuid;
                     if (targetUuid) {
                        await uploadUserAvatar(targetUuid);
                     }
                  } catch (avatarError) {
                     console.warn('⚠️ Erro ao fazer upload do avatar:', avatarError);
                     // Não falha o cadastro por causa do avatar
                  }
               }
            }

            // Se é usuário do tipo client, salva os clientes vinculados
            if (userType === 'client') {
               try {
                  const targetUuid = userUuid || response.user?.uuid || response.data?.uuid;
                  if (targetUuid && window.clientsChoices) {
                     const selectedClients = window.clientsChoices.getValue();

                     if (selectedClients && selectedClients.length > 0) {
                        const clientsData = selectedClients.map(client => ({
                           nocli: client.value,
                           nomcli: client.customProperties?.name || client.label.split(' - ')[0],
                           cgccli: client.customProperties?.cnpj || client.label.split(' - ')[1]
                        }));

                        // Valida e limpa clientes removidos do Firebird
                        const validatedClients = await validateAndCleanUserClients(targetUuid, clientsData);

                        const clientsResponse = await Thefetch('/api/user/clients', 'POST', {
                           userUuid: targetUuid,
                           clients: validatedClients
                        });

                        if (clientsResponse && clientsResponse.success) {
                           // Atualiza a lista local com os clientes salvos
                           await updateUserClientsInLocalList(targetUuid, clientsResponse.data.currentClients);
                        } else {
                           console.warn('⚠️ Erro ao salvar clientes do usuário:', clientsResponse?.message);
                        }
                     } else {
                        // Se não há clientes selecionados, desativa todos os clientes existentes
                        await validateAndCleanUserClients(targetUuid, []);
                     }
                  }
               } catch (clientsError) {
                  console.warn('⚠️ Erro ao salvar clientes do usuário:', clientsError);
                  // Não falha o cadastro por causa dos clientes
               }
            }

            showSuccessToast(
               userUuid ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!',
               'success'
            );

            // Fecha modal
            const modalElement = document.getElementById('modal-new-user');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
               modal.hide();
            }

            // Recarrega dados
            await loadUsers();

         } else {
            throw new Error(response?.message || 'Erro ao salvar usuário');
         }

      } catch (error) {
         console.error('❌ Erro ao salvar usuário:', error);
         showErrorToast('Erro ao salvar usuário: ' + error.message);
      }
   }

   /**
    * Edita usuário
    */
   async function editUser(userUuid) {
      const user = users.find(u => u.uuid === userUuid);
      if (!user) {
         showErrorToast('Usuário não encontrado');
         return;
      }

      userSelected = user;

      // Preenche formulário
      const userUuidField = document.getElementById('user-uuid');
      const titleField = document.getElementById('title-modal-new-user');
      const textField = document.getElementById('text-save-user');
      const nameField = document.getElementById('user-name-input');
      const emailField = document.getElementById('user-email');
      const passwordField = document.getElementById('user-password');
      const passwordLabel = document.querySelector('label[for="user-password"]');
      const typeField = document.getElementById('user-type');
      const statusField = document.getElementById('user-status');
      const companySelect = document.getElementById('user-company');
      const companyGroup = document.getElementById('company-selection-section');

      // Preenche campos básicos
      if (userUuidField) userUuidField.value = user.uuid;
      if (titleField) titleField.textContent = 'Editar Usuário';
      if (textField) textField.textContent = 'Atualizar Usuário';
      if (nameField) {
         // Primeira tentativa
         nameField.value = user.name;
         nameField.dispatchEvent(new Event('input', { bubbles: true }));

         // Segunda tentativa após um pequeno delay
         setTimeout(() => {
            if (nameField.value !== user.name) {
               nameField.value = user.name;
               nameField.dispatchEvent(new Event('input', { bubbles: true }));
            }
         }, 50);

         // Terceira tentativa após um delay maior
         setTimeout(() => {
            if (nameField.value !== user.name) {
               nameField.value = user.name;
               nameField.dispatchEvent(new Event('input', { bubbles: true }));
            }
         }, 200);

      }
      if (emailField) {
         emailField.value = user.email;
      }
      if (typeField) {
         typeField.value = user.user_type;
      }
      if (statusField) statusField.value = user.status;

      // Configura senha (opcional na edição)
      if (passwordField) {
         passwordField.value = ''; // Limpa senha na edição
         passwordField.removeAttribute('required');
         passwordField.placeholder = 'Deixe em branco para manter a senha atual';
      }

      // Remove asterisco do label da senha na edição
      if (passwordLabel) {
         passwordLabel.textContent = 'Senha';
      }

      // Configura empresa
      if (companySelect && companyGroup) {
         if (user.user_type === 'superuser') {
            companyGroup.style.display = 'none';
            companySelect.value = '';
         } else {
            companyGroup.style.display = 'block';
            const company = companies.find(c => c.name === user.company_name);
            if (company) {
               companySelect.value = company.uuid;
            }
         }
      }

      // Esconde o loading desnecessário
      const modulesLoading = document.getElementById('user-modules-loading');
      if (modulesLoading) {
         modulesLoading.style.display = 'none';
      }

      // Carrega dados específicos do tipo
      if (user.user_type === 'client') {
         // Mostra a seção de clientes
         const clientsSection = document.getElementById('clients-selection-section');
         if (clientsSection) {
            clientsSection.style.display = 'block';
         }

         // Inicializa o Choices.js imediatamente
         setTimeout(async () => {
            try {
               await initializeClientsSelect();

               // Usa diretamente os clientes do usuário que já estão no array
               if (user.clients && user.clients.length > 0 && window.clientsChoices) {

                  // Converte os clientes para o formato do Choices
                  const userClients = user.clients.map(client => ({
                     value: client.client_id,
                     label: `${client.client_name} - ${client.client_cnpj}`,
                     selected: true,
                     customProperties: {
                        name: client.client_name,
                        cnpj: client.client_cnpj
                     }
                  }));

                  // Adiciona as opções ao Choices
                  window.clientsChoices.setChoices(userClients, 'value', 'label', true);

                  // Marca os clientes como selecionados
                  setTimeout(() => {
                     userClients.forEach(client => {
                        window.clientsChoices.setChoiceByValue(client.value);
                     });
                  }, 50);
               } else {
                  console.log('🔍 Nenhum cliente encontrado para o usuário');
               }
            } catch (error) {
               console.error('❌ Erro ao inicializar Choices para client:', error);
            }
         }, 100);
      } else {
         // Para superuser, admin e user, carrega módulos
         await loadUserModules(user);
      }

      // Carrega avatar existente se houver
      if (window.FilePondManager && user.profile_picture_url) {
         setTimeout(() => {
            FilePondManager.loadUserAvatar(user);
         }, 200);
      }

      // Abre modal
      const modalElement = document.getElementById('modal-new-user');
      if (modalElement) {
         const modal = new bootstrap.Modal(modalElement);

         // Adiciona listener para quando o modal estiver completamente aberto
         modalElement.addEventListener('shown.bs.modal', function onModalShown() {
            // Re-preenche o nome para garantir que seja exibido
            const nameField = document.getElementById('user-name-input');

            if (nameField && user.name) {
               nameField.value = user.name;
               nameField.dispatchEvent(new Event('input', { bubbles: true }));
               nameField.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Para usuários do tipo client, garante que os clientes sejam pré-selecionados
            if (user.user_type === 'client' && user.clients && user.clients.length > 0 && window.clientsChoices) {
               setTimeout(() => {
                  // Converte os clientes para o formato do Choices
                  const userClients = user.clients.map(client => ({
                     value: client.client_id,
                     label: `${client.client_name} - ${client.client_cnpj}`,
                     selected: true,
                     customProperties: {
                        name: client.client_name,
                        cnpj: client.client_cnpj
                     }
                  }));

                  // Marca os clientes como selecionados
                  userClients.forEach(client => {
                     window.clientsChoices.setChoiceByValue(client.value);
                  });
               }, 300);
            }

            // Remove o listener para evitar duplicação
            modalElement.removeEventListener('shown.bs.modal', onModalShown);
         }, { once: true });

         modal.show();
      }
   }

   /**
    * Carrega módulos do usuário para edição
    */
   async function loadUserModules(user) {
      try {

         let availableModules = [];
         let selectedModules = [];

         // Extrai módulos já selecionados do usuário
         if (user.modules) {

            // Se modules é uma string (lista separada por vírgula), vamos extrair os nomes
            if (typeof user.modules === 'string') {
               const moduleNames = user.modules.split(',').map(name => name.trim());

               // Por enquanto, vamos marcar todos os módulos disponíveis como selecionados
               // Em uma implementação real, você precisaria fazer um mapeamento por nome
               selectedModules = moduleNames.map(name => {
                  // Aqui você pode implementar a lógica para encontrar o ID do módulo pelo nome
                  return name; // Por enquanto, retorna o nome
               });
            }
         }

         if (user.user_type === 'superuser') {
            // Para superuser, carrega todos os módulos de superuser
            const allModules = await loadAllModules();
            availableModules = allModules.filter(module => module.module_type === 'superuser');

            // Se o usuário tem módulos, vamos tentar mapear pelos nomes
            if (user.modules && typeof user.modules === 'string') {
               const moduleNames = user.modules.split(',').map(name => name.trim());
               selectedModules = availableModules
                  .filter(module => moduleNames.includes(module.name))
                  .map(module => module.id);
            }
         } else if (user.company_name) {
            // Para admin/user, carrega módulos da empresa
            const company = companies.find(c => c.name === user.company_name);
            if (company) {
               const companyModules = await loadCompanyModules(company.uuid);

               if (user.user_type === 'admin') {
                  availableModules = companyModules.filter(module =>
                     module.module_type === 'admin' || module.module_type === 'user'
                  );
               } else if (user.user_type === 'user') {
                  availableModules = companyModules.filter(module =>
                     module.module_type === 'user'
                  );
               }

               // Se o usuário tem módulos, vamos tentar mapear pelos nomes
               if (user.modules && typeof user.modules === 'string') {
                  const moduleNames = user.modules.split(',').map(name => name.trim());
                  selectedModules = availableModules
                     .filter(module => moduleNames.includes(module.name))
                     .map(module => module.id);
               }
            }
         }

         // Renderiza módulos com os selecionados
         renderUserModules(availableModules, selectedModules);

      } catch (error) {
         console.error('❌ Erro ao carregar módulos do usuário:', error);
         showErrorToast('Erro ao carregar módulos do usuário');
      }
   }

   /**
    * Desbloqueia sessão do usuário
    */
   async function unlockUser(userUuid) {
      const user = users.find(u => u.uuid === userUuid);
      if (!user) {
         showErrorToast('Usuário não encontrado');
         return;
      }

      const lockStatus = checkUserLockStatus(user);

      // Se o usuário não está bloqueado, mostra mensagem informativa
      if (!lockStatus.isLocked) {
         await Swal.fire({
            title: 'Usuário não está bloqueado',
            text: `O usuário "${user.name}" não está atualmente bloqueado.`,
            icon: 'info',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
         });
         return;
      }

      const confirmation = await Swal.fire({
         title: 'Confirmar Desbloqueio',
         html: `
            <div class="text-start">
               <p>Tem certeza que deseja desbloquear o usuário <strong>"${user.name}"</strong>?</p>
               <div class="alert alert-warning mt-3">
                  <i class="bi bi-clock me-2"></i>
                  <strong>Tempo restante de bloqueio:</strong> ${lockStatus.lockInfo}
               </div>
               <small class="text-muted">
                  <i class="bi bi-info-circle me-1"></i>
                  O usuário poderá fazer login novamente imediatamente após o desbloqueio.
               </small>
            </div>
         `,
         icon: 'warning',
         showCancelButton: true,
         confirmButtonColor: '#ffc107',
         cancelButtonColor: '#6c757d',
         confirmButtonText: 'Sim, desbloquear!',
         cancelButtonText: 'Cancelar',
         reverseButtons: true
      });

      if (!confirmation.isConfirmed) {
         console.log('❌ Desbloqueio cancelado pelo usuário');
         return;
      }

      try {
         const response = await Thefetch(`/api/auth/users/${userUuid}/unlock`, 'PATCH');


         if (response && response.success) {
            showSuccessToast('Usuário desbloqueado com sucesso!');

            // Recarrega a lista de usuários para atualizar o status
            await loadUsers();
         } else {
            const errorMessage = response?.message || response?.error || 'Erro desconhecido no desbloqueio';
            console.error('❌ Erro no desbloqueio:', errorMessage);
            showErrorToast('Erro ao desbloquear usuário: ' + errorMessage);
         }
      } catch (error) {
         console.error('❌ Erro ao desbloquear usuário:', error);
         showErrorToast('Erro ao desbloquear usuário: ' + error.message);
      }
   }

   /**
    * Toggle status do usuário (ativar/inativar)
    */
   async function toggleStatusUser(userUuid) {
      const user = users.find(u => u.uuid === userUuid);
      if (!user) return;

      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const action = newStatus === 'active' ? 'ativar' : 'inativar';

      const confirmation = await Swal.fire({
         title: `Confirmar ${action.charAt(0).toUpperCase() + action.slice(1)}`,
         text: `Tem certeza que deseja ${action} o usuário "${user.name}"?`,
         icon: 'question',
         showCancelButton: true,
         confirmButtonColor: newStatus === 'active' ? '#28a745' : '#ffc107',
         cancelButtonColor: '#6c757d',
         confirmButtonText: `Sim, ${action}!`,
         cancelButtonText: 'Cancelar',
         reverseButtons: true
      });

      if (!confirmation.isConfirmed) {
         console.log('❌ Alteração de status cancelada pelo usuário');
         return;
      }

      try {
         const dadosUpdate = {
            ...user,
            status: newStatus
         };

         const response = await Thefetch(`/api/user/${userUuid}`, 'PUT', dadosUpdate);

         if (response && response.success) {
            showSuccessToast(`Usuário ${action}ado com sucesso!`);
            await loadUsers();
         } else {
            throw new Error(response?.message || `Erro ao ${action} usuário`);
         }

      } catch (error) {
         console.error(`❌ Erro ao ${action} usuário:`, error);
         showErrorToast(`Erro ao ${action} usuário: ` + error.message);
      }
   }

   /**
    * Reset do formulário de usuário
    */
   function resetFormUser() {
      // Limpa campos do formulário
      const form = document.getElementById('form-new-user');
      if (form) {
         form.reset();
      }

      // Limpa campos específicos
      const userUuidField = document.getElementById('user-uuid');
      const titleField = document.getElementById('title-modal-new-user');
      const textField = document.getElementById('text-save-user');
      const passwordField = document.getElementById('user-password');
      const passwordLabel = document.querySelector('label[for="user-password"]');

      if (userUuidField) userUuidField.value = '';
      if (titleField) titleField.textContent = 'Cadastrar Novo Usuário';
      if (textField) textField.textContent = 'Salvar Usuário';

      // Configura senha para novo usuário
      if (passwordField) {
         passwordField.value = '';
         passwordField.setAttribute('required', 'required');
         passwordField.placeholder = '•••••••••••••••••';
      }

      // Adiciona asterisco no label da senha para novo usuário
      if (passwordLabel) {
         passwordLabel.textContent = 'Senha *';
      }

      // Esconde seções específicas
      const companyGroup = document.getElementById('company-selection-section');
      const modulesSection = document.getElementById('modules-selection-section');
      const clientsSection = document.getElementById('clients-selection-section');
      const modulesContainer = document.getElementById('user-modules-list');
      const modulesLoading = document.getElementById('user-modules-loading');
      const userModulesControls = document.getElementById('user-modules-controls');

      if (companyGroup) companyGroup.style.display = 'none';
      if (modulesSection) modulesSection.style.display = 'none';
      if (clientsSection) clientsSection.style.display = 'none';
      if (modulesContainer) {
         modulesContainer.innerHTML = '';
         modulesContainer.style.display = 'none';
      }
      if (modulesLoading) modulesLoading.style.display = 'none';
      if (userModulesControls) userModulesControls.style.display = 'none';

      // Limpa Choices.js se existir
      if (window.clientsChoices) {
         try {
            window.clientsChoices.destroy();
            window.clientsChoices = null;
         } catch (error) {
            console.warn('⚠️ Erro ao destruir Choices:', error);
         }
      }

      // Limpa FilePond se existir
      if (window.FilePondManager) {
         try {
            FilePondManager.clearAllFiles();
         } catch (error) {
            console.warn('⚠️ Erro ao limpar FilePond:', error);
         }
      }

      // Reseta variáveis globais
      userSelected = null;
   }

   /**
    * Obtém classe de badge para tipo de usuário
    */
   function getBadgeClassForUserType(userType) {
      return CONFIG.TIPOS_USUARIO[userType]?.badge || 'bg-secondary';
   }

   /**
    * Valida arquivos antes do upload
    */
   function validateFiles(arquivos) {
      const errors = [];

      Object.entries(arquivos).forEach(([key, file]) => {
         if (file) {
            const config = FILE_VALIDATION_CONFIG[key];
            if (!config) return;

            // Verifica tamanho do arquivo
            if (file.size && file.size > config.maxSize) {
               errors.push(`${config.label}: Arquivo muito grande (máx ${Math.round(config.maxSize / 1024 / 1024)}MB)`);
            }

            // Verifica tipo do arquivo
            if (!file.type || !file.type.startsWith('image/')) {
               errors.push(`${config.label}: Tipo de arquivo inválido (apenas imagens)`);
            }
         }
      });

      return errors;
   }

   /**
    * Valida dimensões da imagem usando FileReader
    */
   function validateImageDimensions(file, inputId) {
      return new Promise((resolve, reject) => {
         // Verifica se o arquivo existe
         if (!file) {
            reject(new Error('Arquivo inválido'));
            return;
         }

         const config = FILE_VALIDATION_CONFIG[inputId];
         if (!config) {
            resolve(true); // Sem validação configurada
            return;
         }

         const img = new Image();
         const url = URL.createObjectURL(file);

         img.onload = function() {
            URL.revokeObjectURL(url);

            const width = this.width;
            const height = this.height;

            if (width > config.maxWidth || height > config.maxHeight) {
               reject(new Error(`${config.label}: Dimensões inválidas (máx ${config.maxWidth}x${config.maxHeight}px, atual ${width}x${height}px)`));
            } else {
               resolve(true);
            }
         };

         img.onerror = function() {
            URL.revokeObjectURL(url);
            reject(new Error(`${config.label}: Erro ao carregar imagem`));
         };

         img.src = url;
      });
   }

   /**
      * Faz upload das imagens da empresa
   */
   async function uploadImagesCompany(companyUuid) {
      try {
         if (!window.FilePondManager) {
            console.warn('FilePondManager não disponível');
            return;
         }

         const arquivos = {
            background: FilePondManager.getFile('company-background'),
            logo: FilePondManager.getFile('company-logo'),
            logo_white: FilePondManager.getFile('company-logo-white'),
            logo_dark: FilePondManager.getFile('company-logo-dark'),
            logo_square: FilePondManager.getFile('company-logo-square'),
            logo_square_white: FilePondManager.getFile('company-logo-square-white'),
            logo_square_dark: FilePondManager.getFile('company-logo-square-dark'),
            favicon: FilePondManager.getFile('company-favicon')
         };

         // Verifica se há arquivos para upload
         const temArquivos = Object.values(arquivos).some(file => file);
         if (!temArquivos) return;

         // Valida arquivos antes do upload
         const validationErrors = validateFiles(arquivos);
         if (validationErrors.length > 0) {
            throw new Error('Erro de validação: ' + validationErrors.join(', '));
         }

         const formData = new FormData();
         Object.entries(arquivos).forEach(([key, file]) => {
            if (file) {
               formData.append(key, file);
            }
         });

         // Para upload de arquivos, precisamos usar fetch diretamente com FormData
         const uploadResponse = await fetch(`${URL_BASE}/api/company/${companyUuid}/upload-images`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
         });

         // Verifica se a resposta foi bem-sucedida
         if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            const errorMessage = errorData?.message || errorData?.error || `Erro ${uploadResponse.status}: ${uploadResponse.statusText}`;
            throw new Error(errorMessage);
         }

         const response = await uploadResponse.json();

         if (response && response.success) {
            showSuccessToast('Imagens da empresa enviadas com sucesso');
            await loadCompanies(); // Recarrega para mostrar as imagens
         } else {
            // Se a resposta não foi bem-sucedida mas o status HTTP foi 200
            const errorMessage = response?.message || response?.error || 'Erro desconhecido no upload das imagens';
            throw new Error(errorMessage);
         }

      } catch (error) {
         console.error('❌ Erro ao fazer upload das imagens:', error);
         // Re-lança o erro para que a função saveCompany possa tratá-lo
         throw error;
      }
   }

   /**
    * Salva empresa (criar ou editar)
    */
   async function saveCompany() {
      try {
         const form = document.getElementById('form-new-company');
         if (!form) {
            showErrorToast('Formulário de empresa não encontrado');
            return;
         }

         if (!form.checkValidity()) {
            form.reportValidity();
            return;
         }

         const empresaUuid = document.getElementById('company-uuid')?.value;
         const formData = new FormData(form);

         // Converte FormData para objeto
         const dados = {};
         for (let [key, value] of formData.entries()) {
            if (key !== 'company-uuid' && typeof value === 'string' && value.trim() !== '') {
               dados[key] = value;
            }
         }

         // Validações específicas
         if (!dados['company-name'] || !dados['company-cnpj'] || !dados['company-domain']) {
            showErrorToast('Nome, CNPJ e Domínio são obrigatórios', 'error');
            return;
         }

         const method = empresaUuid ? 'PUT' : 'POST';
         const url = empresaUuid ? `/api/company/${empresaUuid}` : '/api/company';

         const response = await Thefetch(url, method, dados);

         if (response && response.success) {
            // Faz upload das imagens ANTES de fechar o modal
            let uploadSuccess = true;
            const companyUuid = response.data?.uuid || empresaUuid;

            if (companyUuid) {
               try {
                  await uploadImagesCompany(companyUuid);
               } catch (uploadError) {
                  console.error('❌ Erro no upload de imagens:', uploadError);
                  uploadSuccess = false;
                  // Não fecha o modal se houver erro no upload
                  showErrorToast('Empresa salva, mas houve erro no upload das imagens: ' + uploadError.message);
                  return;
               }
            }

            // Se há clientes selecionados, salva os clientes vinculados
            if (window.companyClientsChoices) {
               try {
                  const targetUuid = companyUuid || response.company?.uuid || response.data?.uuid;
                  if (targetUuid) {
                     const selectedClients = window.companyClientsChoices.getValue();

                     if (selectedClients && selectedClients.length > 0) {
                        const clientsData = selectedClients.map(client => ({
                           nocli: client.value,
                           nomcli: client.customProperties?.name || client.label.split(' - ')[0],
                           cgccli: client.customProperties?.cnpj || client.label.split(' - ')[1]
                        }));

                        // Valida e limpa clientes removidos do Firebird
                        const validatedClients = await validateAndCleanCompanyClients(targetUuid, clientsData);

                        const clientsResponse = await Thefetch('/api/company/clients', 'POST', {
                           companyUuid: targetUuid,
                           clients: validatedClients
                        });

                        if (clientsResponse && clientsResponse.success) {
                           // Atualiza a lista local com os clientes salvos
                           await updateCompanyClientsInLocalList(targetUuid, clientsResponse.data.currentClients);
                        } else {
                           console.warn('⚠️ Erro ao salvar clientes da empresa:', clientsResponse?.message);
                        }
                     } else {
                        // Se não há clientes selecionados, desativa todos os clientes existentes
                        await validateAndCleanCompanyClients(targetUuid, []);
                     }
                  }
               } catch (clientsError) {
                  console.warn('⚠️ Erro ao salvar clientes da empresa:', clientsError);
                  // Não falha o cadastro por causa dos clientes
               }
            }

            // Só fecha o modal se tudo estiver OK
            if (uploadSuccess) {
               showSuccessToast(
                  empresaUuid ? 'Empresa atualizada com sucesso!' : 'Empresa criada com sucesso!',
                  'success'
               );

               // Fecha modal e recarrega dados
               const modalElement = document.getElementById('modal-new-company');
               const modal = bootstrap.Modal.getInstance(modalElement);

               if (modal) {
                  modal.hide();
               }

               // Força a remoção do backdrop caso fique travado
               setTimeout(() => {
                  const backdrop = document.querySelector('.modal-backdrop');
                  if (backdrop) {
                     backdrop.remove();
                  }
                  document.body.classList.remove('modal-open');
                  document.body.style.overflow = '';
                  document.body.style.paddingRight = '';
               }, 300);

               await loadCompanies();
               popularSelectCompanies();
            }

         } else {
            throw new Error(response?.message || 'Erro ao salvar empresa');
         }

      } catch (error) {
         console.error('❌ Erro ao salvar empresa:', error);
         showErrorToast('Erro ao salvar empresa: ' + error.message);
      }
   }

   /**
      * Edita empresa
   */
   async function editCompany(companyUuid) {
      const company = companies.find(c => c.uuid === companyUuid);
      if (!company) {
         showErrorToast('Empresa não encontrada');
         return;
      }

      companySelected = company;

      // Preenche formulário
      const empresaUuidField = document.getElementById('company-uuid');
      const titleField = document.getElementById('title-modal-new-company');
      const textField = document.getElementById('text-save-company');
      const nameField = document.getElementById('company-name');
      const cnpjField = document.getElementById('company-cnpj');
      const domainField = document.getElementById('company-domain');
      const statusField = document.getElementById('company-status');
      const firebirdHostField = document.getElementById('company-firebird-host');
      const firebirdPortField = document.getElementById('company-firebird-port');
      const firebirdDatabaseField = document.getElementById('company-firebird-database');
      const firebirdUserField = document.getElementById('company-firebird-user');
      const firebirdPasswordField = document.getElementById('company-firebird-password');

      if (empresaUuidField) empresaUuidField.value = company.uuid;
      if (titleField) titleField.textContent = 'Editar Empresa';
      if (textField) textField.textContent = 'Atualizar Empresa';
      if (nameField) nameField.value = company.name;
      if (cnpjField) cnpjField.value = company.cnpj;
      if (domainField) domainField.value = company.url;
      if (statusField) statusField.value = company.status;
      if (firebirdHostField) firebirdHostField.value = company.firebird_host;
      if (firebirdPortField) firebirdPortField.value = company.firebird_port;
      if (firebirdDatabaseField) firebirdDatabaseField.value = company.firebird_database;
      if (firebirdUserField) firebirdUserField.value = company.firebird_user;
      if (firebirdPasswordField) firebirdPasswordField.value = company.firebird_password;

      // Mostra a seção de clientes para admin/superuser
      const clientsSection = document.getElementById('company-clients-selection-section');
      if (clientsSection) {
         clientsSection.style.display = 'block';
      }

      // Inicializa o Choices.js para clientes
      setTimeout(async () => {
         try {
            await initializeCompanyClientsSelect();

            // Carrega clientes da empresa
            const companyClients = await loadCompanyClients(company.uuid);

            if (companyClients.length > 0 && window.companyClientsChoices) {
               console.log('🔍 Carregando clientes da empresa:', companyClients);
               window.companyClientsChoices.setChoices(companyClients, 'value', 'label', true);

               // Marca os clientes como selecionados
               companyClients.forEach(client => {
                  if (client.selected) {
                     window.companyClientsChoices.setChoiceByValue(client.value);
                  }
               });
            } else {
               console.log('🔍 Nenhum cliente encontrado para a empresa');
            }
         } catch (error) {
            console.error('❌ Erro ao inicializar Choices para clientes:', error);
         }
      }, 100);

      // Carrega imagens existentes no FilePond
      setTimeout(() => {
         if (window.FilePondManager) {
            FilePondManager.loadCompanyImages(company);
         }
      }, 100);

      // Abre modal
      const modalElement = document.getElementById('modal-new-company');
      if (modalElement) {
         new bootstrap.Modal(modalElement).show();
      }
   }

   /**
      * Mapeia nomes de campos do banco para IDs dos inputs
   */
   function mapCompanyField(field) {
      const map = {
         'name': 'company-name',
         'cnpj': 'company-cnpj',
         'url': 'company-domain',
         'status': 'company-status',
         'firebird_host': 'company-firebird-host',
         'firebird_port': 'company-firebird-port',
         'firebird_database': 'company-firebird-database',
         'firebird_user': 'company-firebird-user',
         'firebird_password': 'company-firebird-password',
      };
      return map[field] || field;
   }

   /**
      * Reset do formulário de empresa
   */
   function resetFormCompany() {
      const formCompany = document.getElementById('form-new-company');
      if (formCompany) {
         formCompany.reset();
      }
      const empresaUuidField = document.getElementById('company-uuid');
      const titleField = document.getElementById('title-modal-new-company');
      const textField = document.getElementById('text-save-company');
               // companySelected já está disponível no escopo

      // Remove classes de layout específicas
      document.querySelectorAll('.new-company-layout').forEach(el => {
         el.classList.remove('new-company-layout');
      });

      // Limpa apenas o conteúdo dos FilePonds, mantendo os inputs
      if (window.FilePondManager) {
         FilePondManager.clearAllFiles();
      }

      // Limpa clientes
      if (window.companyClientsChoices) {
         window.companyClientsChoices.clearStore();
         window.companyClientsChoices.clearChoices();
      }

      // Esconde seção de clientes
      const clientsSection = document.getElementById('company-clients-selection-section');
      if (clientsSection) {
         clientsSection.style.display = 'none';
      }

      // Garante que o backdrop seja removido e o body seja resetado
      setTimeout(() => {
         const backdrop = document.querySelector('.modal-backdrop');
         if (backdrop) {
            backdrop.remove();
         }
         document.body.classList.remove('modal-open');
         document.body.style.overflow = '';
         document.body.style.paddingRight = '';
      }, 100);
   }

   /**
    * Normaliza dados de módulos independente do formato da API
    */
   function normalizeModulesData(data) {
      if (!data) return [];

      // Se já é um array, retorna como está
      if (Array.isArray(data)) {
         return data;
      }

      // Se tem propriedade modules que é array
      if (data.modules && Array.isArray(data.modules)) {
         return data.modules;
      }

      // Se tem propriedade data que é array
      if (data.data && Array.isArray(data.data)) {
         return data.data;
      }

      // Se é um objeto com dados, tenta converter para array
      if (typeof data === 'object') {
         return Object.values(data).filter(item => item && typeof item === 'object');
      }

      return [];
   }

   /**
    * Carrega todos os módulos disponíveis no sistema
    */
   async function loadAvailableModules() {
      try {
         const response = await Thefetch('/api/modules', 'GET');

         if (response && response.success) {
            const modules = normalizeModulesData(response.data);
            return modules;
         }

         return [];
      } catch (error) {
         console.error('❌ Erro ao carregar módulos:', error);
         showErrorToast('Erro ao carregar módulos disponíveis');
         return [];
      }
   }

   /**
    * Carrega módulos da empresa específica
    */
   async function loadCompanyModules(companyUuid) {
      try {
         const response = await Thefetch(`/api/company/${companyUuid}/modules`, 'GET');

         if (response && response.success && response.data && response.data.modules) {
            return response.data.modules;
         }

         return [];
      } catch (error) {
         console.error('❌ Erro ao carregar módulos da empresa:', error);
         return [];
      }
   }

   /**
    * Renderiza a lista de módulos com checkboxes
    */
   function renderModulesList(modules, selectedModules = []) {
      const modulesList = document.getElementById('modules-list');
      const modulesLoading = document.getElementById('modules-loading');
      const noModules = document.getElementById('no-modules');

      // Verifica se os elementos existem
      if (!modulesList || !modulesLoading || !noModules) {
         console.error('❌ Elementos do modal de módulos não encontrados');
         return;
      }

      // Esconde loading
      modulesLoading.style.display = 'none';

      // Verifica se há módulos para renderizar
      if (!modules || !Array.isArray(modules) || modules.length === 0) {
         noModules.style.display = 'block';
         modulesList.style.display = 'none';
         return;
      }

      noModules.style.display = 'none';
      modulesList.style.display = 'flex';

      const modulesHtml = modules.map(module => {
         const isSelected = selectedModules.includes(module.id || module.uuid);
         const moduleId = module.id || module.uuid;

         return `
            <div class="col-md-6 mb-3">
               <div class="card module-card ${isSelected ? 'border-primary' : ''}" data-module-id="${moduleId}">
                  <div class="card-body p-3">
                     <div class="form-check">
                        <input class="form-check-input module-checkbox" type="checkbox"
                               id="module-${moduleId}"
                               value="${moduleId}"
                               ${isSelected ? 'checked' : ''}>
                        <label class="form-check-label w-100" for="module-${moduleId}">
                           <div class="d-flex justify-content-between align-items-start">
                              <div>
                                 <h6 class="card-title mb-1">${module.name}</h6>
                                 ${module.description ? `<small class="text-muted">${module.description}</small>` : ''}
                                 ${module.user_type ? `<br><span class="badge ${getBadgeClassForUserType(module.user_type)} badge-sm mt-1">${CONFIG.TIPOS_USUARIO[module.user_type]?.label || module.user_type}</span>` : ''}
                              </div>
                              <i class="bi bi-check-circle-fill text-primary module-check-icon" style="display: ${isSelected ? 'inline' : 'none'}"></i>
                           </div>
                        </label>
                     </div>
                  </div>
               </div>
            </div>
         `;
      }).join('');

      modulesList.innerHTML = modulesHtml;

      // Adiciona event listeners para os checkboxes
      const checkboxes = modulesList.querySelectorAll('.module-checkbox');
      checkboxes.forEach(checkbox => {
         checkbox.addEventListener('change', function() {
            const card = this.closest('.module-card');
            const icon = card.querySelector('.module-check-icon');

            if (this.checked) {
               card.classList.add('border-primary');
               icon.style.display = 'inline';
            } else {
               card.classList.remove('border-primary');
               icon.style.display = 'none';
            }
         });
      });
   }

   /**
    * Salva os módulos selecionados para a empresa
    */
   async function saveCompanyModules() {
      try {
         const companyUuid = document.getElementById('modules-company-uuid')?.value;
         if (!companyUuid) {
            showErrorToast('UUID da empresa não encontrado');
            return;
         }

         // Coleta módulos selecionados
         const selectedModules = [];
         const checkboxes = document.querySelectorAll('.module-checkbox:checked');
         checkboxes.forEach(checkbox => {
            selectedModules.push(checkbox.value);
         });

         const dados = {
            modules: selectedModules
         };

         const response = await Thefetch(`/api/company/${companyUuid}/modules`, 'PUT', dados);

         if (response && response.success) {
            showSuccessToast('Módulos da empresa atualizados com sucesso!');

            // Fecha modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modal-company-modules'));
            if (modal) {
               modal.hide();
            }

            // Atualiza dados se necessário
            await loadCompanies();

         } else {
            throw new Error(response?.message || 'Erro ao salvar módulos da empresa');
         }

      } catch (error) {
         console.error('❌ Erro ao salvar módulos da empresa:', error);
         showErrorToast('Erro ao salvar módulos da empresa: ' + error.message);
      }
   }

   /**
    * Abre modal para gerenciar módulos da empresa
    */
   async function manageCompanyModules(companyUuid) {
      const company = companies.find(c => c.uuid === companyUuid);
      if (!company) {
         showErrorToast('Empresa não encontrada');
         return;
      }

      // Configura informações da empresa no modal
      const companyUuidField = document.getElementById('modules-company-uuid');
      const companyNameField = document.getElementById('company-name-modules');

      if (companyUuidField) companyUuidField.value = company.uuid;
      if (companyNameField) companyNameField.textContent = company.name;

      // Mostra loading
      const modulesLoading = document.getElementById('modules-loading');
      const modulesList = document.getElementById('modules-list');
      const noModules = document.getElementById('no-modules');

      if (modulesLoading) modulesLoading.style.display = 'block';
      if (modulesList) modulesList.style.display = 'none';
      if (noModules) noModules.style.display = 'none';

      // Abre modal
      const modal = new bootstrap.Modal(document.getElementById('modal-company-modules'));
      modal.show();

      try {
         // Carrega módulos disponíveis e módulos da empresa em paralelo
         const [availableModules, companyModules] = await Promise.all([
            loadAvailableModules(),
            loadCompanyModules(companyUuid)
         ]);

         // Renderiza lista de módulos
         renderModulesList(availableModules, companyModules);

      } catch (error) {
         console.error('❌ Erro ao carregar dados do modal:', error);
         if (modulesLoading) modulesLoading.style.display = 'none';
         if (noModules) noModules.style.display = 'block';
         showErrorToast('Erro ao carregar módulos');
      }
   }

   /**
    * Reset do formulário de módulos
    */
   function resetFormModules() {
      const formModules = document.getElementById('form-company-modules');
      const companyUuidField = document.getElementById('modules-company-uuid');
      const companyNameField = document.getElementById('company-name-modules');

      if (formModules) formModules.reset();
      if (companyUuidField) companyUuidField.value = '';
      if (companyNameField) companyNameField.textContent = '';

      // Reset visual
      const modulesLoading = document.getElementById('modules-loading');
      const modulesList = document.getElementById('modules-list');
      const noModules = document.getElementById('no-modules');

      if (modulesLoading) modulesLoading.style.display = 'block';
      if (modulesList) modulesList.style.display = 'none';
      if (noModules) noModules.style.display = 'none';

      // Limpa lista
      const modulesListElement = document.getElementById('modules-list');
      if (modulesListElement) {
         modulesListElement.innerHTML = '';
      }
   }

   /**
    * Função utilitária para limpar qualquer modal travado
    */
   function clearModalBackdrop() {
      // Remove todos os backdrops
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());

      // Remove classes do body
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      // Fecha todos os modals abertos
      const modals = document.querySelectorAll('.modal.show');
      modals.forEach(modal => {
         const modalInstance = bootstrap.Modal.getInstance(modal);
         if (modalInstance) {
            modalInstance.hide();
         }
      });
   }

   /**
      * Toggle status da empresa (ativar/inativar)
   */
   async function toggleStatusCompany(companyUuid) {
      const company = companies.find(c => c.uuid === companyUuid);
      if (!company) return;

      const newStatus = company.status === 'active' ? 'inactive' : 'active';
      const action = newStatus === 'active' ? 'ativar' : 'inativar';

      const confirmation = await Swal.fire({
         title: `Confirmar ${action.charAt(0).toUpperCase() + action.slice(1)}`,
         text: `Tem certeza que deseja ${action} a empresa "${company.name}"?`,
         icon: 'question',
         showCancelButton: true,
         confirmButtonColor: newStatus === 'active' ? '#28a745' : '#ffc107',
         cancelButtonColor: '#6c757d',
         confirmButtonText: `Sim, ${action}!`,
         cancelButtonText: 'Cancelar',
         reverseButtons: true
      });

      if (!confirmation.isConfirmed) return;

      try {
         const dadosUpdate = {
            ...company,
            status: newStatus
         };

         const response = await Thefetch(`/api/company/${companyUuid}`, 'PUT', dadosUpdate);

         if (response && response.success) {
            showSuccessToast(`Empresa ${action}ada com sucesso!`);
            await loadCompanies();
            popularSelectCompanies();
         } else {
            throw new Error(response?.message || `Erro ao ${action} empresa`);
         }

      } catch (error) {
         console.error(`❌ Erro ao ${action} empresa:`, error);
         showErrorToast(`Erro ao ${action} empresa: ` + error.message);
      }
   }

   /**
      * Ver módulos da empresa
   */
   async function viewCompanyModules(companyUuid) {
      // Agora abre o modal de gerenciamento em vez de apenas visualizar
      await manageCompanyModules(companyUuid);
   }

   /**
      * Vincula eventos
   */
   function bindEvents() {
      // Aguarda um pouco para garantir que os elementos existam
      setTimeout(() => {
         // Botões de salvar
         const btnSaveCompany = document.getElementById('btn-save-company');
         const btnSaveUser = document.getElementById('btn-save-user');

         if (btnSaveCompany) {
            btnSaveCompany.addEventListener('click', saveCompany);
         }
         if (btnSaveUser) {
            btnSaveUser.addEventListener('click', saveUser);
         }

         // Botões de abrir modais
         const btnNewCompany = document.querySelector('[data-bs-target="#modal-new-company"]');
         const btnNewUser = document.querySelector('[data-bs-target="#modal-new-user"]');

         if (btnNewCompany) {
            btnNewCompany.addEventListener('click', function() {
               resetFormCompany();

               // Aplica layout para nova empresa
               setTimeout(() => {
                  if (window.FilePondManager) {
                     FilePondManager.applyNewCompanyLayout();
                  }
               }, 100);

               const modal = new bootstrap.Modal(document.getElementById('modal-new-company'));
               modal.show();
            });
         }

         if (btnNewUser) {
            btnNewUser.addEventListener('click', function() {
               resetFormUser();
               // Esconde o loading imediatamente para novo usuário
               const modulesLoading = document.getElementById('user-modules-loading');
               if (modulesLoading) {
                  modulesLoading.style.display = 'none';
               }
               const modal = new bootstrap.Modal(document.getElementById('modal-new-user'));
               modal.show();
            });
         }

         // Mudança no tipo de usuário (carrega módulos)
         const userType = document.getElementById('user-type');
         const companyUser = document.getElementById('user-company');

         if (userType) {
            userType.addEventListener('change', onUserTypeChange);
         }
         if (companyUser) {
            companyUser.addEventListener('change', onCompanyChange);
         }

         // Aba de usuários - carrega dados quando clica
         const usersTab = document.getElementById('usuarios-tab');
         if (usersTab) {
            usersTab.addEventListener('click', function() {
               setTimeout(() => {
                  loadUsers();
               }, 100);
            });
         }

         // Filtros da tabela de usuários
         const companyFilter = document.getElementById('filtroEmpresa');
         const userTypeFilter = document.getElementById('filtroTipoUsuario');

         if (companyFilter) {
            companyFilter.addEventListener('change', function() {
               renderTableUsers();
            });
         }
         if (userTypeFilter) {
            userTypeFilter.addEventListener('change', function() {
               renderTableUsers();
            });
         }

         // Validação de senha
         const password = document.getElementById('user-password');
         if (password) {
            password.addEventListener('blur', validatePasswords);
         }

         // Aplicar máscaras
         const cnpjInput = document.getElementById('company-cnpj');
         const domainInput = document.getElementById('company-domain');

         if (cnpjInput) {
            applyCnpjMask(cnpjInput);
         }
         if (domainInput) {
            applyDomainMask(domainInput);
         }

         // Reset modais
         const modalNewCompany = document.getElementById('modal-new-company');
         const modalNewUser = document.getElementById('modal-new-user');
         const modalCompanyModules = document.getElementById('modal-company-modules');

         if (modalNewCompany) {
            modalNewCompany.addEventListener('hidden.bs.modal', resetFormCompany);
         }
         if (modalNewUser) {
            modalNewUser.addEventListener('hidden.bs.modal', function() {
               resetFormUser();
               // Limpa backdrop para evitar tela preta
               if (window.CompaniesManager && CompaniesManager.clearModalBackdrop) {
                  CompaniesManager.clearModalBackdrop();
               }
            });
         }
         if (modalCompanyModules) {
            modalCompanyModules.addEventListener('hidden.bs.modal', resetFormModules);
         }

         // Event listeners do modal de módulos
         const btnSaveModules = document.getElementById('btn-save-company-modules');
         const btnSelectAllModules = document.getElementById('btn-select-all-modules');
         const btnDeselectAllModules = document.getElementById('btn-deselect-all-modules');

         if (btnSaveModules) {
            btnSaveModules.addEventListener('click', saveCompanyModules);
         }

         if (btnSelectAllModules) {
            btnSelectAllModules.addEventListener('click', function() {
               const checkboxes = document.querySelectorAll('.module-checkbox');
               checkboxes.forEach(checkbox => {
                  if (!checkbox.checked) {
                     checkbox.checked = true;
                     checkbox.dispatchEvent(new Event('change'));
                  }
               });
            });
         }

         if (btnDeselectAllModules) {
            btnDeselectAllModules.addEventListener('click', function() {
               const checkboxes = document.querySelectorAll('.module-checkbox');
               checkboxes.forEach(checkbox => {
                  if (checkbox.checked) {
                     checkbox.checked = false;
                     checkbox.dispatchEvent(new Event('change'));
                  }
               });
            });
         }

         // Adiciona listener para limpar backdrop em caso de problema
         document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-backdrop')) {
               if (window.CompaniesManager && CompaniesManager.clearModalBackdrop) {
                  CompaniesManager.clearModalBackdrop();
               }
            }
         });

         // Listener para ESC key
         document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
               if (window.CompaniesManager && CompaniesManager.clearModalBackdrop) {
                  CompaniesManager.clearModalBackdrop();
               }
            }
         });

         // Listener para botões de cancelar dos modais
         document.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-secondary') && e.target.textContent.includes('Cancelar')) {
               setTimeout(() => {
                  if (window.CompaniesManager && CompaniesManager.clearModalBackdrop) {
                     CompaniesManager.clearModalBackdrop();
                  }
               }, 100);
            }
         });

      }, 1000);
   }

   // Função para criar e exibir um toast de erro
   function showErrorToast(message) {
      // Obtém o container de toasts
      const toastContainer = document.querySelector('.toast-container');

      // Cria um ID único para o toast
      const toastId = 'toast-' + Date.now();

      // Cria o HTML do toast com largura maior para mensagens longas
      const toastHTML = `
         <div id="${toastId}" class="toast colored-toast bg-danger text-fixed-white fade" role="alert" aria-live="assertive" aria-atomic="true" style="max-width: 400px;">
            <div class="toast-header bg-danger text-fixed-white">
               <strong class="me-auto">Erro</strong>
               <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
               ${message || 'Erro ao fazer login'}
            </div>
         </div>
      `;

      // Adiciona o toast ao container
      toastContainer.insertAdjacentHTML('afterbegin', toastHTML);

      // Obtém a referência ao elemento do toast
      const toastElement = document.getElementById(toastId);

      // Inicializa o toast com o Bootstrap
      const toast = new bootstrap.Toast(toastElement, {
         delay: 8000, // Tempo aumentado para dar tempo de ler mensagens longas
         autohide: true
      });

      // Adiciona evento para remover o elemento do DOM após o toast ser escondido
      toastElement.addEventListener('hidden.bs.toast', function () {
         toastElement.remove();
      });

      // Exibe o toast
      toast.show();
   }

   // Função para criar e exibir um toast de erro
   function showSuccessToast(message) {
      // Obtém o container de toasts
      const toastContainer = document.querySelector('.toast-container');

      // Cria um ID único para o toast
      const toastId = 'toast-' + Date.now();

      // Cria o HTML do toast
      const toastHTML = `
         <div id="${toastId}" class="toast colored-toast bg-success text-fixed-white fade" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-success text-fixed-white">
               <strong class="me-auto">Sucesso</strong>
               <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
               ${message || 'Sucesso ao fazer login'}
            </div>
         </div>
      `;

      // Adiciona o toast ao container
      toastContainer.insertAdjacentHTML('afterbegin', toastHTML);

      // Obtém a referência ao elemento do toast
      const toastElement = document.getElementById(toastId);

      // Inicializa o toast com o Bootstrap
      const toast = new bootstrap.Toast(toastElement, {
         delay: 3000, // Tempo em ms que o toast ficará visível
         autohide: true
      });

      // Adiciona evento para remover o elemento do DOM após o toast ser escondido
      toastElement.addEventListener('hidden.bs.toast', function () {
         toastElement.remove();
      });

      // Exibe o toast
      toast.show();
   }

   init();

         // API pública
      return {
         // Propriedades de estado
         companies: companies,
         users: users,
         modules: modules,
         companySelected: companySelected,
         userSelected: userSelected,
         availableModules: availableModules,
         clientsChoices: window.clientsChoices,
         companyClientsChoices: window.companyClientsChoices,

         // Métodos
         loadInitialData: loadInitialData,
         editCompany: editCompany,
         toggleStatusCompany: toggleStatusCompany,
         viewCompanyModules: viewCompanyModules,
         manageCompanyModules: manageCompanyModules,
         editUser: editUser,
         unlockUser: unlockUser,
         toggleStatusUser: toggleStatusUser,
         showErrorToast: showErrorToast,
         showSuccessToast: showSuccessToast,
         clearModalBackdrop: clearModalBackdrop,
         searchClients: searchClients,
         initializeClientsSelect: initializeClientsSelect,
         loadUserClients: loadUserClients,
         updateUserClientsInLocalList: updateUserClientsInLocalList,
         searchCompanyClients: searchCompanyClients,
         initializeCompanyClientsSelect: initializeCompanyClientsSelect,
         loadCompanyClients: loadCompanyClients,
         updateCompanyClientsInLocalList: updateCompanyClientsInLocalList,
         validateAndCleanCompanyClients: validateAndCleanCompanyClients,
      };
})();

// Expõe globalmente
window.CompaniesManager = CompaniesManager;

/**
 * Gerenciador do FilePond para upload de imagens
 */
const FilePondManager = (function() {
   let filePondInstances = {};

   /**
    * Inicializa o FilePond
    */
   function initFilePond() {
      // Registra os plugins do FilePond
      FilePond.registerPlugin(
         FilePondPluginFileEncode,
         FilePondPluginFileValidateSize,
         FilePondPluginFileValidateType,
         FilePondPluginImagePreview,
         FilePondPluginImageResize
      );

      // Define configurações padrão
      FilePond.setOptions({
         labelIdle: '<i class="bi bi-cloud-upload me-2"></i>Arraste & solte ou clique para selecionar',
         labelFileWaitingForSize: 'Aguardando tamanho',
         labelFileSizeNotAvailable: 'Tamanho não disponível',
         labelFileLoading: 'Carregando',
         labelFileLoadError: 'Erro durante carregamento',
         labelFileProcessing: 'Enviando',
         labelFileProcessingComplete: 'Envio finalizado',
         labelFileProcessingAborted: 'Envio cancelado',
         labelFileProcessingError: 'Erro durante envio',
         labelFileProcessingRevertError: 'Erro durante reversão',
         labelFileRemoveError: 'Erro durante remoção',
         labelTapToCancel: 'toque para cancelar',
         labelTapToRetry: 'toque para tentar novamente',
         labelTapToUndo: 'toque para desfazer',
         labelButtonRemoveItem: 'Remover',
         labelButtonAbortItemLoad: 'Abortar',
         labelButtonRetryItemLoad: 'Tentar novamente',
         labelButtonAbortItemProcessing: 'Cancelar',
         labelButtonUndoItemProcessing: 'Desfazer',
         labelButtonRetryItemProcessing: 'Tentar novamente',
         labelButtonProcessItem: 'Enviar',
         allowMultiple: false,
         maxFiles: 1,
         maxFileSize: '5MB',
         acceptedFileTypes: ['image/*'],
         imagePreviewHeight: 120,
         imageCropAspectRatio: null,
         imageResizeTargetWidth: null,
         imageResizeTargetHeight: null,
         stylePanelLayout: 'compact',
         styleLoadIndicatorPosition: 'center bottom',
         styleProgressIndicatorPosition: 'right bottom',
         styleButtonRemoveItemPosition: 'left bottom',
         styleButtonProcessItemPosition: 'right bottom',
      });

      // Inicializa cada input FilePond
      const filePondInputs = document.querySelectorAll('.filepond');
      filePondInputs.forEach(input => {
         const inputId = input.id;
         const config = FILE_VALIDATION_CONFIG[inputId];

         const pond = FilePond.create(input, {
            // Configurações de validação
            maxFileSize: config ? config.maxSize : '5MB',
            acceptedFileTypes: ['image/*'],

            // Configurações de imagem
            imageResizeTargetWidth: config ? config.maxWidth : null,
            imageResizeTargetHeight: config ? config.maxHeight : null,

            // Label personalizado com informações de dimensões
            labelIdle: config ?
               `<i class="bi bi-cloud-upload me-2"></i>Arraste & solte ou clique para selecionar<br><small class="text-muted">Máx: ${config.maxWidth}x${config.maxHeight}px, ${Math.round(config.maxSize / 1024 / 1024)}MB</small>` :
               '<i class="bi bi-cloud-upload me-2"></i>Arraste & solte ou clique para selecionar',

            // Configurações de servidor
            server: {
               process: null, // Processamento será manual
            },

            // Labels personalizados
            labelFileProcessingError: config ? `${config.label}: Erro de validação` : 'Erro de validação',
            labelFileTypeNotAllowed: config ? `${config.label}: Tipo de arquivo não permitido` : 'Tipo de arquivo não permitido',
            labelFileSizeNotAllowed: config ? `${config.label}: Arquivo muito grande` : 'Arquivo muito grande',
         });

         // Adiciona evento para validação de dimensões após o arquivo ser adicionado
         pond.on('addfile', (error, file) => {
            if (error) {
               console.log('❌ Erro ao adicionar arquivo:', error);
               return;
            }

            if (file && config) {
               // Valida dimensões da imagem
               const img = new Image();
               const url = URL.createObjectURL(file.file);

               img.onload = function() {
                  URL.revokeObjectURL(url);

                  const width = this.width;
                  const height = this.height;

                  if (width > config.maxWidth || height > config.maxHeight) {
                     const errorMsg = `${config.label}: Dimensões inválidas (máx ${config.maxWidth}x${config.maxHeight}px, atual ${width}x${height}px)`;
                     console.error('❌', errorMsg);

                     // Remove o arquivo e mostra erro
                     pond.removeFile(file);

                     // Mostra toast de erro usando a função do CompaniesManager
                     CompaniesManager.showErrorToast(errorMsg);
                  }
               };

               img.onerror = function() {
                  URL.revokeObjectURL(url);
                  console.error(`❌ ${config.label}: Erro ao carregar imagem`);
               };

               img.src = url;
            }
         });

         filePondInstances[input.id] = pond;
      });
   }

   /**
    * Mostra preview da imagem existente
    */
   function showExistingImagePreview(inputId, imageUrl) {
      if (!imageUrl) return;

      const container = document.getElementById(inputId)?.parentElement;
      if (!container) return;

      // Remove preview anterior se existir
      const existingPreview = container.querySelector('.existing-image-preview');
      if (existingPreview) {
         existingPreview.remove();
      }

      // Cria container flex para layout lado a lado
      const flexContainer = document.createElement('div');
      flexContainer.className = 'existing-image-preview';

      // Cria elemento de preview (à esquerda)
      const previewDiv = document.createElement('div');
      previewDiv.className = 'card';
      previewDiv.style.cssText = 'cursor: pointer; flex-shrink: 0; width: 180px;';
      previewDiv.onclick = () => window.open(imageUrl, '_blank');
      previewDiv.title = 'Clique para visualizar';
      previewDiv.innerHTML = `
         <img src="${imageUrl}" class="card-img-top" style="height: 90px; object-fit: cover;" alt="Imagem atual">
         <div class="card-body">
            <small class="text-muted">
               <i class="bi bi-eye me-1"></i>Imagem atual
            </small>
         </div>
      `;

      // Move o FilePond para dentro do container flex (à direita)
      const filePondElement = container.querySelector('.filepond--root');
      if (filePondElement) {
         filePondElement.remove();
         flexContainer.appendChild(filePondElement);
      }

      // Adiciona o preview ao container flex (primeiro, para ficar à esquerda)
      flexContainer.insertBefore(previewDiv, flexContainer.firstChild);

      // Adiciona o container flex ao container original
      container.appendChild(flexContainer);
   }

   /**
    * Aplica layout para nova empresa (mais espaçado)
    */
   function applyNewCompanyLayout() {
      const containers = document.querySelectorAll('.mb-3');
      containers.forEach(container => {
         const filePondInput = container.querySelector('.filepond');
         if (filePondInput) {
            // Adiciona classe para layout de nova empresa
            container.classList.add('new-company-layout');

            // Cria preview vazio para manter o layout consistente
            createEmptyPreview(container, filePondInput.id);
         }
      });
   }

   /**
    * Cria preview vazio para manter layout consistente
    */
   function createEmptyPreview(container, inputId) {
      // Remove preview anterior se existir
      const existingPreview = container.querySelector('.existing-image-preview');
      if (existingPreview) {
         existingPreview.remove();
      }

      // Cria container flex para layout lado a lado
      const flexContainer = document.createElement('div');
      flexContainer.className = 'existing-image-preview';

      // Cria elemento de preview vazio (à esquerda)
      const previewDiv = document.createElement('div');
      previewDiv.className = 'card empty-preview d-none';
      previewDiv.style.cssText = 'cursor: default; flex-shrink: 0; width: 180px;';
      previewDiv.innerHTML = `
         <div class="empty-image-placeholder" style="height: 90px; background-color: #f9fafb; border: 2px dashed #e5e7eb; display: flex; align-items: center; justify-content: center; border-radius: 12px 12px 0 0;">
            <i class="bi bi-image" style="font-size: 24px; color: #9ca3af;"></i>
         </div>
         <div class="card-body">
            <small class="text-muted">
               <i class="bi bi-plus-circle me-1"></i>Nenhuma imagem
            </small>
         </div>
      `;

      // Move o FilePond para dentro do container flex (à direita)
      const filePondElement = container.querySelector('.filepond--root');
      if (filePondElement) {
         filePondElement.remove();
         flexContainer.appendChild(filePondElement);
      }

      // Adiciona o preview ao container flex (primeiro, para ficar à esquerda)
      flexContainer.insertBefore(previewDiv, flexContainer.firstChild);

      // Adiciona o container flex ao container original
      container.appendChild(flexContainer);
   }

   /**
    * Obtém arquivo do FilePond
    */
   function getFile(inputId) {
      if (!filePondInstances[inputId]) return null;

      const files = filePondInstances[inputId].getFiles();
      if (files.length === 0) return null;

      return files[0].file;
   }

   /**
    * Limpa todos os FilePonds e previews
    */
   function clearAllFiles() {
      try {
         // Remove arquivos de todas as instâncias FilePond
         Object.values(filePondInstances).forEach(pond => {
            try {
               pond.removeFiles();
            } catch (error) {
               console.log('⚠️ Erro ao remover arquivos do FilePond:', error);
            }
         });

         // Remove apenas os previews de imagens existentes, mantendo os inputs
         document.querySelectorAll('.existing-image-preview').forEach(preview => {
            try {
               // Remove apenas o preview, não o container inteiro
               const filePondElement = preview.querySelector('.filepond--root');
               if (filePondElement) {
                  // Move o FilePond de volta para o container original
                  const originalContainer = filePondElement.closest('.mb-3');
                  if (originalContainer) {
                     originalContainer.appendChild(filePondElement);
                  }
               }
               preview.remove();
            } catch (error) {
               console.log('⚠️ Erro ao remover preview:', error);
               preview.remove();
            }
         });
      } catch (error) {
         console.error('❌ Erro ao limpar arquivos:', error);
      }
   }

   /**
    * Recria os inputs do FilePond quando necessário
    */
   function recreateFilePondInputs() {
      const filePondInputs = document.querySelectorAll('.filepond');
      filePondInputs.forEach(input => {
         try {
            // Remove instância anterior se existir
            if (filePondInstances[input.id]) {
               try {
                  filePondInstances[input.id].destroy();
               } catch (error) {
                  console.log('⚠️ Erro ao destruir instância FilePond:', error);
               }
               delete filePondInstances[input.id];
            }

            // Verifica se o elemento ainda existe no DOM
            if (!document.contains(input)) {
               console.log('⚠️ Elemento FilePond não está mais no DOM, pulando...');
               return;
            }

            // Cria nova instância
            const maxWidth = input.dataset.maxWidth;
            const maxHeight = input.dataset.maxHeight;

            const pond = FilePond.create(input, {
               imageResizeTargetWidth: maxWidth ? parseInt(maxWidth) : null,
               imageResizeTargetHeight: maxHeight ? parseInt(maxHeight) : null,
               server: {
                  process: null, // Processamento será manual
               }
            });

            filePondInstances[input.id] = pond;
         } catch (error) {
            console.error('❌ Erro ao recriar FilePond para', input.id, ':', error);
         }
      });
   }

   /**
    * Carrega imagens existentes da empresa
    */
   function loadCompanyImages(company) {
      const imageFields = {
         'company-background': company.background_url,
         'company-logo': company.logo_url,
         'company-logo-white': company.logo_white_url,
         'company-logo-dark': company.logo_dark_url,
         'company-logo-square': company.logo_square_url,
         'company-logo-square-white': company.logo_square_white_url,
         'company-logo-square-dark': company.logo_square_dark_url,
         'company-favicon': company.favicon_url
      };

      // Aguarda um pequeno delay para garantir que o FilePond foi recriado
      setTimeout(() => {
         Object.entries(imageFields).forEach(([inputId, imageUrl]) => {
            if (imageUrl) {
               showExistingImagePreview(inputId, imageUrl);
            }
         });
      }, 50);
   }

   /**
    * Carrega avatar existente do usuário
    */
   function loadUserAvatar(user) {
      if (user.profile_picture_url) {
         // Aguarda um pequeno delay para garantir que o FilePond foi recriado
         setTimeout(() => {
            showExistingImagePreview('user-avatar', user.profile_picture_url);
         }, 50);
      }
   }

   // Retorna métodos públicos
   return {
      init: initFilePond,
      showExistingImagePreview: showExistingImagePreview,
      getFile: getFile,
      clearAllFiles: clearAllFiles,
      loadCompanyImages: loadCompanyImages,
      loadUserAvatar: loadUserAvatar,
      applyNewCompanyLayout: applyNewCompanyLayout
   };
})();

// Expõe FilePondManager globalmente
window.FilePondManager = FilePondManager;

// Inicializa FilePond quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
   if (window.FilePondManager && typeof FilePondManager.init === 'function') {
      FilePondManager.init();
   } else {
      console.error('❌ FilePondManager não está disponível');
   }
});

   /**
    * Atualiza automaticamente o status de bloqueio dos usuários
    * Esta função é chamada periodicamente para verificar se algum bloqueio expirou
    */
   function updateLockStatus() {
      // Verifica se a variável users existe e é um array
      if (typeof users === 'undefined' || !Array.isArray(users)) {
         return;
      }

      // Verifica se a aba de usuários está ativa
      const usersTab = document.getElementById('usuarios-tab');
      const isUsersTabActive = usersTab && usersTab.classList.contains('active');

      if (!isUsersTabActive) {
         // Se a aba de usuários não está ativa, não precisa verificar
         return;
      }

      const tbody = document.querySelector('#tabelaUsuarios tbody');
      if (!tbody) return;

      const rows = tbody.querySelectorAll('tr');
      let hasChanges = false;

      rows.forEach(row => {
         const userUuid = row.querySelector('button[onclick*="editUser"]')?.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
         if (!userUuid) return;

         const user = users.find(u => u.uuid === userUuid);
         if (!user) return;

         const lockStatus = checkUserLockStatus(user);
         const currentLockStatus = row.classList.contains('table-warning');

         // Se o status mudou, atualiza a linha
         if (lockStatus.isLocked !== currentLockStatus) {
            hasChanges = true;
         }
      });

      // Se houve mudanças, recarrega a tabela
      if (hasChanges) {
         renderTableUsers();
      }
   }

   /**
    * Inicia o monitoramento automático do status de bloqueio
    */
   function startLockStatusMonitoring() {
      // Atualiza a cada 30 segundos
      setInterval(updateLockStatus, 30000);
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
                  <button type="button" class="btn btn-sm btn-outline-primary" onclick="CompaniesManager.editCompany('${company.uuid}')" title="Editar">
                     <i class="bi bi-pencil"></i>
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-info" onclick="CompaniesManager.viewCompanyModules('${company.uuid}')" title="Módulos">
                     <i class="bi bi-grid-3x3-gap"></i>
                  </button>
                  <button type="button" class="btn btn-sm ${company.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}" onclick="CompaniesManager.toggleStatusCompany('${company.uuid}')" title="${company.status === 'active' ? 'Inativar' : 'Ativar'}">
                     <i class="bi ${company.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}"></i>
                  </button>
               </div>
            </td>
         </tr>
      `).join('');
   }

   /**
    * Faz upload do avatar do usuário
    */
   async function uploadUserAvatar(userUuid) {
      try {
         if (!window.FilePondManager) {
            console.warn('FilePondManager não disponível');
            return;
         }

         const avatarFile = FilePondManager.getFile('user-avatar');
         if (!avatarFile) {
            console.log('Nenhum avatar para upload');
            return;
         }

         // Valida arquivo antes do upload
         const config = FILE_VALIDATION_CONFIG['user-avatar'];
         if (config) {
            const validationErrors = [];

            // Valida tamanho
            if (avatarFile.size > config.maxSize) {
               validationErrors.push(`Tamanho máximo: ${Math.round(config.maxSize / 1024 / 1024)}MB`);
            }

            // Valida tipo
            if (!avatarFile.type.startsWith('image/')) {
               validationErrors.push('Apenas arquivos de imagem são permitidos');
            }

            if (validationErrors.length > 0) {
               throw new Error('Erro de validação: ' + validationErrors.join(', '));
            }
         }

         const formData = new FormData();
         formData.append('avatar', avatarFile);

         // Para upload de arquivos, precisamos usar fetch diretamente com FormData
         const uploadResponse = await fetch(`${URL_BASE}/api/user/${userUuid}/upload-avatar`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
         });

         // Verifica se a resposta foi bem-sucedida
         if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            const errorMessage = errorData?.message || errorData?.error || `Erro ${uploadResponse.status}: ${uploadResponse.statusText}`;
            throw new Error(errorMessage);
         }

         const response = await uploadResponse.json();
         return response;

      } catch (error) {
         console.error('❌ Erro ao fazer upload do avatar:', error);
         throw error;
      }
   }

   /**
    * Salva usuário (criar ou editar)
    */
   async function saveUser() {
      try {
         const form = document.getElementById('form-new-user');
         if (!form) {
            showErrorToast('Formulário de usuário não encontrado');
            return;
         }

         if (!form.checkValidity()) {
            form.reportValidity();
            return;
         }

         const userUuid = document.getElementById('user-uuid')?.value;
         const userType = document.getElementById('user-type')?.value;
         const companyUuid = document.getElementById('user-company')?.value;
         const passwordField = document.getElementById('user-password');

         // Validações específicas
         if (!userType) {
            showErrorToast('Tipo de usuário é obrigatório');
            return;
         }

         if (userType !== 'superuser' && !companyUuid) {
            showErrorToast('Empresa é obrigatória para usuários admin e user');
            return;
         }

         // Coleta módulos selecionados
         const selectedModules = [];
         const moduleCheckboxes = document.querySelectorAll('#user-modules-list .module-checkbox:checked');
         moduleCheckboxes.forEach(checkbox => {
            selectedModules.push(parseInt(checkbox.value));
         });

         const formData = new FormData(form);
         const dados = {};

         // Converte FormData para objeto
         for (let [key, value] of formData.entries()) {
            if (key !== 'user-uuid' && typeof value === 'string' && value.trim() !== '') {
               dados[key] = value;
            }
         }

         // Remove senha vazia na edição
         if (userUuid && passwordField && (!passwordField.value || passwordField.value.trim() === '')) {
            delete dados['user-password'];
         }

         // Adiciona dados específicos
         dados.user_type = userType;
         if (companyUuid) {
            const company = companies.find(c => c.uuid === companyUuid);
            dados.company_id = company?.id;
         }
         dados.moduleIds = selectedModules;

         const method = userUuid ? 'PUT' : 'POST';
         const url = userUuid ? `/api/user/${userUuid}` : '/api/user';

         const response = await Thefetch(url, method, dados);

         if (response && response.success) {
            // Se há avatar para upload, faz o upload
            if (window.FilePondManager) {
               const avatarFile = FilePondManager.getFile('user-avatar');
               if (avatarFile) {
                  try {
                     // Para novos usuários, usa o UUID retornado na resposta
                     const targetUuid = userUuid || response.user?.uuid || response.data?.uuid;
                     if (targetUuid) {
                        await uploadUserAvatar(targetUuid);
                     }
                  } catch (avatarError) {
                     console.warn('⚠️ Erro ao fazer upload do avatar:', avatarError);
                     // Não falha o cadastro por causa do avatar
                  }
               }
            }

            // Se é usuário do tipo client, salva os clientes vinculados
            if (userType === 'client') {
               try {
                  const targetUuid = userUuid || response.user?.uuid || response.data?.uuid;
                  if (targetUuid && window.clientsChoices) {
                     const selectedClients = window.clientsChoices.getValue();

                     if (selectedClients && selectedClients.length > 0) {
                        const clientsData = selectedClients.map(client => ({
                           nocli: client.value,
                           nomcli: client.customProperties?.name || client.label.split(' - ')[0],
                           cgccli: client.customProperties?.cnpj || client.label.split(' - ')[1]
                        }));

                        // Valida e limpa clientes removidos do Firebird
                        const validatedClients = await validateAndCleanUserClients(targetUuid, clientsData);

                        const clientsResponse = await Thefetch('/api/user/clients', 'POST', {
                           userUuid: targetUuid,
                           clients: validatedClients
                        });

                        if (clientsResponse && clientsResponse.success) {
                           // Atualiza a lista local com os clientes salvos
                           await updateUserClientsInLocalList(targetUuid, clientsResponse.data.currentClients);
                        } else {
                           console.warn('⚠️ Erro ao salvar clientes do usuário:', clientsResponse?.message);
                        }
                     } else {
                        // Se não há clientes selecionados, desativa todos os clientes existentes
                        await validateAndCleanUserClients(targetUuid, []);
                     }
                  }
               } catch (clientsError) {
                  console.warn('⚠️ Erro ao salvar clientes do usuário:', clientsError);
                  // Não falha o cadastro por causa dos clientes
               }
            }

            showSuccessToast(
               userUuid ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!',
               'success'
            );

            // Fecha modal
            const modalElement = document.getElementById('modal-new-user');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
               modal.hide();
            }

            // Recarrega dados
            await loadUsers();

         } else {
            throw new Error(response?.message || 'Erro ao salvar usuário');
         }

      } catch (error) {
         console.error('❌ Erro ao salvar usuário:', error);
         showErrorToast('Erro ao salvar usuário: ' + error.message);
      }
   }

   /**
    * Busca clientes na API
    */
   async function searchClients(searchTerm) {
      try {
         console.log('🔍 searchClients chamada com:', searchTerm);

         if (!searchTerm || searchTerm.length < 3) {
            console.log('🔍 Termo muito curto, retornando array vazio');
            return [];
         }

         // Obtém o UUID da empresa selecionada ou da empresa do usuário sendo editado
         let companyUuid = null;

         // Se estamos editando um usuário, usa a empresa dele
         if (window.CompaniesManager.userSelected && window.CompaniesManager.userSelected.user_type === 'client' && window.CompaniesManager.userSelected.company_name) {
            console.log('🔍 Usando empresa do usuário sendo editado:', window.CompaniesManager.userSelected.company_name);
            const company = window.CompaniesManager.companies.find(c => c.name === window.CompaniesManager.userSelected.company_name);
            if (company) {
               companyUuid = company.uuid;
               console.log('🔍 UUID da empresa encontrado:', companyUuid);
            }
         }

         // Se não encontrou a empresa do usuário, usa a empresa selecionada no formulário
         if (!companyUuid) {
            const companySelect = document.getElementById('user-company');
            companyUuid = companySelect ? companySelect.value : null;
            console.log('🔍 Usando empresa do select:', companyUuid);
         }

         if (!companyUuid) {
            console.warn('⚠️ Nenhuma empresa selecionada para busca de clientes');
            return [];
         }

         const url = `/api/clients/search?search=${encodeURIComponent(searchTerm)}&companyUuid=${encodeURIComponent(companyUuid)}`;
         console.log('🔍 Fazendo requisição para:', url);

         const response = await Thefetch(url, 'GET');
         console.log('🔍 Resposta da API:', response);

         if (response && response.success && response.data) {
            const clients = response.data.map(client => {

               // Verifica se os campos existem e usa fallbacks
               const clientId = client.id || client.NOCLI || client.client_id;
               const clientName = client.name || client.NOMCLI || client.client_name;
               const clientCnpj = client.cnpj || client.CGCCLI || client.client_cnpj;

               return {
                  value: clientId,
                  label: `${clientName} - ${clientCnpj}`,
                  customProperties: {
                     name: clientName,
                     cnpj: clientCnpj
                  }
               };
            });

            // Se estamos editando um usuário, adiciona os clientes já vinculados que não foram encontrados na busca
            if (window.CompaniesManager.userSelected && window.CompaniesManager.userSelected.user_type === 'client') {
               const userClients = await loadUserClients(window.CompaniesManager.userSelected.uuid);
               const foundClientIds = clients.map(c => c.value);

               // Adiciona clientes vinculados que não foram encontrados na busca atual
               userClients.forEach(userClient => {
                  if (!foundClientIds.includes(userClient.value)) {
                     clients.push({
                        ...userClient,
                        selected: true // Marca como selecionado pois já está vinculado
                     });
                  }
               });
            }

            return clients;
         }

         return [];
      } catch (error) {
         console.error('❌ Erro ao buscar clientes:', error);
         return [];
      }
   }

   /**
    * Inicializa o Choices.js para seleção de clientes
    */
   async function initializeClientsSelect() {
      const clientsSelect = document.getElementById('user-clients');
      if (!clientsSelect) {
         console.error('❌ Elemento user-clients não encontrado');
         throw new Error('Elemento user-clients não encontrado');
      }

      // Verifica se Choices está disponível
      if (typeof Choices === 'undefined') {
         console.error('❌ Biblioteca Choices não está disponível');
         throw new Error('Biblioteca Choices não está disponível');
      }

      // Destroi instância anterior se existir
      if (window.clientsChoices) {
         window.clientsChoices.destroy();
         window.clientsChoices = null;
      }

      try {
         window.clientsChoices = new Choices(clientsSelect, {
            removeItemButton: true,
            searchEnabled: true,
            searchPlaceholderValue: 'Digite pelo menos 3 caracteres para buscar...',
            noResultsText: 'Nenhum cliente encontrado',
            noChoicesText: 'Digite pelo menos 3 caracteres para buscar',
            itemSelectText: 'Clique para selecionar',
            maxItemCount: -1,
            placeholder: true,
            placeholderValue: 'Selecione os clientes...',
            searchResultLimit: 20,
            renderChoiceLimit: 20,
            shouldSort: false
         });

         // Adiciona listener para busca após a inicialização
         const input = window.clientsChoices.input.element;
         if (input) {
            let searchTimeout;

            input.addEventListener('input', async function(e) {
               const searchTerm = e.target.value;
               console.log('🔍 Digitação detectada:', searchTerm);

               clearTimeout(searchTimeout);

               if (searchTerm.length >= 3) {
                  console.log('🔍 Buscando clientes para:', searchTerm);
                  searchTimeout = setTimeout(async () => {
                     try {
                        console.log('🔍 Fazendo requisição para buscar clientes...');
                        const clients = await searchClients(searchTerm);
                        console.log('🔍 Clientes encontrados:', clients);

                        // Limpa escolhas atuais mas preserva os selecionados
                        if (window.clientsChoices) {
                           const selectedValues = window.clientsChoices.getValue(true).map(item => item.value);
                           window.clientsChoices.clearChoices();

                           // Adiciona novas escolhas
                           window.clientsChoices.setChoices(clients, 'value', 'label', true);

                           // Re-aplica as seleções anteriores
                           setTimeout(() => {
                              selectedValues.forEach(value => {
                                 window.clientsChoices.setChoiceByValue(value);
                              });
                           }, 50);
                        }
                     } catch (error) {
                        console.error('❌ Erro ao carregar clientes:', error);
                     }
                  }, 300);
               } else {
                  console.log('🔍 Termo muito curto, limpando escolhas');
                  if (window.clientsChoices) {
                     // Preserva os selecionados ao limpar
                     const selectedValues = window.clientsChoices.getValue(true).map(item => item.value);
                     window.clientsChoices.clearChoices();

                     // Re-aplica as seleções
                     setTimeout(() => {
                        selectedValues.forEach(value => {
                           window.clientsChoices.setChoiceByValue(value);
                        });
                     }, 50);
                  }
               }
            });
         } else {
            console.error('❌ Input do Choices não encontrado');
         }

         return window.clientsChoices;

      } catch (error) {
         console.error('❌ Erro ao inicializar Choices:', error);
         throw error;
      }
   }

   /**
    * Carrega clientes do usuário para edição
    */
   async function loadUserClients(userUuid) {
      try {
         // Primeiro, busca o usuário na lista atual
         const user = window.CompaniesManager.users.find(u => u.uuid === userUuid);

         if (user && user.user_type === 'client') {
            let userClients = [];

            // Sempre busca no backend para garantir dados atualizados
            try {
               const response = await Thefetch(`/api/user/${userUuid}/clients`, 'GET');
               if (response && response.success && response.data) {
                  userClients = response.data.map(client => ({
                     value: client.client_id,
                     label: `${client.client_name} - ${client.client_cnpj}`,
                     selected: true,
                     customProperties: {
                        name: client.client_name,
                        cnpj: client.client_cnpj
                     }
                  }));

                  // Atualiza a lista local com os dados mais recentes
                  const userIndex = window.CompaniesManager.users.findIndex(u => u.uuid === userUuid);
                  if (userIndex !== -1) {
                     window.CompaniesManager.users[userIndex].clients = response.data;
                  }
               }
            } catch (backendError) {
               console.warn('⚠️ Erro ao buscar clientes do backend:', backendError);

               // Fallback: usa clientes da lista local se disponível
               if (user.clients && user.clients.length > 0) {
                  userClients = user.clients.map(client => ({
                     value: client.client_id,
                     label: `${client.client_name} - ${client.client_cnpj}`,
                     selected: true,
                     customProperties: {
                        name: client.client_name,
                        cnpj: client.client_cnpj
                     }
                  }));
               }
            }

            return userClients;
         }

         return [];
      } catch (error) {
         console.error('❌ Erro ao carregar clientes do usuário:', error);
         return [];
      }
   }

   /**
    * Atualiza a lista local de usuários com os clientes atualizados
    */
   async function updateUserClientsInLocalList(userUuid, currentClients) {
      try {
         // Encontra o usuário na lista local
         const userIndex = window.CompaniesManager.users.findIndex(u => u.uuid === userUuid);

         if (userIndex !== -1) {
            // Atualiza os clientes do usuário
            window.CompaniesManager.users[userIndex].clients = currentClients;

            // Re-renderiza a tabela para mostrar as mudanças
            renderTableUsers();

         }
      } catch (error) {
         console.error('❌ Erro ao atualizar lista local:', error);
      }
   }

   /**
    * Máscara para CNPJ
    */
   function applyCnpjMask(input) {
      input.addEventListener('input', function(e) {
         let value = e.target.value.replace(/\D/g, '');

         if (value.length <= 14) {
            value = value.replace(/^(\d{2})(\d)/, '$1.$2');
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
         }

         e.target.value = value;
      });
   }


   /**
    * Verifica se os clientes ainda existem no Firebird e desativa os removidos
    */
   async function validateAndCleanUserClients(userUuid, selectedClients) {
      try {
         console.log('�� Validando clientes do usuário:', userUuid);

         // Se não há clientes selecionados, desativa todos os clientes existentes
         if (!selectedClients || selectedClients.length === 0) {
            console.log('🔍 Nenhum cliente selecionado, desativando todos os clientes existentes');

            const response = await Thefetch('/api/user/clients/deactivate-all', 'POST', {
               userUuid: userUuid
            });

            if (response && response.success) {
               console.log('✅ Todos os clientes foram desativados com sucesso');
               return [];
            } else {
               console.warn('⚠️ Erro ao desativar todos os clientes:', response?.message);
               return [];
            }
         }

         // Busca todos os clientes vinculados ao usuário
         const response = await Thefetch(`/api/user/${userUuid}/clients`, 'GET');
         if (!response || !response.success || !response.data) {
            console.warn('⚠️ Não foi possível buscar clientes do usuário para validação');
            return selectedClients;
         }

         const currentUserClients = response.data;
         const selectedClientIds = selectedClients.map(c => c.nocli);
         const clientsToDeactivate = [];

         // Identifica clientes que foram removidos da seleção
         currentUserClients.forEach(userClient => {
            if (!selectedClientIds.includes(userClient.client_id)) {
               clientsToDeactivate.push({
                  nocli: userClient.client_id,
                  nomcli: userClient.client_name,
                  cgccli: userClient.client_cnpj
               });
            }
         });

         // Se há clientes para desativar, faz a requisição para desativá-los
         if (clientsToDeactivate.length > 0) {
            console.log('�� Desativando clientes removidos:', clientsToDeactivate);

            // Envia apenas os clientes selecionados (os que devem permanecer ativos)
            const deactivateResponse = await Thefetch('/api/user/clients', 'POST', {
               userUuid: userUuid,
               clients: selectedClients
            });

            if (deactivateResponse && deactivateResponse.success) {
               console.log('✅ Clientes desativados com sucesso');
            } else {
               console.warn('⚠️ Erro ao desativar clientes:', deactivateResponse?.message);
            }
         }

         return selectedClients;
      } catch (error) {
         console.error('❌ Erro ao validar clientes do usuário:', error);
         return selectedClients;
      }
   }

   /**
    * Busca clientes para empresas na API
    */
   async function searchCompanyClients(searchTerm) {
      try {

         if (!searchTerm || searchTerm.length < 3) {
            return [];
         }

         // Obtém o UUID da empresa sendo editada
         let companyUuid = null;

         // Se estamos editando uma empresa, usa o UUID dela
         if (window.CompaniesManager.companySelected) {
            companyUuid = window.CompaniesManager.companySelected.uuid;
         }

         if (!companyUuid) {
            console.warn('⚠️ Nenhuma empresa selecionada para busca de clientes');
            return [];
         }

         const url = `/api/company/clients/search?search=${encodeURIComponent(searchTerm)}&companyUuid=${encodeURIComponent(companyUuid)}`;

         const response = await Thefetch(url, 'GET');

         if (response && response.success && response.data) {
            const clients = response.data.map(client => {
               return {
                  value: client.id,
                  label: `${client.name} - ${client.cnpj}`,
                  customProperties: {
                     name: client.name,
                     cnpj: client.cnpj
                  }
               };
            });

            // Se estamos editando uma empresa, adiciona os clientes já vinculados
            if (window.CompaniesManager.companySelected) {
               const companyClients = await loadCompanyClients(window.CompaniesManager.companySelected.uuid);
               const foundClientIds = clients.map(c => c.value);

               // Adiciona clientes vinculados que não foram encontrados na busca atual
               companyClients.forEach(companyClient => {
                  if (!foundClientIds.includes(companyClient.value)) {
                     clients.push({
                        ...companyClient,
                        selected: true // Marca como selecionado pois já está vinculado
                     });
                  }
               });
            }

            return clients;
         }

         return [];
      } catch (error) {
         console.error('❌ Erro ao buscar clientes:', error);
         return [];
      }
   }

   /**
    * Inicializa o Choices.js para seleção de clientes de empresas
    */
   async function initializeCompanyClientsSelect() {
      const clientsSelect = document.getElementById('company-clients');
      if (!clientsSelect) {
         console.error('❌ Elemento company-clients não encontrado');
         throw new Error('Elemento company-clients não encontrado');
      }

      // Verifica se Choices está disponível
      if (typeof Choices === 'undefined') {
         console.error('❌ Biblioteca Choices não está disponível');
         throw new Error('Biblioteca Choices não está disponível');
      }

      // Destroi instância anterior se existir
      if (window.companyClientsChoices) {
         window.companyClientsChoices.destroy();
         window.companyClientsChoices = null;
      }

      try {
         window.companyClientsChoices = new Choices(clientsSelect, {
            removeItemButton: true,
            searchEnabled: true,
            searchPlaceholderValue: 'Digite pelo menos 3 caracteres para buscar...',
            noResultsText: 'Nenhum cliente encontrado',
            noChoicesText: 'Digite pelo menos 3 caracteres para buscar',
            itemSelectText: 'Clique para selecionar',
            maxItemCount: -1,
            placeholder: true,
            placeholderValue: 'Selecione os clientes...',
            searchResultLimit: 20,
            renderChoiceLimit: 20,
            shouldSort: false
         });

         // Adiciona listener para busca após a inicialização
         const input = window.companyClientsChoices.input.element;
         if (input) {
            let searchTimeout;

            input.addEventListener('input', async function(e) {
               const searchTerm = e.target.value;

               clearTimeout(searchTimeout);

               if (searchTerm.length >= 3) {
                  searchTimeout = setTimeout(async () => {
                     try {
                        const clients = await searchCompanyClients(searchTerm);

                        // Limpa escolhas atuais
                        if (window.companyClientsChoices) {
                           window.companyClientsChoices.clearChoices();
                           // Adiciona novas escolhas
                           window.companyClientsChoices.setChoices(clients, 'value', 'label', true);
                        }
                     } catch (error) {
                        console.error('❌ Erro ao carregar clientes:', error);
                     }
                  }, 300);
               } else {
                  if (window.companyClientsChoices) {
                     window.companyClientsChoices.clearChoices();
                  }
               }
            });
         } else {
            console.error('❌ Input do Choices não encontrado');
         }

         return window.companyClientsChoices;

      } catch (error) {
         console.error('❌ Erro ao inicializar Choices:', error);
         throw error;
      }
   }

   /**
    * Carrega clientes da empresa para edição
    */
   async function loadCompanyClients(companyUuid) {
      try {
         // Primeiro, busca a empresa na lista atual
         const company = window.CompaniesManager.companies.find(c => c.uuid === companyUuid);

         if (company) {
            let companyClients = [];

            // Sempre busca no backend para garantir dados atualizados
            try {
               const response = await Thefetch(`/api/company/${companyUuid}/clients`, 'GET');
               if (response && response.success && response.data) {
                  companyClients = response.data.map(client => ({
                     value: client.client_id,
                     label: `${client.client_name} - ${client.client_cnpj}`,
                     selected: true,
                     customProperties: {
                        name: client.client_name,
                        cnpj: client.client_cnpj
                     }
                  }));

                  // Atualiza a lista local com os dados mais recentes
                  const companyIndex = window.CompaniesManager.companies.findIndex(c => c.uuid === companyUuid);
                  if (companyIndex !== -1) {
                     window.CompaniesManager.companies[companyIndex].clients = response.data;
                  }
               }
            } catch (backendError) {
               console.warn('⚠️ Erro ao buscar clientes do backend:', backendError);

               // Fallback: usa clientes da lista local se disponível
               if (company.clients && company.clients.length > 0) {
                  companyClients = company.clients.map(client => ({
                     value: client.client_id,
                     label: `${client.client_name} - ${client.client_cnpj}`,
                     selected: true,
                     customProperties: {
                        name: client.client_name,
                        cnpj: client.client_cnpj
                     }
                  }));
               }
            }

            return companyClients;
         }

         return [];
      } catch (error) {
         console.error('❌ Erro ao carregar clientes da empresa:', error);
         return [];
      }
   }

   /**
    * Atualiza a lista local de empresas com os clientes atualizados
    */
   async function updateCompanyClientsInLocalList(companyUuid, currentClients) {
      try {
         // Encontra a empresa na lista local
         const companyIndex = window.CompaniesManager.companies.findIndex(c => c.uuid === companyUuid);

         if (companyIndex !== -1) {
            // Atualiza os clientes da empresa
            window.CompaniesManager.companies[companyIndex].clients = currentClients;

            // Re-renderiza a tabela para mostrar as mudanças
            renderTableCompanies();
         }
      } catch (error) {
         console.error('❌ Erro ao atualizar lista local:', error);
      }
   }

   /**
    * Valida e limpa clientes da empresa
    */
   async function validateAndCleanCompanyClients(companyUuid, selectedClients) {
      try {
         // Busca todos os clientes vinculados à empresa
         const response = await Thefetch(`/api/company/${companyUuid}/clients`, 'GET');
         if (!response || !response.success || !response.data) {
            console.warn('⚠️ Não foi possível buscar clientes da empresa para validação');
            return selectedClients;
         }

         const currentCompanyClients = response.data;
         const selectedClientIds = selectedClients.map(c => c.nocli);
         const clientsToDeactivate = [];

         // Identifica clientes que foram removidos do Firebird
         currentCompanyClients.forEach(companyClient => {
            if (!selectedClientIds.includes(companyClient.client_id)) {
               clientsToDeactivate.push({
                  nocli: companyClient.client_id,
                  nomcli: companyClient.client_name,
                  cgccli: companyClient.client_cnpj
               });
            }
         });

         // Remove clientes que não existem mais no Firebird
         const validClients = selectedClients.filter(client => {
            const existsInFirebird = currentCompanyClients.some(
               cc => cc.client_id === client.nocli
            );
            return existsInFirebird;
         });

         return validClients;
      } catch (error) {
         console.error('❌ Erro ao validar clientes da empresa:', error);
         return selectedClients;
      }
   }
