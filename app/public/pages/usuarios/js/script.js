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
      'admin': { label: 'Administrador', badge: 'bg-warning' },
      'user': { label: 'Usuário', badge: 'bg-info' },
      'client': { label: 'Cliente', badge: 'bg-teal' }
   },
   TIPOS_MODULO: {
      'admin': { label: 'Administrador', badge: 'bg-warning' },
      'user': { label: 'Usuário', badge: 'bg-info' },
      'client': { label: 'Cliente', badge: 'bg-teal' }
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
            // Adiciona os módulos da empresa ao objeto ownCompany
            if (response.data.modules) {
               ownCompany.modules = response.data.modules;
            }
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
    * Função mantida para compatibilidade, mas não é mais utilizada
    */
   function populateCompanySelect() {
      // Esta função não é mais necessária pois a seção de empresa foi removida
      // O admin sempre trabalha com a própria empresa
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
               <td colspan="5" class="text-center text-muted py-4">
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
         <tr>
            <td class="${lockStatus.isLocked ? 'bg-warning-transparent' : ''}">
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
            <td class="text-center ${lockStatus.isLocked ? 'bg-warning-transparent' : ''}">
               <span class="badge ${CONFIG.TIPOS_USUARIO[user.user_type]?.badge || 'bg-secondary'}">
                  ${CONFIG.TIPOS_USUARIO[user.user_type]?.label || user.user_type}
               </span>
            </td>
            <td class="text-center ${lockStatus.isLocked ? 'bg-warning-transparent' : ''}">
               <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">
                  ${user.status === 'active' ? 'Ativo' : 'Inativo'}
               </span>
            </td>
            <td class="text-center ${lockStatus.isLocked ? 'bg-warning-transparent' : ''}">
               <div class="clients-list">
                  ${clientsDisplay}
               </div>
            </td>
            <td class="text-center ${lockStatus.isLocked ? 'bg-warning-transparent' : ''}">
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
   function initializeClientsSelect() {
      return new Promise((resolve, reject) => {
         const clientsSelect = document.getElementById('user-clients');
         if (!clientsSelect) {
            console.error('❌ Elemento user-clients não encontrado');
            reject(new Error('Elemento user-clients não encontrado'));
            return;
         }

         // Verifica se Choices está disponível
         if (typeof Choices === 'undefined') {
            console.error('❌ Biblioteca Choices não está disponível');
            reject(new Error('Biblioteca Choices não está disponível'));
            return;
         }

         // Destroi instância anterior se existir
         if (clientsChoices) {
            clientsChoices.destroy();
            clientsChoices = null;
         }

         try {
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
               shouldSort: false
            });

            // Adiciona listener para busca após a inicialização
            setTimeout(() => {
               const input = clientsChoices.input.element;
               if (input) {
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
               } else {
                  console.error('❌ Input do Choices não encontrado');
               }

               // Resolve a Promise após a inicialização completa
               resolve(clientsChoices);
            }, 100);

         } catch (error) {
            console.error('❌ Erro ao inicializar Choices:', error);
            reject(error);
         }
      });
   }

   /**
    * Carrega clientes do usuário para edição
    */
   async function loadUserClients(userUuid) {
      try {
         // Primeiro, busca o usuário na lista atual
         const user = users.find(u => u.uuid === userUuid);

         if (user && user.user_type === 'client' && user.clients) {
            // Converte os clientes para o formato do Choices.js
            const userClients = user.clients.map(client => ({
               value: client.client_id,
               label: `${client.client_name} - ${client.client_cnpj}`,
               selected: true,
               customProperties: {
                  name: client.client_name,
                  cnpj: client.client_cnpj
               }
            }));

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
         const userIndex = users.findIndex(u => u.uuid === userUuid);

         if (userIndex !== -1) {
            // Atualiza os clientes do usuário
            users[userIndex].clients = currentClients;

            // Re-renderiza a tabela para mostrar as mudanças
            renderTableUsers();

         }
      } catch (error) {
         console.error('❌ Erro ao atualizar lista local:', error);
      }
   }

   /**
    * Salva apenas os clientes de um usuário (para edição)
    */
   async function saveUserClientsOnly(userUuid) {
      try {
         if (!clientsChoices) {
            console.warn('⚠️ Choices não inicializado');
            return;
         }

         const selectedClients = clientsChoices.getValue();
         console.log('🔍 Dados brutos do Choices.js (saveUserClientsOnly):', selectedClients);

         const clientsData = selectedClients.map(client => {
            console.log('🔍 Processando cliente (saveUserClientsOnly):', client);

            // Extrai dados do cliente com verificações de segurança
            let nocli, nomcli, cgccli;

            if (client && typeof client === 'object') {
               // Método 1: Se o choice tem value e customProperties
               if (client.value && client.customProperties && client.customProperties.name) {
                  nocli = client.value;
                  nomcli = client.customProperties.name;
                  cgccli = client.customProperties.cnpj || '';
                  console.log('✅ Método 1 - customProperties (saveUserClientsOnly):', { nocli, nomcli, cgccli });
               }
               // Método 2: Se o choice tem value e label (formato "Nome - CNPJ")
               else if (client.value && client.label) {
                  nocli = client.value;
                  const parts = client.label.split(' - ');
                  nomcli = parts[0] || '';
                  cgccli = parts[1] || '';
                  console.log('✅ Método 2 - label split (saveUserClientsOnly):', { nocli, nomcli, cgccli });
               }
               // Método 3: Se o choice tem nocli, nomcli, cgccli diretamente
               else if (client.nocli && client.nomcli) {
                  nocli = client.nocli;
                  nomcli = client.nomcli;
                  cgccli = client.cgccli || '';
                  console.log('✅ Método 3 - campos diretos (saveUserClientsOnly):', { nocli, nomcli, cgccli });
               }
               // Método 4: Fallback para qualquer estrutura
               else {
                  nocli = client.value || client.nocli || '';
                  nomcli = client.label || client.nomcli || client.customProperties?.name || '';
                  cgccli = client.cgccli || client.customProperties?.cnpj || '';
                  console.log('✅ Método 4 - fallback (saveUserClientsOnly):', { nocli, nomcli, cgccli });
               }
            } else {
               nocli = '';
               nomcli = '';
               cgccli = '';
               console.log('❌ Cliente inválido (saveUserClientsOnly):', client);
            }

            const result = { nocli, nomcli, cgccli };
            console.log('📤 Dados extraídos (saveUserClientsOnly):', result);
            return result;
         });

         console.log('📤 Enviando dados para API (saveUserClientsOnly):', {
            userUuid: userUuid,
            clients: clientsData
         });

         const response = await Thefetch('/api/user/clients', 'POST', {
            userUuid: userUuid,
            clients: clientsData
         });

         if (response.success) {
            // Atualizar lista local
            await updateUserClientsInLocalList(userUuid, response.data.currentClients);

            // Mostrar estatísticas
            const stats = response.data;
            let message = 'Clientes atualizados: ';
            if (stats.created > 0) message += `${stats.created} criados, `;
            if (stats.activated > 0) message += `${stats.activated} reativados, `;
            if (stats.deactivated > 0) message += `${stats.deactivated} removidos`;

            showSuccessToast(message);

            return response.data;
         } else {
            throw new Error(response.message);
         }
      } catch (error) {
         console.error('❌ Erro ao salvar clientes:', error);
         showErrorToast('Erro ao salvar clientes: ' + error.message);
         throw error;
      }
   }

   /**
    * Handler para mudança no tipo de usuário
    */
   async function onUserTypeChange() {
      const userType = document.getElementById('user-type');
      const modulesSection = document.getElementById('modules-selection-section');
      const clientsSection = document.getElementById('clients-selection-section');

      if (!userType) return;

      const userTypeValue = userType.value;

      // Reset de seções
      if (modulesSection) modulesSection.style.display = 'none';
      if (clientsSection) clientsSection.style.display = 'none';

      // Configura visibilidade baseada no tipo
      if (userTypeValue === 'admin' || userTypeValue === 'user') {
         // Sempre mostra a seção de módulos para admin e user
         if (modulesSection) modulesSection.style.display = 'block';

         // Carrega módulos da empresa do usuário logado
         if (ownCompany && ownCompany.modules) {
            await loadUserModules(userTypeValue, ownCompany.uuid);
         } else {
            console.log('🔍 Nenhuma empresa disponível ainda');
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
      }
   }

   /**
    * Handler para mudança na empresa
    * Função mantida para compatibilidade, mas não é mais utilizada
    */
   async function onCompanyChange() {
      // Esta função não é mais necessária pois a seção de empresa foi removida
      // O admin sempre trabalha com a própria empresa
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
            console.log('❌ Não há módulos disponíveis na empresa');
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

      if (!modulesContainer) {
         console.error('❌ Container de módulos não encontrado');
         return;
      }

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
         const passwordField = document.getElementById('user-password');

         // Validações específicas
         if (!userType) {
            showErrorToast('Tipo de usuário é obrigatório');
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

         // Sempre usa a empresa do usuário logado (admin)
         dados.company_id = ownCompany?.id;

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
            const selectedClients = clientsChoices.getValue();
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

            // NOVA FUNCIONALIDADE: Salvar clientes se for usuário tipo 'client'
            if (userType === 'client' && clientsChoices) {
               const selectedClients = clientsChoices.getValue();

               // Sempre enviar todos os clientes selecionados (mesmo array vazio)
               const clientsData = selectedClients.map(client => {

                  // Extrai dados do cliente com verificações de segurança
                  let nocli, nomcli, cgccli;

                  if (client && typeof client === 'object') {
                     // Método 1: Se o choice tem value e customProperties
                     if (client.value && client.customProperties && client.customProperties.name) {
                        nocli = client.value;
                        nomcli = client.customProperties.name;
                        cgccli = client.customProperties.cnpj || '';
                     }
                     // Método 2: Se o choice tem value e label (formato "Nome - CNPJ")
                     else if (client.value && client.label) {
                        nocli = client.value;
                        const parts = client.label.split(' - ');
                        nomcli = parts[0] || '';
                        cgccli = parts[1] || '';
                     }
                     // Método 3: Se o choice tem nocli, nomcli, cgccli diretamente
                     else if (client.nocli && client.nomcli) {
                        nocli = client.nocli;
                        nomcli = client.nomcli;
                        cgccli = client.cgccli || '';
                     }
                     // Método 4: Fallback para qualquer estrutura
                     else {
                        nocli = client.value || client.nocli || '';
                        nomcli = client.label || client.nomcli || client.customProperties?.name || '';
                        cgccli = client.cgccli || client.customProperties?.cnpj || '';
                     }
                  } else {
                     nocli = '';
                     nomcli = '';
                     cgccli = '';
                     console.log('❌ Cliente inválido:', client);
                  }

                  const result = { nocli, nomcli, cgccli };
                  return result;
               });

               const targetUuid = userUuid || response.user?.uuid || response.data?.uuid;
               if (targetUuid) {
                  try {

                     const clientsResponse = await Thefetch('/api/user/clients', 'POST', {
                        userUuid: targetUuid,
                        clients: clientsData // Pode ser array vazio se todos foram removidos
                     });

                     if (clientsResponse.success) {
                        // ATUALIZAR LISTA LOCAL DE USUÁRIOS
                        await updateUserClientsInLocalList(targetUuid, clientsResponse.data.currentClients);

                        // Mostrar estatísticas
                        const stats = clientsResponse.data;
                        let message = 'Clientes atualizados: ';
                        if (stats.created > 0) message += `${stats.created} criados, `;
                        if (stats.activated > 0) message += `${stats.activated} reativados, `;
                        if (stats.deactivated > 0) message += `${stats.deactivated} removidos`;

                        showSuccessToast(message);
                     } else {
                        console.warn('⚠️ Erro ao salvar clientes:', clientsResponse.message);
                     }
                  } catch (clientsError) {
                     console.warn('⚠️ Erro ao salvar clientes:', clientsError);
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

            // Atualiza a lista de usuários
            if (userUuid) {
               // Se é edição, atualiza o usuário existente na lista
               const userIndex = users.findIndex(u => u.uuid === userUuid);
               if (userIndex !== -1) {
                  // Atualiza os dados do usuário na lista local
                  const userData = response.data || response.user;
                  if (userData) {
                     users[userIndex] = { ...users[userIndex], ...userData };
                     renderTableUsers();
                  } else {
                     await loadUsers();
                  }
               } else {
                  // Se não encontrou, recarrega a lista
                  await loadUsers();
               }
            } else {
               // Se é criação, adiciona o novo usuário à lista
               const userData = response.data || response.user;
               if (userData) {
                  users.unshift(userData); // Adiciona no início da lista
                  renderTableUsers();
                  console.log('✅ Novo usuário adicionado à lista:', userData);
               } else {
                  // Se não tem dados, recarrega a lista
                  console.log('⚠️ Nenhum dado de usuário na resposta, recarregando lista...');
                  await loadUsers();
               }
            }

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

      // A empresa será sempre a empresa do usuário logado (admin)
      // Não é mais necessário configurar o campo de empresa

      // Configura campos baseado no tipo de usuário
      await onUserTypeChange();

      // Carrega dados específicos do tipo
      if (user.user_type === 'client') {
         // Carrega clientes do usuário da lista atual
         const userClients = await loadUserClients(user.uuid);

         // Aguarda a inicialização do Choices.js e então define os clientes
         if (userClients.length > 0) {
            // Aguarda a inicialização do Choices.js
            setTimeout(async () => {
               try {
                  if (!clientsChoices) {
                     // Se o Choices.js ainda não foi inicializado, inicializa agora
                     await initializeClientsSelect();
                  }

                  if (clientsChoices) {
                     clientsChoices.setChoices(userClients, 'value', 'label', true);
                  }
               } catch (error) {
                  console.error('❌ Erro ao definir clientes no Choices:', error);
               }
            }, 300);
         }
      } else if (user.user_type === 'admin' || user.user_type === 'user') {
         // Carrega módulos do usuário
         let selectedModules = [];

         // Extrai módulos do usuário se disponível
         if (user.modules) {
            // Os módulos vêm como string separada por vírgula, ex: "Usuários,TMS"
            const userModules = user.modules.split(',').map(module => module.trim());

            // Busca os IDs dos módulos baseado nos nomes
            if (ownCompany && ownCompany.modules) {
               selectedModules = ownCompany.modules
                  .filter(module => userModules.includes(module.name))
                  .map(module => module.id);
            }
         }

         await loadUserModules(user.user_type, ownCompany.uuid, selectedModules);
      }

      // Abre modal
      const modalElement = document.getElementById('modal-new-user');
      if (modalElement) {
         const modal = new bootstrap.Modal(modalElement);
         modal.show();

         // Garante que o FilePond está pronto e carrega o avatar imediatamente
         if (window.FilePondManager) {
            FilePondManager.recreateFilePondInputs();
            if (user.profile_picture_url) {
               FilePondManager.loadUserAvatar(user);
            }
         }
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

      // Carrega módulos da empresa do usuário logado
      if (ownCompany && ownCompany.modules) {
         setTimeout(() => {
            loadUserModules('admin', ownCompany.uuid);
         }, 100);
      }
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
         // Evento para garantir que o FilePond esteja sempre disponível
         const modalElement = document.getElementById('modal-new-user');
         if (modalElement) {
            modalElement.addEventListener('show.bs.modal', function() {
               if (window.FilePondManager) {
                  // Sempre recria o FilePond para garantir que esteja funcionando
                  FilePondManager.recreateFilePondInputs();
               }
            });
         }
         // Botão de salvar usuário
         const btnSaveUser = document.getElementById('btn-save-user');
         if (btnSaveUser) {
            btnSaveUser.addEventListener('click', saveUser);
         }



         // Botão de novo usuário
         const btnNewUser = document.getElementById('btn-new-user');
         if (btnNewUser) {
            btnNewUser.addEventListener('click', function() {
               resetFormUser();

               // Limpa qualquer backdrop residual antes de abrir o modal
               const backdrops = document.querySelectorAll('.modal-backdrop');
               backdrops.forEach(backdrop => {
                  if (backdrop.parentNode) {
                     backdrop.parentNode.removeChild(backdrop);
                  }
               });

               // Remove classes de modal do body
               document.body.classList.remove('modal-open');
               document.body.style.overflow = '';
               document.body.style.paddingRight = '';

               const modalElement = document.getElementById('modal-new-user');
               const modal = new bootstrap.Modal(modalElement);
               modal.show();

               // Limpa o FilePond para novos usuários
               modalElement.addEventListener('shown.bs.modal', function onModalShown() {
                  if (window.FilePondManager) {
                     // Limpa imediatamente, sem delay
                     FilePondManager.clearAllFiles();
                  }
                  modalElement.removeEventListener('shown.bs.modal', onModalShown);
               });
            });
         }

         // Mudança no tipo de usuário
         const userType = document.getElementById('user-type');
         if (userType) {
            userType.addEventListener('change', onUserTypeChange);
         }

         // Mudança na empresa - removido pois a seção de empresa foi removida

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

            // Adiciona listener para limpeza do backdrop
            modalNewUser.addEventListener('hidden.bs.modal', function() {
               // Remove backdrops extras que possam ter ficado
               const backdrops = document.querySelectorAll('.modal-backdrop');
               backdrops.forEach(backdrop => {
                  if (backdrop.parentNode) {
                     backdrop.parentNode.removeChild(backdrop);
                  }
               });

               // Remove classes de modal do body
               document.body.classList.remove('modal-open');
               document.body.style.overflow = '';
               document.body.style.paddingRight = '';
            });

            // Adiciona listener para botões de fechar do modal
            const closeButtons = modalNewUser.querySelectorAll('[data-bs-dismiss="modal"]');
            closeButtons.forEach(button => {
               button.addEventListener('click', function() {
                  // Força a limpeza do backdrop após fechar
                  setTimeout(() => {
                     const backdrops = document.querySelectorAll('.modal-backdrop');
                     backdrops.forEach(backdrop => {
                        if (backdrop.parentNode) {
                           backdrop.parentNode.removeChild(backdrop);
                        }
                     });

                     document.body.classList.remove('modal-open');
                     document.body.style.overflow = '';
                     document.body.style.paddingRight = '';
                  }, 150);
               });
            });
         }



                     // Adiciona listener para botões de fechar do modal
         const closeButtons = modalNewUser.querySelectorAll('[data-bs-dismiss="modal"]');
         closeButtons.forEach(button => {
            button.addEventListener('click', function() {
               // Força a limpeza do backdrop após fechar
               setTimeout(() => {
                  const backdrops = document.querySelectorAll('.modal-backdrop');
                  backdrops.forEach(backdrop => {
                     if (backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                     }
                  });

                  document.body.classList.remove('modal-open');
                  document.body.style.overflow = '';
                  document.body.style.paddingRight = '';
               }, 150);
            });
         });



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
      init: init,
      editUser: editUser,
      unlockUser: unlockUser,
      toggleStatusUser: toggleStatusUser,
      showErrorToast: showErrorToast,
      showSuccessToast: showSuccessToast
   };
})();

// Expõe UsersManager globalmente
window.UsersManager = UsersManager;

// FilePondManager separado
const FilePondManager = (function() {
   'use strict';
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

         // Verifica se já existe uma instância para este input
         if (filePondInstances[inputId]) {
            return; // Pula se já existe
         }

         // Verifica se o elemento ainda existe no DOM e não tem instância
         if (!document.contains(input) || filePondInstances[inputId]) {
            return; // Pula se o elemento não está no DOM ou já tem instância
         }

         const config = FILE_VALIDATION_CONFIG[inputId];

         // Cria instância do FilePond de forma otimizada
         const pond = FilePond.create(input, {
            // Configurações de validação
            maxFileSize: config ? config.maxSize : '5MB',
            acceptedFileTypes: ['image/*'],

            // Configurações de imagem
            imageResizeTargetWidth: config ? config.maxWidth : null,
            imageResizeTargetHeight: config ? config.maxHeight : null,

            // Label personalizado
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

                     // Mostra toast de erro usando a função do UsersManager
                     UsersManager.showErrorToast(errorMsg);
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
         // Remove previews existentes PRIMEIRO
         const existingPreviews = document.querySelectorAll('.existing-image-preview');
         existingPreviews.forEach(preview => {
            preview.remove();
         });

         // Limpa arquivos do FilePond de forma ultra segura
         const instancesToClean = { ...filePondInstances };

         Object.keys(instancesToClean).forEach(inputId => {
            try {
               const pond = instancesToClean[inputId];
               if (pond && typeof pond.removeFiles === 'function') {
                  try {
                     pond.removeFiles();
                  } catch (removeError) {
                     console.log('⚠️ Erro ao remover arquivos, mas continuando:', removeError);
                  }
               }
            } catch (error) {
               console.log('⚠️ Erro ao remover arquivos do FilePond:', error);
            }
         });
      } catch (error) {
         console.error('❌ Erro ao limpar arquivos:', error);
      }
   }

   /**
    * Recria inputs do FilePond
    */
   function recreateFilePondInputs() {
      try {
         // Remove previews existentes de forma síncrona
         document.querySelectorAll('.existing-image-preview').forEach(preview => preview.remove());

         // Limpa instâncias existentes de forma ultra segura
         const instancesToClean = { ...filePondInstances };
         filePondInstances = {}; // Limpa o objeto primeiro

         Object.keys(instancesToClean).forEach(inputId => {
            try {
               const pond = instancesToClean[inputId];
               if (pond) {
                  // Remove arquivos primeiro (mais seguro que destroy)
                  if (typeof pond.removeFiles === 'function') {
                     try {
                        pond.removeFiles();
                     } catch (removeError) {
                        console.log('⚠️ Erro ao remover arquivos, mas continuando:', removeError);
                     }
                  }
                  // Tenta destruir apenas se não der erro
                  if (typeof pond.destroy === 'function') {
                     try {
                        pond.destroy();
                     } catch (destroyError) {
                        console.log('⚠️ Erro ao destruir FilePond, mas continuando:', destroyError);
                     }
                  }
               }
            } catch (error) {
               console.log('⚠️ Erro ao limpar FilePond:', error);
            }
         });

         // Recria o input se necessário
         let input = document.getElementById('user-avatar');
         if (!input || !document.contains(input)) {
            const container = document.querySelector('.user-avatar-section');
            if (container) {
               // Remove input antigo se existir mas não estiver no DOM
               if (input && !document.contains(input)) {
                  try {
                     input.remove();
                  } catch (error) {
                     console.log('⚠️ Erro ao remover input antigo:', error);
                  }
               }

               // Cria novo input
               input = document.createElement('input');
               input.type = 'file';
               input.className = 'filepond';
               input.id = 'user-avatar';
               input.accept = 'image/*';
               input.setAttribute('data-max-width', '512');
               input.setAttribute('data-max-height', '512');
               container.appendChild(input);
            }
         }

         // Inicializa com pequeno delay para garantir estabilidade do DOM
         setTimeout(() => {
            initFilePond();
         }, 10);
      } catch (error) {
         console.error('❌ Erro ao recriar FilePond:', error);
      }
   }

   /**
    * Verifica se o FilePond está funcionando
    */
   function ensureFilePondExists() {
      const input = document.getElementById('user-avatar');

      // Se o elemento não existe, recria
      if (!input) {
         recreateFilePondInputs();
         return false;
      }

      // Se não existe instância, recria
      if (!filePondInstances['user-avatar']) {
         recreateFilePondInputs();
         return false;
      }

      // Se existe instância mas o elemento não está no DOM, recria
      if (!document.contains(input)) {
         recreateFilePondInputs();
         return false;
      }

      // Verifica se o elemento tem a classe filepond (está inicializado)
      if (!input.classList.contains('filepond')) {
         recreateFilePondInputs();
         return false;
      }

      return true;
   }

                  /**
    * Carrega avatar existente do usuário
    */
   function loadUserAvatar(user) {
      if (!user.profile_picture_url) return;

      // Aguarda um pequeno delay para garantir que o FilePond foi recriado
      setTimeout(() => {
         // Executa imediatamente de forma síncrona
         const container = document.getElementById('user-avatar')?.parentElement;
         if (!container) return;

         // Remove previews existentes de forma síncrona
         const existingPreviews = container.querySelectorAll('.existing-image-preview');
         existingPreviews.forEach(preview => preview.remove());

         // Cria e adiciona o preview imediatamente
         showExistingImagePreview('user-avatar', user.profile_picture_url);
      }, 50);
   }



      /**
    * Mostra preview da imagem existente - versão ultra otimizada
    */
   function showExistingImagePreview(inputId, imageUrl) {
      if (!imageUrl) return;

      const container = document.getElementById(inputId)?.parentElement;
      if (!container) return;

      // Remove previews existentes de forma síncrona
      container.querySelectorAll('.existing-image-preview').forEach(preview => preview.remove());

      // Cria o preview de forma ultra rápida usando innerHTML
      const flexContainer = document.createElement('div');
      flexContainer.className = 'existing-image-preview';
      flexContainer.innerHTML = `
         <div class="card" style="cursor: pointer; flex-shrink: 0; width: 180px;" onclick="window.open('${imageUrl}', '_blank')" title="Clique para visualizar">
            <img src="${imageUrl}" class="card-img-top" style="height: 90px; object-fit: cover;" alt="Imagem atual">
            <div class="card-body">
               <small class="text-muted">
                  <i class="bi bi-eye me-1"></i>Imagem atual
               </small>
            </div>
         </div>
      `;

      // Move o FilePond para dentro do container flex
      const filePondElement = container.querySelector('.filepond--root');
      if (filePondElement) {
         filePondElement.remove();
         flexContainer.appendChild(filePondElement);
      }

      // Adiciona o container flex ao DOM
      container.appendChild(flexContainer);
   }

   // Retorna métodos públicos
   return {
      init: initFilePond,
      getFile: getFile,
      clearAllFiles: clearAllFiles,
      loadUserAvatar: loadUserAvatar,
      showExistingImagePreview: showExistingImagePreview,
      recreateFilePondInputs: recreateFilePondInputs,
      ensureFilePondExists: ensureFilePondExists
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

// Inicializa UsersManager quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
   if (window.UsersManager && typeof UsersManager.init === 'function') {
      UsersManager.init();
   } else {
      console.error('❌ UsersManager não está disponível');
   }
});
