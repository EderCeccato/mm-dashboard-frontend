/**
 * Module Manager - Sistema de Gerenciamento de Módulos do Menu Lateral
 * Responsável por:
 * 1. Renderizar módulos baseado nas permissões do usuário
 * 2. Controlar estados ativos/inativos
 * 3. Gerenciar dropdowns de módulos pais
 * 4. Detectar página atual e marcar como ativa
 */

const ModuleManager = (function() {
   'use strict';

   /**
    * Renderiza o menu lateral com base nos módulos do usuário
    */
   function renderSidebarMenu() {
      const userData = AuthManager.getUserData();
      if (!userData || !userData.modules || !Array.isArray(userData.modules)) {
         console.log('❌ Nenhum módulo encontrado para o usuário');
         return;
      }

      const menuContainer = document.querySelector('.main-menu');
      if (!menuContainer) {
         console.log('❌ Container do menu não encontrado');
         return;
      }

      // Limpa o menu atual
      menuContainer.innerHTML = '';

      // Organiza módulos por parent E ordena globalmente
      const organizedModules = organizeAndSortModules(userData.modules);

      // Renderiza módulos na ordem correta
      renderModulesInOrder(menuContainer, organizedModules);

      // Marca o módulo/página atual como ativo
      setActiveModule();
   }

   /**
    * Organiza e ordena módulos globalmente por display_order
    * Mantém a estrutura pai/filho mas ordena tudo pela ordem de exibição
    */
   function organizeAndSortModules(modules) {
      // 1. Separa módulos standalone e com pai
      const standalone = [];
      const withParent = {};

      modules.forEach(module => {
         if (!module.parent_module) {
            standalone.push(module);
         } else {
            const parentName = module.parent_module.name;
            if (!withParent[parentName]) {
               withParent[parentName] = {
                  parent: module.parent_module,
                  children: [],
                  // Usa o display_order do primeiro filho como referência para o pai
                  parentOrder: module.display_order || 0
               };
            }
            withParent[parentName].children.push(module);

            // Atualiza a ordem do pai para o menor display_order dos filhos
            if ((module.display_order || 0) < withParent[parentName].parentOrder) {
               withParent[parentName].parentOrder = module.display_order || 0;
            }
         }
      });

      // 2. Ordena filhos dentro de cada pai
      Object.keys(withParent).forEach(parentName => {
         withParent[parentName].children.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      });

      // 3. Cria uma lista unificada para ordenação global
      const allItems = [];

      // Adiciona módulos standalone
      standalone.forEach(module => {
         allItems.push({
            type: 'standalone',
            order: module.display_order || 0,
            data: module
         });
      });

      // Adiciona grupos de módulos com pai
      Object.keys(withParent).forEach(parentName => {
         allItems.push({
            type: 'parent',
            order: withParent[parentName].parentOrder,
            data: withParent[parentName]
         });
      });

      // 4. Ordena tudo pelo display_order
      allItems.sort((a, b) => a.order - b.order);

      return allItems;
   }

      /**
    * Renderiza módulos na ordem correta baseada no display_order
    */
   function renderModulesInOrder(container, organizedModules) {
      organizedModules.forEach(item => {
         if (item.type === 'standalone') {
            const menuItem = createStandaloneMenuItem(item.data);
            container.appendChild(menuItem);
         } else if (item.type === 'parent') {
            const dropdownItem = createDropdownMenuItem(item.data);
            container.appendChild(dropdownItem);
         }
      });
   }

   /**
    * Cria um item de menu standalone
    */
   function createStandaloneMenuItem(module) {
      const li = document.createElement('li');
      li.className = 'slide';
      li.setAttribute('data-module-url', module.url);

      const icon = module.icon || 'bi bi-circle';

      li.innerHTML = `
         <a href="${module.url}" class="side-menu__item">
            <i class="${icon} side-menu__icon"></i>
            <span class="side-menu__label">${module.name}</span>
         </a>
      `;

      return li;
   }

   /**
    * Cria um item de menu dropdown (com filhos)
    */
   function createDropdownMenuItem(parentData) {
      const li = document.createElement('li');
      li.className = 'slide has-sub';

      const parentIcon = parentData.parent.icon || 'bi bi-grid';
      const parentName = parentData.parent.name;

      // URLs dos filhos para detectar se está ativo
      const childUrls = parentData.children.map(child => child.url);
      li.setAttribute('data-child-urls', JSON.stringify(childUrls));

      li.innerHTML = `
         <a class="side-menu__item">
            <i class="${parentIcon} side-menu__icon"></i>
            <span class="side-menu__label">${parentName}</span>
            <i class="fe fe-chevron-right side-menu__angle"></i>
         </a>
         <ul class="slide-menu child1" style="display: none;">
            <li class="slide side-menu__label1">
               <a>${parentName}</a>
            </li>
            ${parentData.children.map(child => `
               <li class="slide" data-module-url="${child.url}">
                  <a href="${child.url}" class="side-menu__item">${child.name}</a>
               </li>
            `).join('')}
         </ul>
      `;

      return li;
   }

   /**
    * Detecta a URL atual e marca o módulo correspondente como ativo
    */
   function setActiveModule() {
      const currentPath = window.location.pathname;

      // Remove classes ativas existentes
      document.querySelectorAll('.slide').forEach(slide => {
         slide.classList.remove('active', 'open');
      });

      document.querySelectorAll('.side-menu__item').forEach(item => {
         item.classList.remove('active');
      });

      // Verifica módulos standalone
      const standaloneMatch = document.querySelector(`[data-module-url="${currentPath}"]`);
      if (standaloneMatch) {
         standaloneMatch.classList.add('active');
         const link = standaloneMatch.querySelector('.side-menu__item');
         if (link) link.classList.add('active');
         return;
      }

      // Verifica módulos filhos (dentro de dropdowns)
      const allDropdowns = document.querySelectorAll('.slide.has-sub');
      allDropdowns.forEach(dropdown => {
         try {
            const childUrls = JSON.parse(dropdown.getAttribute('data-child-urls') || '[]');

               if (childUrls.includes(currentPath)) {
               // Abre o dropdown com animação (se não estiver aberto)
               const submenu = dropdown.querySelector('.slide-menu');
               if (!dropdown.classList.contains('open')) {
                  openDropdownWithAnimation(dropdown, submenu);
               }

               // Marca o filho específico como ativo
               const activeChild = dropdown.querySelector(`[data-module-url="${currentPath}"]`);
               if (activeChild) {
                  activeChild.classList.add('active');
                  const childLink = activeChild.querySelector('.side-menu__item');
                  if (childLink) childLink.classList.add('active');
               }
            }
         } catch (error) {
            console.error('❌ Erro ao processar URLs dos filhos:', error);
         }
      });
   }

   /**
    * Verifica se o usuário tem permissão para acessar um módulo
    */
   function hasModulePermission(moduleName, requiredPermission = 1) {
      const userData = AuthManager.getUserData();
      if (!userData || !userData.modules) return false;

      const module = userData.modules.find(m => m.name === moduleName);
      return module && module.permission >= requiredPermission;
   }

   /**
    * Retorna dados de um módulo específico
    */
   function getModuleData(moduleName) {
      const userData = AuthManager.getUserData();
      if (!userData || !userData.modules) return null;

      return userData.modules.find(m => m.name === moduleName) || null;
   }

   /**
    * Atualiza o menu quando os dados do usuário mudarem
    */
   function refreshMenu() {
      renderSidebarMenu();
   }

   /**
    * Força a atualização dos módulos do usuário e recarrega o menu
    * @returns {Promise<boolean>} Verdadeiro se a atualização foi bem-sucedida
    */
   async function forceModulesRefresh() {
      if (typeof AuthManager !== 'undefined' && AuthManager.refreshUserModules) {
         const success = await AuthManager.refreshUserModules();
         return success;
      } else {
         console.warn('⚠️ AuthManager não encontrado para atualizar módulos');
         return false;
      }
   }

   /**
    * Inicializa o sistema de módulos
    */
   function init() {
      // Renderiza o menu inicial
      renderSidebarMenu();

      // Atualiza quando a página muda (para SPAs)
      window.addEventListener('popstate', setActiveModule);

      // Observa mudanças na URL (para navegação programática)
      let lastUrl = window.location.pathname;
      const observer = new MutationObserver(() => {
         if (lastUrl !== window.location.pathname) {
            lastUrl = window.location.pathname;
            setActiveModule();
         }
      });

      observer.observe(document, { subtree: true, childList: true });
   }

      /**
    * Adiciona eventos de clique para dropdowns com animação suave
    */
   function bindDropdownEvents() {
      document.addEventListener('click', function(e) {
         const dropdownToggle = e.target.closest('.has-sub > .side-menu__item');
         if (dropdownToggle) {
            e.preventDefault();

            const parentLi = dropdownToggle.closest('.has-sub');
            const submenu = parentLi.querySelector('.slide-menu');

            if (parentLi.classList.contains('open')) {
               // Fecha o dropdown com animação
               closeDropdownWithAnimation(parentLi, submenu);
            } else {
               // Fecha outros dropdowns abertos
               document.querySelectorAll('.has-sub.open').forEach(openDropdown => {
                  if (openDropdown !== parentLi) {
                     const openSubmenu = openDropdown.querySelector('.slide-menu');
                     closeDropdownWithAnimation(openDropdown, openSubmenu);
                  }
               });

               // Abre este dropdown com animação
               openDropdownWithAnimation(parentLi, submenu);
            }
         }
      });
   }

      /**
    * Abre dropdown com animação suave
    */
   function openDropdownWithAnimation(parentLi, submenu) {
      if (!submenu) return;

      // Evita animação se já está aberto
      if (parentLi.classList.contains('open')) return;

      // Marca como aberto
      parentLi.classList.add('open');

      // Prepara para animação
      submenu.style.display = 'block';
      submenu.style.height = '0px';
      submenu.style.overflow = 'hidden';
      submenu.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      submenu.style.opacity = '0';

      // Força o reflow
      submenu.offsetHeight;

      // Calcula altura real do conteúdo
      const realHeight = submenu.scrollHeight;

      // Anima altura e opacidade
      requestAnimationFrame(() => {
         submenu.style.height = realHeight + 'px';
         submenu.style.opacity = '1';
      });

      // Remove restrições após animação
      setTimeout(() => {
         submenu.style.height = 'auto';
         submenu.style.overflow = 'visible';
         submenu.style.transition = '';
         submenu.style.opacity = '';
      }, 300);
   }

      /**
    * Fecha dropdown com animação suave
    */
   function closeDropdownWithAnimation(parentLi, submenu) {
      if (!submenu) return;

      // Evita animação se já está fechado
      if (!parentLi.classList.contains('open')) return;

      // Prepara para animação de fechamento
      const currentHeight = submenu.scrollHeight;
      submenu.style.height = currentHeight + 'px';
      submenu.style.overflow = 'hidden';
      submenu.style.transition = 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease-out';
      submenu.style.opacity = '1';

      // Força o reflow
      submenu.offsetHeight;

      // Anima para altura 0 e fade out
      requestAnimationFrame(() => {
         submenu.style.height = '0px';
         submenu.style.opacity = '0';
      });

      // Remove classes e limpa estilos após animação
      setTimeout(() => {
         parentLi.classList.remove('open');
         submenu.style.display = 'none';
         submenu.style.height = '';
         submenu.style.overflow = '';
         submenu.style.transition = '';
         submenu.style.opacity = '';
      }, 300);
   }

   // Inicializa quando o DOM estiver carregado
   if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
         init();
         bindDropdownEvents();
      });
   } else {
      init();
      bindDropdownEvents();
   }

   // API pública
   return {
      renderSidebarMenu: renderSidebarMenu,
      setActiveModule: setActiveModule,
      hasModulePermission: hasModulePermission,
      getModuleData: getModuleData,
      refreshMenu: refreshMenu,
      forceModulesRefresh: forceModulesRefresh,
      init: init
   };

})();

// Expõe globalmente para uso em outras partes do sistema
window.ModuleManager = ModuleManager;
