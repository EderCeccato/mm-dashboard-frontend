// Função para criar e exibir um toast de erro
function showErrorToast(code, message) {
   // Obtém o container de toasts
   const toastContainer = document.querySelector('.toast-container');

   // Cria um ID único para o toast
   const toastId = 'toast-' + Date.now();

   // Cria o HTML do toast com largura maior para mensagens longas
   const toastHTML = `
      <div id="${toastId}" class="toast colored-toast bg-danger text-fixed-white fade" role="alert" aria-live="assertive" aria-atomic="true" style="max-width: 400px;">
         <div class="toast-header bg-danger text-fixed-white">
            <strong class="me-auto">${code || 'Erro'}</strong>
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

window.addEventListener('DOMContentLoaded', function () {
   const code = this.sessionStorage.getItem('errorCode');
   const msg = this.sessionStorage.getItem('errorMessage');
   if (msg) {
      showErrorToast(code, msg);
      this.sessionStorage.removeItem('errorCode');
      this.sessionStorage.removeItem('errorMessage');
   }
})
