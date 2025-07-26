const CompaniesManager = (function() {
   'use strict';
   // Estado global
   let companies = [];
   let users = [];
   let modules = [];
   let companySelected = null;
   let userSelected = null;

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
         await Promise.all([
            loadCompanies(),
            loadUsers(),
            loadModules()
         ]);

         // Popula selects de empresa
         popularSelectCompanies();

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
      * Popula selects de empresas
   */
   function popularSelectCompanies() {
      const selects = [
         document.getElementById('company-user'),
         document.getElementById('company-filter')
      ];

      selects.forEach(select => {
         if (!select) return;

         // Mantém primeira opção
         const primeiraOpcao = select.querySelector('option:first-child');
         select.innerHTML = '';
         if (primeiraOpcao) {
            select.appendChild(primeiraOpcao);
         }

         // Adiciona empresas
         companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.uuid;
            option.textContent = company.name;
            select.appendChild(option);
         });
      });
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
         const companyUser = document.getElementById('company-user');

         if (userType) {
            userType.addEventListener('change', onUserTypeChange);
         }
         if (companyUser) {
            companyUser.addEventListener('change', onCompanyChange);
         }

         // Aba de usuários - carrega dados quando clica
         const usersTab = document.getElementById('users-tab');
         if (usersTab) {
            usersTab.addEventListener('click', function() {
               setTimeout(() => {
                  loadUsers();
               }, 100);
            });
         }

         // Filtros da tabela de usuários
         const companyFilter = document.getElementById('company-filter');
         const userTypeFilter = document.getElementById('user-type-filter');

         if (companyFilter) {
            companyFilter.addEventListener('change', renderTableUsers);
         }
         if (userTypeFilter) {
            userTypeFilter.addEventListener('change', renderTableUsers);
         }

         // Validação de senha
         const confirmPassword = document.getElementById('confirm-password');
         if (confirmPassword) {
            confirmPassword.addEventListener('blur', validatePasswords);
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

   /**
      * Salva empresa (criar ou editar)
   */
   async function saveCompany() {
      try {
         const form = document.getElementById('form-new-company');
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
      * Valida arquivos antes do upload
      */
   function validateFiles(arquivos) {
      const maxSizes = {
         background: { width: 700, height: 1000, size: 5 * 1024 * 1024 }, // 5MB
         logo: { width: 800, height: 400, size: 5 * 1024 * 1024 },
         logo_white: { width: 800, height: 400, size: 5 * 1024 * 1024 },
         logo_dark: { width: 800, height: 400, size: 5 * 1024 * 1024 },
         logo_square: { width: 512, height: 512, size: 5 * 1024 * 1024 },
         logo_square_white: { width: 512, height: 512, size: 5 * 1024 * 1024 },
         logo_square_dark: { width: 512, height: 512, size: 5 * 1024 * 1024 },
         favicon: { width: 32, height: 32, size: 1 * 1024 * 1024 } // 1MB
      };

      const errors = [];

      Object.entries(arquivos).forEach(([key, file]) => {
         if (file) {
            const limits = maxSizes[key];

            // Verifica tamanho do arquivo
            if (file.size > limits.size) {
               errors.push(`${key}: Arquivo muito grande (máx ${Math.round(limits.size / 1024 / 1024)}MB)`);
            }

            // Verifica tipo do arquivo
            if (!file.type.startsWith('image/')) {
               errors.push(`${key}: Tipo de arquivo inválido (apenas imagens)`);
            }
         }
      });

      return errors;
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
      document.getElementById('company-uuid').value = company.uuid;
      document.getElementById('title-modal-new-company').textContent = 'Editar Empresa';
      document.getElementById('text-save-company').textContent = 'Atualizar Empresa';

      // Preenche campos
      const campos = ['name', 'cnpj', 'url', 'status', 'firebird_host', 'firebird_port', 'firebird_database', 'firebird_user', 'firebird_password'];

      campos.forEach(campo => {
         const elemento = document.getElementById(mapCompanyField(campo));
         if (elemento && company[campo] !== undefined) {
            elemento.value = company[campo];
         }
      });

      // Carrega imagens existentes no FilePond
      setTimeout(() => {
         if (window.FilePondManager) {
            FilePondManager.loadCompanyImages(company);
         }
      }, 100);

      // Abre modal
      new bootstrap.Modal(document.getElementById('modal-new-company')).show();
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
      document.getElementById('form-new-company').reset();
      document.getElementById('company-uuid').value = '';
      document.getElementById('title-modal-new-company').textContent = 'Cadastrar Nova Empresa';
      document.getElementById('text-save-company').textContent = 'Salvar Empresa';
      companySelected = null;

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
         const response = await Thefetch(`/api/company/${companyUuid}/modules`, 'GET');

         if (response && response.success) {
            const modules = normalizeModulesData(response.data);
            return modules.map(module => module.id || module.uuid || module);
         }

         return [];
      } catch (error) {
         // Se for 404, é normal - empresa não tem módulos associados
         if (error.message && error.message.includes('404')) {
            console.error('ℹ️ Empresa não possui módulos associados (404)');
            showErrorToast('Empresa não possui módulos associados');
            return [];
         }
         showErrorToast('Erro ao carregar módulos da empresa');
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
         const companyUuid = document.getElementById('modules-company-uuid').value;
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
      document.getElementById('modules-company-uuid').value = company.uuid;
      document.getElementById('company-name-modules').textContent = company.name;

      // Mostra loading
      document.getElementById('modules-loading').style.display = 'block';
      document.getElementById('modules-list').style.display = 'none';
      document.getElementById('no-modules').style.display = 'none';

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
         document.getElementById('modules-loading').style.display = 'none';
         document.getElementById('no-modules').style.display = 'block';
         showErrorToast('Erro ao carregar módulos');
      }
   }

   /**
    * Reset do formulário de módulos
    */
   function resetFormModules() {
      document.getElementById('form-company-modules').reset();
      document.getElementById('modules-company-uuid').value = '';
      document.getElementById('company-name-modules').textContent = '';

      // Reset visual
      document.getElementById('modules-loading').style.display = 'block';
      document.getElementById('modules-list').style.display = 'none';
      document.getElementById('no-modules').style.display = 'none';

      // Limpa lista
      document.getElementById('modules-list').innerHTML = '';
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
    * Reset do formulário de usuário
    */
   function resetFormUser() {
      const formUser = document.getElementById('form-new-user');
      if (formUser) {
         formUser.reset();
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

         console.log(dadosUpdate, 'dadosUpdate');

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
      previewDiv.className = 'card empty-preview';
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
