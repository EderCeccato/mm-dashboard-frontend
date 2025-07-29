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
   }
};

// Configurações para tipos de usuário
const CONFIG = {
   TIPOS_USUARIO: {
      'superuser': { label: 'Super Usuário', badge: 'bg-danger' },
      'admin': { label: 'Administrador', badge: 'bg-warning' },
      'user': { label: 'Usuário', badge: 'bg-info' }
   },
   TIPOS_MODULO: {
      'superuser': { label: 'Super Usuário', badge: 'bg-danger' },
      'admin': { label: 'Administrador', badge: 'bg-warning' },
      'user': { label: 'Usuário', badge: 'bg-info' }
   }
};

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
      // Continua inicialização
      bindEvents();
      loadInitialData();
   }

   /**
    * Carrega dados iniciais
   */
   async function loadInitialData() {
      try {
         console.log('🚀 Iniciando carregamento de dados...');
         await Promise.all([
            loadCompanies(),
            loadUsers(),
            loadModules()
         ]);
         console.log('✅ Dados iniciais carregados com sucesso');
      } catch (error) {
         console.error('❌ Erro ao carregar dados iniciais:', error);
      }
   }

   /**
      * Carrega lista de empresas
   */
   async function loadCompanies() {
      try {
         console.log('🏢 Carregando lista de empresas...');
         const response = await Thefetch('/api/company', 'GET');

         if (response && response.success && response.data) {
            companies = response.data;
            console.log('✅ Empresas carregadas:', companies.length);
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
         console.log('👥 Carregando lista de usuários...');
         const response = await Thefetch('/api/user', 'GET');

         if (response && response.success && response.data) {
            users = response.data;
            console.log('✅ Usuários carregados:', users.length);
            console.log('📋 Dados dos usuários:', users);
            renderTableUsers();
         } else {
            console.error('❌ Erro ao carregar usuários:', response);
         }
      } catch (error) {
         console.error('❌ Erro ao carregar usuários:', error);
      }
   }

   /**
      * Carrega módulos disponíveis
   */
   async function loadModules() {
      try {
         console.log('📦 Carregando lista de módulos...');
         const response = await Thefetch('/api/modules', 'GET');

         if (response && response.success && response.data) {
            availableModules = response.data;
            console.log('✅ Módulos carregados:', availableModules.length);
         } else {
            console.error('❌ Erro ao carregar módulos:', response);
         }
      } catch (error) {
         console.error('❌ Erro ao carregar módulos:', error);
      }
   }

   /**
    * Renderiza tabela de usuários
    */
   function renderTableUsers() {
      const tbody = document.querySelector('#tabelaUsuarios tbody');
      if (!tbody) {
         console.error('❌ Tabela de usuários não encontrada');
         console.log('🔍 Procurando por elementos:', {
            'tabelaUsuarios': document.getElementById('tabelaUsuarios'),
            'tbody': document.querySelector('#tabelaUsuarios tbody'),
            'tabelaUsuarios_exists': !!document.getElementById('tabelaUsuarios')
         });
         return;
      }

      console.log('🎨 Renderizando tabela de usuários:', users.length, 'usuários');

      // Aplica filtros
      let filteredUsers = [...users];

      const companyFilter = document.getElementById('filtroEmpresa')?.value;
      const userTypeFilter = document.getElementById('filtroTipoUsuario')?.value;

      console.log('🔍 Filtros aplicados:', {
         companyFilter,
         userTypeFilter,
         totalUsers: users.length
      });

      if (companyFilter && companyFilter !== '') {
         filteredUsers = filteredUsers.filter(user => user.company_name === companies.find(c => c.uuid === companyFilter)?.name);
      }

      if (userTypeFilter && userTypeFilter !== '') {
         filteredUsers = filteredUsers.filter(user => user.user_type === userTypeFilter);
      }

      console.log('🔍 Usuários filtrados:', filteredUsers.length);

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
         console.log('👤 Dados do usuário:', {
            name: user.name,
            email: user.email,
            picture: user.profile_picture_url,
            hasPicture: !!user.profile_picture_url
         });

         return `
         <tr>
            <td>
               <div class="d-flex align-items-center">
                  ${user.profile_picture_url
                     ? `<img src="${user.profile_picture_url}" alt="Avatar" class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                     : `<div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; font-weight: bold;">
                          ${user.name.charAt(0).toUpperCase()}
                        </div>`
                  }
                  <div>
                     <div class="fw-semibold">${user.name}</div>
                     <small class="text-muted">${user.email}</small>
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
                  <button type="button" class="btn btn-sm btn-outline-warning" onclick="CompaniesManager.unlockUser('${user.uuid}')" title="Desbloquear Sessão">
                     <i class="bi bi-unlock"></i>
                  </button>
                  <button type="button" class="btn btn-sm ${user.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="CompaniesManager.toggleStatusUser('${user.uuid}')" title="${user.status === 'active' ? 'Inativar' : 'Ativar'}">
                     <i class="bi ${user.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}"></i>
                  </button>
               </div>
            </td>
         </tr>
      `}).join('');

      console.log('✅ Tabela de usuários renderizada com sucesso');
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
      console.log('🏢 Populando select de empresas...');

      // Popula select de filtro
      const companyFilter = document.getElementById('filtroEmpresa');
      if (companyFilter) {
         companyFilter.innerHTML = '<option value="">Todas as empresas</option>';
         companies.forEach(company => {
            companyFilter.innerHTML += `<option value="${company.uuid}">${company.name}</option>`;
         });
         console.log('✅ Select de filtro populado:', companies.length, 'empresas');
      }

      // Popula select do modal de usuário
      const userCompanySelect = document.getElementById('user-company');
      if (userCompanySelect) {
         userCompanySelect.innerHTML = '<option value="">Selecione uma empresa</option>';
         companies.forEach(company => {
            userCompanySelect.innerHTML += `<option value="${company.uuid}">${company.name}</option>`;
         });
         console.log('✅ Select do modal de usuário populado:', companies.length, 'empresas');
      }
   }

   /**
    * Carrega módulos disponíveis para uma empresa
    */
   async function loadCompanyModules(companyUuid) {
      try {
         console.log('🔍 Carregando módulos da empresa:', companyUuid);
         const response = await Thefetch(`/api/company/${companyUuid}/modules`, 'GET');

         if (response && response.success && response.data && response.data.modules) {
            console.log('✅ Módulos carregados com sucesso:', response.data.modules);
            return response.data.modules;
         }

         console.log('⚠️ Nenhum módulo encontrado para a empresa:', companyUuid);
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
         console.log('🔍 Carregando todos os módulos do sistema...');

         // Adiciona timeout de 10 segundos
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 10000);

         const response = await Thefetch('/api/modules', 'GET', null, { signal: controller.signal });
         clearTimeout(timeoutId);

         if (response && response.success && response.data) {
            availableModules = response.data;
            console.log('✅ Todos os módulos carregados:', response.data);
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

      if (!modulesContainer) {
         console.error('❌ Container de módulos do usuário não encontrado');
         console.log('🔍 Elementos relacionados:', {
            'user-modules-list': document.getElementById('user-modules-list'),
            'modules-selection-section': document.getElementById('modules-selection-section'),
            'user-modules-loading': document.getElementById('user-modules-loading'),
            'no-user-modules': document.getElementById('no-user-modules')
         });
         return;
      }

      // Esconde o loading
      if (modulesLoading) {
         modulesLoading.style.display = 'none';
         console.log('✅ Loading de módulos ocultado');
      }

      console.log('🎨 Renderizando módulos:', {
         total: modules?.length || 0,
         selected: selectedModules?.length || 0,
         modules: modules,
         containerExists: !!modulesContainer,
         containerDisplay: modulesContainer.style.display
      });

      if (!modules || modules.length === 0) {
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
      const modulesSection = document.getElementById('modules-selection-section');
      if (modulesSection) {
         modulesSection.style.display = 'block';
         console.log('✅ Seção de módulos exibida');
      }

      // Mostra o container de lista de módulos
      modulesContainer.style.display = 'block';
      console.log('✅ Container de módulos exibido');

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

      console.log('✅ HTML dos módulos gerado:', modulesHtml.length, 'caracteres');

      // Adiciona event listeners para os checkboxes
      const checkboxes = modulesContainer.querySelectorAll('.module-checkbox');
      console.log('✅ Checkboxes encontrados:', checkboxes.length);

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

      console.log('✅ Módulos renderizados com sucesso:', modules.length);
   }

   /**
    * Handler para mudança no tipo de usuário
    */
   async function onUserTypeChange() {
      const userType = document.getElementById('user-type');
      const companySelect = document.getElementById('user-company');
      const modulesContainer = document.getElementById('user-modules-list');
      const companyGroup = document.getElementById('company-selection-section');

      // Verifica se os elementos existem antes de usar
      if (!userType) return;

      const userTypeValue = userType.value;
      console.log('👤 Tipo de usuário alterado para:', userTypeValue);

      // Limpa módulos
      if (modulesContainer) {
         modulesContainer.innerHTML = '';
         modulesContainer.style.display = 'none';
      }

      // Configura visibilidade do campo empresa
      if (companyGroup && companySelect) {
         if (userTypeValue === 'superuser') {
            companyGroup.style.display = 'none';
            companySelect.value = '';
            console.log('👑 Superuser selecionado - empresa não necessária');
         } else {
            companyGroup.style.display = 'block';
            console.log('🏢 Usuário admin/user - empresa necessária');
         }
      }

      // Carrega módulos apropriados
      if (userTypeValue === 'superuser') {
         // Para superuser, carrega todos os módulos de superuser
         console.log('🔍 Carregando módulos de superuser...');
         try {
            const allModules = await loadAllModules();
            console.log('📦 Todos os módulos carregados:', allModules);
            const superuserModules = allModules.filter(module => module.module_type === 'superuser');
            console.log('👑 Módulos de superuser disponíveis:', superuserModules);
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
      } else if (userTypeValue && companySelect && companySelect.value) {
         // Para admin/user, carrega módulos da empresa selecionada
         console.log('🔍 Carregando módulos da empresa selecionada...');
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

      console.log('🏢 Empresa alterada:', {
         userType: userTypeValue,
         companyUuid: companyUuid
      });

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

         console.log('✅ Módulos disponíveis para empresa:', availableModules);
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
            console.log('🔒 Senha removida da edição (campo vazio)');
         }

         // Adiciona dados específicos
         dados.user_type = userType;
         if (companyUuid) {
            const company = companies.find(c => c.uuid === companyUuid);
            dados.company_id = company?.id;
            console.log('🏢 Empresa selecionada:', {
               uuid: companyUuid,
               id: company?.id,
               name: company?.name
            });
         }
         dados.moduleIds = selectedModules;

         // LOGS DETALHADOS PARA MONITORAMENTO
         console.log('📋 === DADOS DO USUÁRIO ===');
         console.log('🆔 UUID do usuário (edição):', userUuid || 'NOVO USUÁRIO');
         console.log('👤 Tipo de usuário:', userType);
         console.log('🏢 UUID da empresa:', companyUuid);
         console.log('🏢 ID da empresa:', dados.company_id);
         console.log('📦 Módulos selecionados:', selectedModules);
         console.log('📝 Dados do formulário:', dados);
         console.log('📊 Dados completos a serem enviados:', {
            ...dados,
            method: userUuid ? 'PUT' : 'POST',
            url: userUuid ? `/api/user/${userUuid}` : '/api/user'
         });

         const method = userUuid ? 'PUT' : 'POST';
         const url = userUuid ? `/api/user/${userUuid}` : '/api/user';

         console.log('🚀 Enviando requisição:', {
            method,
            url,
            dados
         });

         const response = await Thefetch(url, method, dados);

         console.log('📥 Resposta do servidor:', response);

         if (response && response.success) {
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

      console.log('✏️ Editando usuário:', user);

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
               console.log('✅ Nome do usuário re-definido após primeira verificação:', user.name);
            }
         }, 50);

         // Terceira tentativa após um delay maior
         setTimeout(() => {
            if (nameField.value !== user.name) {
               nameField.value = user.name;
               nameField.dispatchEvent(new Event('input', { bubbles: true }));
               console.log('✅ Nome do usuário re-definido após segunda verificação:', user.name);
            }
         }, 200);

         console.log('✅ Nome do usuário preenchido:', user.name);
      }
      if (emailField) {
         emailField.value = user.email;
         console.log('✅ Email do usuário preenchido:', user.email);
      }
      if (typeField) {
         typeField.value = user.user_type;
         console.log('✅ Tipo de usuário preenchido:', user.user_type);
      }
      if (statusField) statusField.value = user.status;

      // Configura senha (opcional na edição)
      if (passwordField) {
         passwordField.value = ''; // Limpa senha na edição
         passwordField.removeAttribute('required');
         passwordField.placeholder = 'Deixe em branco para manter a senha atual';
         console.log('✅ Campo de senha configurado como opcional');
      }

      // Remove asterisco do label da senha na edição
      if (passwordLabel) {
         passwordLabel.textContent = 'Senha';
         console.log('✅ Asterisco removido do label da senha');
      }

      // Configura empresa
      if (companySelect && companyGroup) {
         if (user.user_type === 'superuser') {
            companyGroup.style.display = 'none';
            companySelect.value = '';
            console.log('👑 Superuser - empresa ocultada');
         } else {
            companyGroup.style.display = 'block';
            const company = companies.find(c => c.name === user.company_name);
            if (company) {
               companySelect.value = company.uuid;
               console.log('🏢 Empresa selecionada:', company.name);
            }
         }
      }

      // Esconde o loading desnecessário
      const modulesLoading = document.getElementById('user-modules-loading');
      if (modulesLoading) {
         modulesLoading.style.display = 'none';
         console.log('✅ Loading de módulos ocultado');
      }

      // Carrega módulos do usuário
      await loadUserModules(user);

      // Abre modal
      const modalElement = document.getElementById('modal-new-user');
      if (modalElement) {
         const modal = new bootstrap.Modal(modalElement);

         // Adiciona listener para quando o modal estiver completamente aberto
         modalElement.addEventListener('shown.bs.modal', function onModalShown() {
            // Re-preenche o nome para garantir que seja exibido
            const nameField = document.getElementById('user-name-input');
            console.log('🔍 Campo de nome encontrado:', !!nameField);
            if (nameField) {
               console.log('🔍 Valor atual do campo:', nameField.value);
               console.log('🔍 Valor esperado:', user.name);
            }

            if (nameField && user.name) {
               nameField.value = user.name;
               nameField.dispatchEvent(new Event('input', { bubbles: true }));
               nameField.dispatchEvent(new Event('change', { bubbles: true }));
               console.log('✅ Nome do usuário preenchido após modal aberto:', user.name);
               console.log('🔍 Valor final do campo:', nameField.value);
            }
            // Remove o listener para evitar duplicação
            modalElement.removeEventListener('shown.bs.modal', onModalShown);
         }, { once: true });

         modal.show();
         console.log('✅ Modal de edição aberto');
      }
   }

   /**
    * Carrega módulos do usuário para edição
    */
   async function loadUserModules(user) {
      try {
         console.log('🔍 Carregando módulos do usuário para edição:', user);

         let availableModules = [];
         let selectedModules = [];

         // Extrai módulos já selecionados do usuário
         if (user.modules) {
            console.log('📦 Módulos do usuário:', user.modules);

            // Se modules é uma string (lista separada por vírgula), vamos extrair os nomes
            if (typeof user.modules === 'string') {
               const moduleNames = user.modules.split(',').map(name => name.trim());
               console.log('📝 Nomes dos módulos extraídos:', moduleNames);

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
            console.log('👑 Carregando módulos de superuser para edição...');
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
            console.log('🏢 Carregando módulos da empresa para edição...');
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

         console.log('✅ Módulos disponíveis para edição:', availableModules);
         console.log('✅ Módulos selecionados para edição:', selectedModules);

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

      console.log('🔓 Tentando desbloquear usuário:', {
         uuid: userUuid,
         name: user.name,
         email: user.email
      });

      const confirmation = await Swal.fire({
         title: 'Confirmar Desbloqueio',
         text: `Tem certeza que deseja desbloquear a sessão do usuário "${user.name}"?`,
         icon: 'question',
         showCancelButton: true,
         confirmButtonColor: '#28a745',
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
         console.log('🚀 Enviando requisição de desbloqueio:', {
            url: `/api/auth/users/${userUuid}/unlock`,
            method: 'PATCH'
         });

         const response = await Thefetch(`/api/auth/users/${userUuid}/unlock`, 'PATCH');

         console.log('📥 Resposta do servidor (desbloqueio):', response);

         if (response && response.success) {
            console.log('✅ Usuário desbloqueado com sucesso');
            showSuccessToast('Sessão do usuário desbloqueada com sucesso!');
         } else {
            throw new Error(response?.message || 'Erro ao desbloquear sessão');
         }

      } catch (error) {
         console.error('❌ Erro ao desbloquear sessão:', error);
         showErrorToast('Erro ao desbloquear sessão: ' + error.message);
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

      console.log('🔄 Tentando alterar status do usuário:', {
         uuid: userUuid,
         name: user.name,
         email: user.email,
         currentStatus: user.status,
         newStatus: newStatus,
         action: action
      });

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

         console.log('📋 Dados para atualização de status:', dadosUpdate);

         const response = await Thefetch(`/api/user/${userUuid}`, 'PUT', dadosUpdate);

         console.log('📥 Resposta do servidor (status):', response);

         if (response && response.success) {
            console.log('✅ Status do usuário alterado com sucesso');
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
      const form = document.getElementById('form-new-user');
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
      const modulesContainer = document.getElementById('user-modules-list');
      const modulesLoading = document.getElementById('user-modules-loading');

      if (form) form.reset();
      if (userUuidField) userUuidField.value = '';
      if (titleField) titleField.textContent = 'Cadastrar Novo Usuário';
      if (textField) textField.textContent = 'Salvar Usuário';
      if (nameField) nameField.value = '';
      if (emailField) emailField.value = '';
      if (passwordField) {
         passwordField.value = '';
         passwordField.setAttribute('required', 'required');
         passwordField.placeholder = 'Digite a senha';
         console.log('✅ Campo de senha configurado como obrigatório');
      }
      if (passwordLabel) {
         passwordLabel.textContent = 'Senha *';
         console.log('✅ Asterisco restaurado no label da senha');
      }
      if (typeField) typeField.value = '';
      if (statusField) statusField.value = 'active';
      if (companySelect) companySelect.value = '';
      if (companyGroup) companyGroup.style.display = 'block';
      if (modulesContainer) {
         modulesContainer.innerHTML = '';
         modulesContainer.style.display = 'none';
      }
      if (modulesLoading) {
         modulesLoading.style.display = 'block';
         console.log('✅ Loading de módulos restaurado');
      }

      userSelected = null;
      console.log('✅ Formulário de usuário resetado');
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
         const uploadResponse = await fetch(`http://localhost:3301/api/company/${companyUuid}/upload-images`, {
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
   function editCompany(companyUuid) {
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
      const companySelected = null;

      // Remove classes de layout específicas
      document.querySelectorAll('.new-company-layout').forEach(el => {
         el.classList.remove('new-company-layout');
      });

      // Limpa apenas o conteúdo dos FilePonds, mantendo os inputs
      if (window.FilePondManager) {
         FilePondManager.clearAllFiles();
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
         console.log('🔍 Carregando módulos da empresa:', companyUuid);
         const response = await Thefetch(`/api/company/${companyUuid}/modules`, 'GET');

         if (response && response.success && response.data && response.data.modules) {
            console.log('✅ Módulos carregados com sucesso:', response.data.modules);
            return response.data.modules;
         }

         console.log('⚠️ Nenhum módulo encontrado para a empresa:', companyUuid);
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
               console.log('👥 Aba de usuários clicada - recarregando dados...');
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
               console.log('🏢 Filtro de empresa alterado:', this.value);
               renderTableUsers();
            });
         }
         if (userTypeFilter) {
            userTypeFilter.addEventListener('change', function() {
               console.log('👤 Filtro de tipo de usuário alterado:', this.value);
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
            modalNewUser.addEventListener('hidden.bs.modal', resetFormUser);
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
               clearModalBackdrop();
            }
         });

         // Listener para ESC key
         document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
               clearModalBackdrop();
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
                  } else {
                     console.log(`✅ ${config.label}: Dimensões válidas (${width}x${height}px)`);
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
      Object.values(filePondInstances).forEach(pond => {
         pond.removeFiles();
      });

      // Remove apenas os previews de imagens existentes, mantendo os inputs
      document.querySelectorAll('.existing-image-preview').forEach(preview => {
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
      });
   }

   /**
    * Recria os inputs do FilePond quando necessário
    */
   function recreateFilePondInputs() {
      const filePondInputs = document.querySelectorAll('.filepond');
      filePondInputs.forEach(input => {
         // Verifica se já existe uma instância do FilePond para este input
         if (!filePondInstances[input.id]) {
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

      Object.entries(imageFields).forEach(([inputId, imageUrl]) => {
         if (imageUrl) {
            showExistingImagePreview(inputId, imageUrl);
         }
      });
   }

   // Retorna métodos públicos
   return {
      init: initFilePond,
      showExistingImagePreview: showExistingImagePreview,
      getFile: getFile,
      clearAllFiles: clearAllFiles,
      loadCompanyImages: loadCompanyImages,
      recreateFilePondInputs: recreateFilePondInputs,
      applyNewCompanyLayout: applyNewCompanyLayout
   };
})();

// Expõe FilePondManager globalmente
window.FilePondManager = FilePondManager;

// Inicializa FilePond quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
   FilePondManager.init();
});
