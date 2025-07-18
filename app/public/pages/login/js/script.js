// Função para pegar os dados dos inputs e autenticar o usuário
async function login(email, password) {
   const verify_access = await Thefetch('/api/auth/login', 'POST', {email: email, password: password})
   return verify_access;
};

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

// Função para criar e exibir um toast de erro
function showErrorToast(message) {
   // Obtém o container de toasts
   const toastContainer = document.querySelector('.toast-container');

   // Cria um ID único para o toast
   const toastId = 'toast-' + Date.now();

   // Cria o HTML do toast
   const toastHTML = `
      <div id="${toastId}" class="toast colored-toast bg-danger text-fixed-white fade" role="alert" aria-live="assertive" aria-atomic="true">
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
      delay: 5000, // Tempo em ms que o toast ficará visível
      autohide: true
   });

   // Adiciona evento para remover o elemento do DOM após o toast ser escondido
   toastElement.addEventListener('hidden.bs.toast', function () {
      toastElement.remove();
   });

   // Exibe o toast
   toast.show();
}

function event_click() {
   // Fazer Login
   const signin_email = document.getElementById('signin-email');
   const signin_password = document.getElementById('signin-password');
   const btn_submit = document.querySelector('.btn.btn-primary');
   const btn_loading = document.querySelector('.btn-loader');

   btn_submit.addEventListener('click', async function(e) {
      e.preventDefault();
      if (btn_submit) btn_submit.style.display = 'none';
      if (btn_loading) btn_loading.style.display = 'flex';

      const data_login = await login(signin_email.value, signin_password.value);

      if (data_login && data_login.success) {
         // Salva os dados da sessão usando o AuthManager
         if (window.AuthManager) {
            // Passa a resposta completa para o AuthManager processar
            AuthManager.saveAuthData(data_login);
         } else {
            // Fallback caso o AuthManager não esteja carregado
            // Verifica a estrutura da resposta
            if (data_login.data && data_login.data.user) {
               // Nova estrutura
               localStorage.setItem('userData', JSON.stringify(data_login.data.user));
               console.log(data_login);


               // Extrai os módulos da nova estrutura
               const modules = data_login.data.user.modules || [];
               localStorage.setItem('userModules', JSON.stringify(modules.map(m => m.name)));
            } else if (data_login.user) {
               // Estrutura antiga
               localStorage.setItem('userData', JSON.stringify(data_login.user));
               localStorage.setItem('userModules', JSON.stringify(data_login.modules));
            }

            // Salva informações do token
            localStorage.setItem('tokenData', JSON.stringify({
               loginTime: Date.now(),
               expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
            }));
         }

         const successMessage = data_login && data_login.message ? data_login.message : 'Login realizado com sucesso';
         showSuccessToast(successMessage);

         setTimeout(() => {
            // Redireciona para página principal
            window.location.href = '/pages/home/';
         }, 1000);
      } else {
         // Exibe o toast com a mensagem de erro do servidor
         const errorMessage = data_login && data_login.message ? data_login.message : 'Email ou senha inválidos';
         showErrorToast(errorMessage);

         // Restaura os botões
         if (btn_submit) btn_submit.style.display = 'block';
         if (btn_loading) btn_loading.style.display = 'none';
      }
   });
}

// Inicializa a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async function() {
   // Registra eventos
   event_click();
});
