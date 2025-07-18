/**
 * Menu Manager - Gerencia o estado do menu lateral
 */

const MenuManager = (function() {
  'use strict';

  const STORAGE_KEY = 'menu_state';

  /**
   * Inicializa o gerenciador de menu
   */
  function init() {
    // Verifica o estado salvo no localStorage
    const savedState = localStorage.getItem(STORAGE_KEY);

    const html = document.documentElement;

    if (savedState === 'closed') {
      // Se estava fechado, aplica o estado fechado
      html.setAttribute('data-toggled', 'icon-overlay-close');
    } else {
      // Se estava aberto ou não há estado salvo, inicia aberto
      html.setAttribute('data-toggled', 'open');
    }

    // Configura o listener para salvar quando o usuário clicar
    setupEventListeners();
  }

  /**
   * Configura os event listeners para capturar cliques no botão do menu
   */
  function setupEventListeners() {
    document.addEventListener('click', function(event) {
      const toggleElement = event.target.closest('.sidemenu-toggle') ||
                           event.target.closest('.horizontal-navtoggle') ||
                           event.target.closest('[data-bs-toggle="sidebar"]');

      if (toggleElement) {

        // Aguarda o defaultmenu.min.js processar o clique
        setTimeout(() => {
          const html = document.documentElement;
          const currentState = html.getAttribute('data-toggled');

          // Determina se está aberto ou fechado
          let menuState;
          if (currentState && currentState.includes('close')) {
            menuState = 'closed';
          } else {
            menuState = 'open';
          }

          // Salva no localStorage
          localStorage.setItem(STORAGE_KEY, menuState);

        }, 1);
      }
    });

  }

  // Inicializar quando o DOM estiver carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init
  };
})();
