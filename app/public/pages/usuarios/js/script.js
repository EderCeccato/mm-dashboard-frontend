// Configurações globais para validação de arquivos
const FILE_VALIDATION_CONFIG = {
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
      'admin': { label: 'Administrador', badge: 'bg-admin' },
      'user': { label: 'Usuário', badge: 'bg-user' },
      'client': { label: 'Cliente', badge: 'bg-client' }
   },
   TIPOS_MODULO: {
      'admin': { label: 'Administrador', badge: 'bg-admin' },
      'user': { label: 'Usuário', badge: 'bg-user' }
   }
};

const URL_BASE = 'http://localhost:3301';

const UsersManager = (function() {
   'use strict';

   // Estado global
   let users = [];
   let ownCompany = null;
   let modules = [];
   let userSelected = null;
   let clientsChoices = null;

   /**
    * Inicializa o sistema
    */
   function init() {
      // Verifica se a função Thefetch está disponível
      if (typeof Thefetch !== 'function') {
         console.error('❌ Função Thefetch não encontrada. Aguardando...');
         setTimeout(() => {
            if (typeof Thefetch === 'function') {
               console.log('✅ Função Thefetch encontrada. Inicializando...');
               bindEvents();
               loadInitialData();
            } else {
               console.error('❌ Função Thefetch ainda não encontrada após delay');
            }
         }, 1000);
         return;
      }

      bindEvents();
      loadInitialData();
   }

   /**
    * Carrega dados iniciais
    */
   async function loadInitialData() {
      try {
         await Promise.all([
            loadUsers(),
            loadOwnCompany(),
            loadModules()
         ]);

         // Verifica se os dados foram carregados com sucesso
         if (users && Array.isArray(users) && users.length > 0) {
            setTimeout(() => {
               startLockStatusMonitoring();
            }, 2000);
         }

      } catch (error) {
         console.error('❌ Erro ao carregar dados iniciais:', error);
      }
   }

   /**
    * Carrega lista de usuários da própria empresa
    */
   async function loadUsers() {
      try {
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
            users = [];
         }
      } catch (error) {
         console.error('❌ Erro ao carregar usuários:', error);
         users = [];
      }
   }

   /**
    * Carrega dados da própria empresa
    */
   async function loadOwnCompany() {
      try {
         if (typeof Thefetch !== 'function') {
            console.error('❌ Função Thefetch não encontrada');
            return;
         }

         const response = await Thefetch('/api/company/own', 'GET');

         if (response && response.success && response.data) {
            ownCompany = response.data.company;
            populateCompanySelect();
         } else {
            console.error('❌ Erro ao carregar dados da empresa:', response);
         }
      } catch (error) {
         console.error('❌ Erro ao carregar dados da empresa:', error);
      }
   }

   /**
    * Carrega módulos disponíveis (não utilizado mais)
    */
   async function loadModules() {
      // Esta função não é mais utilizada, mas mantida para compatibilidade
      modules = [];
   }

   /**
    * Popula select de empresas (apenas com a própria empresa)
    */
   function populateCompanySelect() {
      const companySelect = document.getElementById('user-company');
      if (companySelect && ownCompany) {
         companySelect.innerHTML = `<option value="${ownCompany.uuid}">${ownCompany.name}</option>`;
      }
   }

   /**
    * Verifica se o usuário está bloqueado baseado no campo locked_until
    */
   function checkUserLockStatus(user) {
      if (!user.locked_until) {
         return { isLocked: false, lockInfo: null };
      }

      const lockDate = new Date(user.locked_until);
      const now = new Date();

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
      const tbody = document.querySelector('#table-users tbody');
      if (!tbody) {
         console.error('❌ Tabela de usuários não encontrada');
         return;
      }

      // Aplica filtros
      let filteredUsers = [...users];

      const userTypeFilter = document.getElementById('filtroTipoUsuario')?.value;
      const statusFilter = document.getElementById('filtroStatus')?.value;
      const searchFilter = document.getElementById('pesquisaUsuario')?.value?.toLowerCase();

      if (userTypeFilter && userTypeFilter !== '') {
         filteredUsers = filteredUsers.filter(user => user.user_type === userTypeFilter);
      }

      if (statusFilter && statusFilter !== '') {
         filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
      }

      if (searchFilter && searchFilter.trim() !== '') {
         filteredUsers = filteredUsers.filter(user =>
            user.name.toLowerCase().includes(searchFilter) ||
            user.email.toLowerCase().includes(searchFilter)
         );
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

         // Processa lista de clientes para usuários tipo client
         let clientsDisplay = '-';
         if (user.user_type === 'client' && user.clients && user.clients.length > 0) {
            if (user.clients.length <= 3) {
               clientsDisplay = user.clients.map(client =>
                  `<span class="client-item">${client.client_name}</span>`
               ).join(' ');
            } else {
               const firstThree = user.clients.slice(0, 3);
               const remaining = user.clients.length - 3;
               clientsDisplay = firstThree.map(client =>
                  `<span class="client-item">${client.client_name}</span>`
               ).join(' ') + `<div class="clients-count">+${remaining} mais</div>`;
            }
         }

         return `
         <tr class="${lockStatus.isLocked ? 'table-warning' : ''}">
            <td>
               <div class="d-flex align-items-center">
                  ${user.profile_picture_url
                     ? `<img src="${user.profile_picture_url}" alt="Avatar" class="user-avatar me-3" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
                     : ''
                  }
                  <div class="user-avatar-placeholder me-3" style="${user.profile_picture_url ? 'display: none;' : 'display: flex;'}">
                     ${user.name.charAt(0).toUpperCase()}
                  </div>
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
               <div class="clients-list">
                  ${clientsDisplay}
               </div>
            </td>
            <td class="text-center">
               <div class="btn-group" role="group">
                  <button type="button" class="btn btn-sm btn-outline-primary" onclick="UsersManager.editUser('${user.uuid}')" title="Editar">
                     <i class="bi bi-pencil"></i>
                  </button>
                  ${lockStatus.isLocked
                     ? `<button type="button" class="btn btn-sm btn-outline-warning" onclick="UsersManager.unlockUser('${user.uuid}')" title="Desbloquear Usuário (${lockStatus.lockInfo})">
                          <i class="bi bi-unlock-fill"></i>
                        </button>`
                     : `<button type="button" class="btn btn-sm btn-outline-secondary" onclick="UsersManager.unlockUser('${user.uuid}')" title="Desbloquear Sessão" disabled>
                          <i class="bi bi-unlock"></i>
                        </button>`
                  }
                  <button type="button" class="btn btn-sm ${user.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="UsersManager.toggleStatusUser('${user.uuid}')" title="${user.status === 'active' ? 'Inativar' : 'Ativar'}">
                     <i class="bi ${user.status === 'active' ? 'bi-pause-circle' : 'bi-play-circle'}"></i>
                  </button>
               </div>
            </td>
         </tr>
      `}).join('');
   }

   /**
    * Busca clientes na API
    */
   async function searchClients(searchTerm) {
      try {
         if (!searchTerm || searchTerm.length < 3) {
            return [];
         }

         const response = await Thefetch(`/api/clients/search?search=${encodeURIComponent(searchTerm)}`, 'GET');

         if (response && response.success && response.data) {
            return response.data.map(client => ({
               value: client.id,
               label: `${client.name} - ${client.cnpj}`,
               customProperties: {
                  name: client.name,
                  cnpj: client.cnpj
               }
            }));
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
   function initializeClientsSelect() {
      const clientsSelect = document.getElementById('user-clients');
      if (!clientsSelect) return;

      // Destroi instância anterior se existir
      if (clientsChoices) {
         clientsChoices.destroy();
         clientsChoices = null;
      }

      clientsChoices = new Choices(clientsSelect, {
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
         shouldSort: false,
         callbackOnInit: function() {
            const input = this.input.element;
            let searchTimeout;

            input.addEventListener('input', async function(e) {
               const searchTerm = e.target.value;

               clearTimeout(searchTimeout);

               if (searchTerm.length >= 3) {
                  searchTimeout = setTimeout(async () => {
                     try {
                        const clients = await searchClients(searchTerm);

                        // Limpa escolhas atuais
                        clientsChoices.clearChoices();

                        // Adiciona novas escolhas
                        clientsChoices.setChoices(clients, 'value', 'label', true);
                     } catch (error) {
                        console.error('❌ Erro ao carregar clientes:', error);
                     }
                  }, 300);
               } else {
                  clientsChoices.clearChoices();
               }
            });
         }
      });

      return clientsChoices;
   }

   /**
    * Carrega clientes do usuário para edição
    */
   async function loadUserClients(userUuid) {
      try {
         const response = await Thefetch(`/api/user/${userUuid}/clients`, 'GET');

         if (response && response.success && response.data) {
            return response.data.map(client => ({
               value: client.client_id,
               label: `${client.client_name} - ${client.client_cnpj}`,
               selected: true,
               customProperties: {
                  name: client.client_name,
                  cnpj: client.client_cnpj
               }
            }));
         }

         return [];
      } catch (error) {
         console.error('❌ Erro ao carregar clientes do usuário:', error);
         return [];
      }
   }

   /**
    * Handler para mudança no tipo de usuário
    */
   async function onUserTypeChange() {
      const userType = document.getElementById('user-type');
      const companySection = document.getElementById('company-selection-section');
      const modulesSection = document.getElementById('modules-selection-section');
      const clientsSection = document.getElementById('clients-selection-section');
      const companySelect = document.getElementById('user-company');

      if (!userType) return;

      const userTypeValue = userType.value;

      // Reset de seções
      if (companySection) companySection.style.display = 'none';
      if (modulesSection) modulesSection.style.display = 'none';
      if (clientsSection) clientsSection.style.display = 'none';

      // Configura visibilidade baseada no tipo
      if (userTypeValue === 'admin' || userTypeValue === 'user') {
         if (companySection) companySection.style.display = 'block';
         if (modulesSection) modulesSection.style.display = 'block';

         // Carrega módulos se empresa estiver selecionada
         if (companySelect && companySelect.value) {
            await loadUserModules(userTypeValue, companySelect.value);
         }
      } else if (userTypeValue === 'client') {
         if (companySection) companySection.style.display = 'block';
         if (clientsSection) clientsSection.style.display = 'block';

         // Inicializa seletor de clientes
         initializeClientsSelect();
      }
   }

   /**
    * Handler para mudança na empresa
    */
   async function onCompanyChange() {
      const userType = document.getElementById('user-type');
      const companySelect = document.getElementById('user-company');

      if (!userType || !companySelect) return;

      const userTypeValue = userType.value;
      const companyUuid = companySelect.value;

      if ((userTypeValue === 'admin' || userTypeValue === 'user') && companyUuid) {
         await loadUserModules(userTypeValue, companyUuid);
      }
   }

   /**
    * Carrega módulos do usuário
    */
   async function loadUserModules(userType, companyUuid, selectedModules = []) {
      try {
         // Usa os módulos da própria empresa que já foram carregados
         if (ownCompany && ownCompany.modules) {
            const companyModules = ownCompany.modules;

            // Filtra módulos baseado no tipo de usuário
            let availableModules = [];

            if (userType === 'admin') {
               availableModules = companyModules.filter(module =>
                  module.module_type === 'admin' || module.module_type === 'user'
               );
            } else if (userType === 'user') {
               availableModules = companyModules.filter(module =>
                  module.module_type === 'user'
               );
            }

            renderUserModules(availableModules, selectedModules);
         } else {
            // Se não há módulos disponíveis, mostra mensagem
            renderUserModules([], selectedModules);
         }
      } catch (error) {
         console.error('❌ Erro ao carregar módulos:', error);
         renderUserModules([], selectedModules);
      }
   }

   /**
    * Renderiza módulos disponíveis no modal de usuário
    */
   function renderUserModules(modules, selectedModules = []) {
      const modulesContainer = document.getElementById('user-modules-list');
      const modulesLoading = document.getElementById('user-modules-loading');
      const modulesSection = document.getElementById('modules-selection-section');

      if (!modulesContainer) return;

      // Esconde o loading
      if (modulesLoading) modulesLoading.style.display = 'none';

      if (!modules || modules.length === 0) {
         modulesContainer.innerHTML = `
            <div class="text-center text-muted py-3">
               <i class="bi bi-grid-3x3-gap fs-1 d-block mb-2"></i>
               <p>Nenhum módulo disponível</p>
            </div>
         `;
         if (modulesSection) modulesSection.style.display = 'block';
         return;
      }

      // Mostra a seção de módulos
      if (modulesSection) modulesSection.style.display = 'block';
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

      modulesContainer.innerHTML = `<div class="row">${modulesHtml}</div>`;

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

      // Mostra controles de seleção
      const modulesControls = document.getElementById('user-modules-controls');
      if (modulesControls) modulesControls.style.display = 'block';
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
            showErrorToast('Empresa é obrigatória para usuários admin, user e client');
            return;
         }

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
            const company = ownCompany; // Usar ownCompany para a própria empresa
            dados.company_id = company?.id;
         }

         // Coleta módulos selecionados (para admin e user)
         if (userType === 'admin' || userType === 'user') {
            const selectedModules = [];
            const moduleCheckboxes = document.querySelectorAll('#user-modules-list .module-checkbox:checked');
            moduleCheckboxes.forEach(checkbox => {
               selectedModules.push(parseInt(checkbox.value));
            });
            dados.moduleIds = selectedModules;
         }

         // Coleta clientes selecionados (para client)
         if (userType === 'client' && clientsChoices) {
            const selectedClients = clientsChoices.getValue(true);
            dados.clientIds = selectedClients;
         }

         const method = userUuid ? 'PUT' : 'POST';
         const url = userUuid ? `/api/user/${userUuid}` : '/api/user';

         const response = await Thefetch(url, method, dados);

         if (response && response.success) {
            // Se há avatar para upload, faz o upload
            if (window.FilePondManager) {
               const avatarFile = FilePondManager.getFile('user-avatar');
               if (avatarFile) {
                  try {
                     const targetUuid = userUuid || response.user?.uuid || response.data?.uuid;
                     if (targetUuid) {
                        await uploadUserAvatar(targetUuid);
                     }
                  } catch (avatarError) {
                     console.warn('⚠️ Erro ao fazer upload do avatar:', avatarError);
                  }
               }
            }

            showSuccessToast(
               userUuid ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!'
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
    * Upload do avatar do usuário
    */
   async function uploadUserAvatar(userUuid) {
      try {
         if (!window.FilePondManager) {
            console.warn('FilePondManager não disponível');
            return;
         }

         const avatarFile = FilePondManager.getFile('user-avatar');
         if (!avatarFile) return;

         const formData = new FormData();
         formData.append('avatar', avatarFile);

         const uploadResponse = await fetch(`${URL_BASE}/api/user/${userUuid}/upload-avatar`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
         });

         if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData?.message || 'Erro no upload do avatar');
         }

         const response = await uploadResponse.json();
         if (response && response.success) {
            console.log('✅ Avatar enviado com sucesso');
         }

      } catch (error) {
         console.error('❌ Erro ao fazer upload do avatar:', error);
         throw error;
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
      const statusSection = document.getElementById('user-status-section');

      // Preenche campos básicos
      if (userUuidField) userUuidField.value = user.uuid;
      if (titleField) titleField.textContent = 'Editar Usuário';
      if (textField) textField.textContent = 'Atualizar Usuário';
      if (nameField) nameField.value = user.name;
      if (emailField) emailField.value = user.email;
      if (typeField) typeField.value = user.user_type;
      if (statusField) statusField.value = user.status;

      // Configura senha (opcional na edição)
      if (passwordField) {
         passwordField.value = '';
         passwordField.removeAttribute('required');
         passwordField.placeholder = 'Deixe em branco para manter a senha atual';
      }
      if (passwordLabel) {
         passwordLabel.textContent = 'Senha';
      }

      // Mostra seção de status na edição
      if (statusSection) statusSection.style.display = 'block';

      // Configura empresa
      if (companySelect && user.company_name) {
         const company = ownCompany; // Usar ownCompany para a própria empresa
         if (company) {
            companySelect.value = company.uuid;
         }
      }

      // Configura campos baseado no tipo de usuário
      await onUserTypeChange();

      // Carrega dados específicos do tipo
      if (user.user_type === 'client') {
         // Carrega clientes do usuário
         const userClients = await loadUserClients(user.uuid);
         if (clientsChoices && userClients.length > 0) {
            clientsChoices.setChoices(userClients, 'value', 'label', true);
         }
      } else if ((user.user_type === 'admin' || user.user_type === 'user') && companySelect.value) {
         // Carrega módulos do usuário
         const selectedModules = []; // Aqui você pode extrair os módulos do usuário se disponível
         await loadUserModules(user.user_type, companySelect.value, selectedModules);
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
         modal.show();
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

      if (!confirmation.isConfirmed) return;

      try {
         const response = await Thefetch(`/api/auth/users/${userUuid}/unlock`, 'PATCH');

         if (response && response.success) {
            showSuccessToast('Usuário desbloqueado com sucesso!');
            await loadUsers();
         } else {
            throw new Error(response?.message || 'Erro no desbloqueio');
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

      if (!confirmation.isConfirmed) return;

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
    * Abre modal para editar empresa atual
    */
   async function editCompany() {
      if (!ownCompany) {
         showErrorToast('Dados da empresa não disponíveis');
         return;
      }

      // Preenche formulário com dados da empresa
      const companyNameField = document.getElementById('company-name');
      const companyCnpjField = document.getElementById('company-cnpj');
      const companyUrlField = document.getElementById('company-url');
      const companyStatusField = document.getElementById('company-status');
      const companyColorField = document.getElementById('company-color');
      const companyFirebirdHostField = document.getElementById('company-firebird-host');
      const companyFirebirdPortField = document.getElementById('company-firebird-port');
      const companyFirebirdDatabaseField = document.getElementById('company-firebird-database');
      const companyFirebirdUserField = document.getElementById('company-firebird-user');
      const companyFirebirdPasswordField = document.getElementById('company-firebird-password');

      if (companyNameField) companyNameField.value = ownCompany.name || '';
      if (companyCnpjField) companyCnpjField.value = ownCompany.cnpj || '';
      if (companyUrlField) companyUrlField.value = ownCompany.url || '';
      if (companyStatusField) companyStatusField.value = ownCompany.status || 'active';
      if (companyColorField) companyColorField.value = ownCompany.color || '';
      if (companyFirebirdHostField) companyFirebirdHostField.value = ownCompany.firebird_host || '';
      if (companyFirebirdPortField) companyFirebirdPortField.value = ownCompany.firebird_port || '';
      if (companyFirebirdDatabaseField) companyFirebirdDatabaseField.value = ownCompany.firebird_database || '';
      if (companyFirebirdUserField) companyFirebirdUserField.value = ownCompany.firebird_user || '';
      if (companyFirebirdPasswordField) companyFirebirdPasswordField.value = ownCompany.firebird_password || '';

      // Abre modal
      const modalElement = document.getElementById('modal-edit-company');
      if (modalElement) {
         const modal = new bootstrap.Modal(modalElement);
         modal.show();
      }
   }

   /**
    * Salva dados da empresa
    */
   async function saveCompany() {
      try {
         const form = document.getElementById('form-edit-company');
         if (!form) {
            showErrorToast('Formulário de empresa não encontrado');
            return;
         }

         if (!form.checkValidity()) {
            form.reportValidity();
            return;
         }

         const formData = new FormData(form);
         const dados = {};

         // Converte FormData para objeto
         for (let [key, value] of formData.entries()) {
            if (typeof value === 'string' && value.trim() !== '') {
               dados[key] = value;
            }
         }

         const response = await Thefetch('/api/company/own', 'PUT', dados);

         if (response && response.success) {
            showSuccessToast('Dados da empresa atualizados com sucesso!');

            // Atualiza dados locais
            await loadOwnCompany();

            // Fecha modal
            const modalElement = document.getElementById('modal-edit-company');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
               modal.hide();
            }

         } else {
            throw new Error(response?.message || 'Erro ao atualizar empresa');
         }

      } catch (error) {
         console.error('❌ Erro ao salvar empresa:', error);
         showErrorToast('Erro ao salvar empresa: ' + error.message);
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
      const passwordField = document.getElementById('user-password');
      const passwordLabel = document.querySelector('label[for="user-password"]');
      const statusSection = document.getElementById('user-status-section');
      const companySection = document.getElementById('company-selection-section');
      const modulesSection = document.getElementById('modules-selection-section');
      const clientsSection = document.getElementById('clients-selection-section');

      if (form) form.reset();
      if (userUuidField) userUuidField.value = '';
      if (titleField) titleField.textContent = 'Cadastrar Novo Usuário';
      if (textField) textField.textContent = 'Salvar Usuário';

      if (passwordField) {
         passwordField.setAttribute('required', 'required');
         passwordField.placeholder = 'Digite a senha';
      }
      if (passwordLabel) {
         passwordLabel.textContent = 'Senha *';
      }

      // Esconde seções específicas
      if (statusSection) statusSection.style.display = 'none';
      if (companySection) companySection.style.display = 'block';
      if (modulesSection) modulesSection.style.display = 'none';
      if (clientsSection) clientsSection.style.display = 'none';

      // Destroi instância do Choices.js
      if (clientsChoices) {
         clientsChoices.destroy();
         clientsChoices = null;
      }

      // Limpa avatar
      if (window.FilePondManager) {
         FilePondManager.clearAllFiles();
      }

      userSelected = null;
   }

   /**
    * Inicia o monitoramento automático do status de bloqueio
    */
   function startLockStatusMonitoring() {
      setInterval(() => {
         if (users && Array.isArray(users)) {
            const tbody = document.querySelector('#table-users tbody');
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

               if (lockStatus.isLocked !== currentLockStatus) {
                  hasChanges = true;
               }
            });

            if (hasChanges) {
               renderTableUsers();
            }
         }
      }, 30000); // Verifica a cada 30 segundos
   }

   /**
    * Vincula eventos
    */
   function bindEvents() {
      setTimeout(() => {
         // Botão de salvar usuário
         const btnSaveUser = document.getElementById('btn-save-user');
         if (btnSaveUser) {
            btnSaveUser.addEventListener('click', saveUser);
         }

         // Botão de editar empresa
         const btnEditCompany = document.getElementById('btn-edit-company');
         if (btnEditCompany) {
            btnEditCompany.addEventListener('click', editCompany);
         }

         // Botão de salvar empresa
         const btnSaveCompany = document.getElementById('btn-save-company');
         if (btnSaveCompany) {
            btnSaveCompany.addEventListener('click', saveCompany);
         }

         // Botão de novo usuário
         const btnNewUser = document.getElementById('btn-new-user');
         if (btnNewUser) {
            btnNewUser.addEventListener('click', function() {
               resetFormUser();
               const modal = new bootstrap.Modal(document.getElementById('modal-new-user'));
               modal.show();
            });
         }

         // Mudança no tipo de usuário
         const userType = document.getElementById('user-type');
         if (userType) {
            userType.addEventListener('change', onUserTypeChange);
         }

         // Mudança na empresa
         const companySelect = document.getElementById('user-company');
         if (companySelect) {
            companySelect.addEventListener('change', onCompanyChange);
         }

         // Filtros da tabela
         const userTypeFilter = document.getElementById('filtroTipoUsuario');
         const statusFilter = document.getElementById('filtroStatus');
         const searchFilter = document.getElementById('pesquisaUsuario');

         if (userTypeFilter) {
            userTypeFilter.addEventListener('change', renderTableUsers);
         }
         if (statusFilter) {
            statusFilter.addEventListener('change', renderTableUsers);
         }
         if (searchFilter) {
            searchFilter.addEventListener('input', renderTableUsers);
         }

         // Botões de seleção de módulos
         const btnSelectAllModules = document.getElementById('btn-select-all-user-modules');
         const btnDeselectAllModules = document.getElementById('btn-deselect-all-user-modules');

         if (btnSelectAllModules) {
            btnSelectAllModules.addEventListener('click', function() {
               const checkboxes = document.querySelectorAll('#user-modules-list .module-checkbox');
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
               const checkboxes = document.querySelectorAll('#user-modules-list .module-checkbox');
               checkboxes.forEach(checkbox => {
                  if (checkbox.checked) {
                     checkbox.checked = false;
                     checkbox.dispatchEvent(new Event('change'));
                  }
               });
            });
         }

         // Reset do modal
         const modalNewUser = document.getElementById('modal-new-user');
         if (modalNewUser) {
            modalNewUser.addEventListener('hidden.bs.modal', resetFormUser);
         }

      }, 1000);
   }

      /**
    * Função para criar e exibir um toast de erro simples
    */
   function showErrorToast(message) {
      const toastContainer = document.querySelector('.toast-container');
      const toastId = 'toast-' + Date.now();

      const toastHTML = `
         <div id="${toastId}" class="toast colored-toast bg-danger text-fixed-white fade" role="alert" aria-live="assertive" aria-atomic="true" style="max-width: 400px;">
            <div class="toast-header bg-danger text-fixed-white">
               <i class="bi bi-exclamation-triangle me-2"></i>
               <strong class="me-auto">Erro</strong>
               <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
               ${message || 'Erro ao processar solicitação'}
            </div>
         </div>
      `;

      toastContainer.insertAdjacentHTML('afterbegin', toastHTML);
      const toastElement = document.getElementById(toastId);
      const toast = new bootstrap.Toast(toastElement, {
         delay: 8000,
         autohide: true
      });

      toastElement.addEventListener('hidden.bs.toast', function () {
         toastElement.remove();
      });

      toast.show();
   }

   /**
    * Função para criar e exibir um toast de sucesso
    */
   function showSuccessToast(message) {
      const toastContainer = document.querySelector('.toast-container');
      const toastId = 'toast-' + Date.now();

      const toastHTML = `
         <div id="${toastId}" class="toast colored-toast bg-success text-fixed-white fade" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-success text-fixed-white">
               <strong class="me-auto">Sucesso</strong>
               <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
               ${message || 'Operação realizada com sucesso'}
            </div>
         </div>
      `;

      toastContainer.insertAdjacentHTML('afterbegin', toastHTML);
      const toastElement = document.getElementById(toastId);
      const toast = new bootstrap.Toast(toastElement, {
         delay: 3000,
         autohide: true
      });

      toastElement.addEventListener('hidden.bs.toast', function () {
         toastElement.remove();
      });

      toast.show();
   }

   init();

   // API pública
   return {
      editUser: editUser,
      unlockUser: unlockUser,
      toggleStatusUser: toggleStatusUser,
      editCompany: editCompany,
      saveCompany: saveCompany,
      showErrorToast: showErrorToast,
      showSuccessToast: showSuccessToast
   };
})();

// Expõe globalmente
window.UsersManager = UsersManager;

/**
 * Gerenciador do FilePond para upload de avatar
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
         maxFileSize: '2MB',
         acceptedFileTypes: ['image/*'],
         imagePreviewHeight: 120,
         imageCropAspectRatio: 1,
         imageResizeTargetWidth: 512,
         imageResizeTargetHeight: 512,
         stylePanelLayout: 'compact circle',
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
            maxFileSize: config ? config.maxSize : '2MB',
            acceptedFileTypes: ['image/*'],

            // Configurações de imagem
            imageResizeTargetWidth: config ? config.maxWidth : 512,
            imageResizeTargetHeight: config ? config.maxHeight : 512,

            // Label personalizado
            labelIdle: config ?
               `<i class="bi bi-person-circle me-2"></i>Clique para selecionar avatar<br><small class="text-muted">Máx: ${config.maxWidth}x${config.maxHeight}px, ${Math.round(config.maxSize / 1024 / 1024)}MB</small>` :
               '<i class="bi bi-cloud-upload me-2"></i>Arraste & solte ou clique para selecionar',

            // Configurações de servidor
            server: {
               process: null, // Processamento será manual
            },
         });

         filePondInstances[input.id] = pond;
      });
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
    * Limpa todos os FilePonds
    */
   function clearAllFiles() {
      try {
         Object.values(filePondInstances).forEach(pond => {
            try {
               pond.removeFiles();
            } catch (error) {
               console.log('⚠️ Erro ao remover arquivos do FilePond:', error);
            }
         });
      } catch (error) {
         console.error('❌ Erro ao limpar arquivos:', error);
      }
   }

   /**
    * Carrega avatar existente do usuário
    */
   function loadUserAvatar(user) {
      if (user.profile_picture_url) {
         // Para avatar, podemos mostrar uma prévia simples
         console.log('📷 Carregando avatar existente:', user.profile_picture_url);
      }
   }

   // Retorna métodos públicos
   return {
      init: initFilePond,
      getFile: getFile,
      clearAllFiles: clearAllFiles,
      loadUserAvatar: loadUserAvatar
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
