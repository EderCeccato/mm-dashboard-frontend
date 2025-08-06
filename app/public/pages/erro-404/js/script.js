// Função para criar e exibir um toast de erro simples para o usuário
function showErrorToast(code, message) {
   // Obtém o container de toasts
   const toastContainer = document.querySelector('.toast-container');

   // Cria um ID único para o toast
   const toastId = 'toast-' + Date.now();

   // Toast simples para o usuário (sem detalhes técnicos)
   const toastHTML = `
      <div id="${toastId}" class="toast colored-toast bg-danger text-fixed-white fade" role="alert" aria-live="assertive" aria-atomic="true" style="max-width: 400px;">
         <div class="toast-header bg-danger text-fixed-white">
            <strong class="me-auto">${code || 'Erro'}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
         </div>
         <div class="toast-body">
            ${message || 'A página que você está procurando não foi encontrada.'}
         </div>
      </div>
   `;

   // Adiciona o toast ao container
   toastContainer.insertAdjacentHTML('afterbegin', toastHTML);

   // Obtém a referência ao elemento do toast
   const toastElement = document.getElementById(toastId);

   // Inicializa o toast com o Bootstrap
   const toast = new bootstrap.Toast(toastElement, {
      delay: 8000,
      autohide: true
   });

   // Adiciona evento para remover o elemento do DOM após o toast ser escondido
   toastElement.addEventListener('hidden.bs.toast', function () {
      toastElement.remove();
   });

   // Exibe o toast
   toast.show();
}

// Função para exibir relatório detalhado de todos os erros da sessão
function displaySessionErrorReport() {
   // Usa o ErrorCollector para exibir todos os erros coletados
   if (window.ErrorCollector) {
      console.log('\n🔍 INICIANDO ANÁLISE DE ERROS DA SESSÃO...\n');
      ErrorCollector.displayErrorReport();
   } else {
      console.warn('❌ Sistema ErrorCollector não encontrado');
   }
}

window.addEventListener('DOMContentLoaded', function () {
   // Exibe o toast simples para o usuário
   const code = this.sessionStorage.getItem('errorCode');
   const msg = this.sessionStorage.getItem('errorMessage');
   if (msg) {
      showErrorToast(code, msg);
      // Limpa dados básicos do erro
      this.sessionStorage.removeItem('errorCode');
      this.sessionStorage.removeItem('errorMessage');
   }

   // Exibe relatório completo de erros para debug (com delay para não conflitar)
   setTimeout(function() {
      displaySessionErrorReport();
   }, 1000);
})
