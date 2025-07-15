// Função para pegar os dados dos inputs e autenticar o usuário
async function login(email, password) {
   const verify_access = await Thefetch('/api/auth/login', 'POST', {email: email, password: password})
   return verify_access;
};

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
      console.log(data_login);

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

               // Extrai os módulos da nova estrutura
               const modules = data_login.data.user.modules || [];
               localStorage.setItem('userModules', JSON.stringify(modules.map(m => m.name)));
            } else if (data_login.user) {
               // Estrutura antiga
               localStorage.setItem('userData', JSON.stringify(data_login.user));
               localStorage.setItem('userModules', JSON.stringify(data_login.modules || ['home']));
            }

            // Salva informações do token
            localStorage.setItem('tokenData', JSON.stringify({
               loginTime: Date.now(),
               expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
            }));
         }

         console.log('✅ Login realizado com sucesso');

         // Redireciona para página principal
         window.location.href = '/pages/home/';
      } else {
         alert('Usuário ou senha inválidos!');
         if (btn_submit) btn_submit.style.display = 'block';
         if (btn_loading) btn_loading.style.display = 'none';
      }
   });
}

document.addEventListener('DOMContentLoaded', function() {
   if (typeof hideLoader === 'function') {
      hideLoader();
   }
   event_click();
});
