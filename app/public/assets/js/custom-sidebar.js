// Script para gerenciar o estado do menu lateral
document.addEventListener('DOMContentLoaded', function() {
  // Função para salvar o estado do menu no localStorage
  function saveMenuState(state) {
    localStorage.setItem('menu_state', state);
    console.log('Menu state saved:', state);
  }

  // Função para carregar o estado do menu do localStorage
  function loadMenuState() {
    return localStorage.getItem('menu_state') || 'open';
  }

  // Aplicar o estado inicial
  const initialState = loadMenuState();
  document.documentElement.setAttribute('data-toggled', initialState);

  // Adicionar listener para o botão de toggle do menu
  const sidebarToggleBtn = document.querySelector('a.sidemenu-toggle.horizontal-navtoggle');
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', function() {
      // Aguardar um momento para que o DOM seja atualizado
      setTimeout(function() {
        const currentState = document.documentElement.getAttribute('data-toggled');
        saveMenuState(currentState);
      }, 100);
    });
  }

  // Adicionar listener para todos os botões que possam alterar o estado do menu
  document.addEventListener('click', function(e) {
    // Verificar se o clique foi em um botão que altera o menu
    if (e.target.closest('[data-bs-toggle="sidebar"]') ||
        e.target.closest('.sidemenu-toggle') ||
        e.target.closest('.horizontal-navtoggle')) {

      // Aguardar um momento para que o DOM seja atualizado
      setTimeout(function() {
        const currentState = document.documentElement.getAttribute('data-toggled');
        saveMenuState(currentState);
      }, 100);
    }
  });
});
