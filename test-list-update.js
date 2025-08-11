// Teste para verificar a atualização da lista de usuários
console.log('🧪 Teste de atualização da lista de usuários');

// Função para verificar o estado atual da lista
function checkCurrentList() {
   console.log('📋 Verificando lista atual de usuários...');

   if (typeof window.UsersManager !== 'undefined') {
      console.log('📊 Total de usuários na lista:', window.UsersManager.users ? window.UsersManager.users.length : 0);

      if (window.UsersManager.users && window.UsersManager.users.length > 0) {
         console.log('📋 Primeiros 3 usuários:');
         window.UsersManager.users.slice(0, 3).forEach((user, index) => {
            console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.user_type}`);
         });
      } else {
         console.log('⚠️ Lista de usuários vazia');
      }
   } else {
      console.log('❌ UsersManager não está disponível');
   }
}

// Função para simular adição de usuário à lista
function simulateAddUser() {
   console.log('🧪 Simulando adição de usuário à lista...');

   if (typeof window.UsersManager !== 'undefined' && window.UsersManager.users) {
      const mockUser = {
         id: 999,
         uuid: 'test-uuid-' + Date.now(),
         name: 'Usuário Teste',
         email: 'teste@exemplo.com',
         user_type: 'user',
         status: 'active',
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
      };

      console.log('📋 Usuário mock criado:', mockUser);

      // Adiciona no início da lista
      window.UsersManager.users.unshift(mockUser);

      // Re-renderiza a tabela
      if (typeof window.UsersManager.renderTableUsers === 'function') {
         window.UsersManager.renderTableUsers();
         console.log('✅ Tabela re-renderizada');
      }

      console.log('✅ Usuário adicionado à lista');
      console.log('📊 Total de usuários agora:', window.UsersManager.users.length);

      return mockUser;
   } else {
      console.log('❌ UsersManager não está disponível');
      return null;
   }
}

// Função para verificar se a tabela foi atualizada
function checkTableUpdate() {
   console.log('🔍 Verificando se a tabela foi atualizada...');

   const tbody = document.querySelector('#table-users tbody');
   if (tbody) {
      const rows = tbody.querySelectorAll('tr');
      console.log('📊 Linhas na tabela:', rows.length);

      if (rows.length > 0) {
         console.log('📋 Primeira linha da tabela:');
         console.log('  - HTML:', rows[0].innerHTML.substring(0, 200) + '...');

         // Verificar se tem o usuário teste
         const hasTestUser = Array.from(rows).some(row =>
            row.textContent.includes('Usuário Teste')
         );

         if (hasTestUser) {
            console.log('✅ Usuário teste encontrado na tabela!');
         } else {
            console.log('❌ Usuário teste não encontrado na tabela');
         }
      }
   } else {
      console.log('❌ Tabela não encontrada');
   }
}

// Função para testar o fluxo completo
function testCompleteFlow() {
   console.log('🚀 Testando fluxo completo...');

   // 1. Verificar estado inicial
   console.log('\n--- Passo 1: Estado inicial ---');
   checkCurrentList();

   // 2. Simular adição de usuário
   console.log('\n--- Passo 2: Adicionando usuário ---');
   const addedUser = simulateAddUser();

   if (addedUser) {
      // 3. Verificar se a tabela foi atualizada
      console.log('\n--- Passo 3: Verificando tabela ---');
      checkTableUpdate();

      // 4. Verificar estado final
      console.log('\n--- Passo 4: Estado final ---');
      checkCurrentList();

      console.log('\n✅ Teste completo finalizado!');
   } else {
      console.log('\n❌ Teste falhou - não foi possível adicionar usuário');
   }
}

// Função para verificar a estrutura da resposta da API
function checkAPIResponseStructure() {
   console.log('🔍 Verificando estrutura da resposta da API...');

   // Simular diferentes estruturas de resposta
   const mockResponses = [
      {
         success: true,
         data: {
            id: 1,
            uuid: 'test-uuid-1',
            name: 'João Silva',
            email: 'joao@exemplo.com',
            user_type: 'user'
         }
      },
      {
         success: true,
         user: {
            id: 2,
            uuid: 'test-uuid-2',
            name: 'Maria Santos',
            email: 'maria@exemplo.com',
            user_type: 'admin'
         }
      },
      {
         success: true,
         data: null,
         user: {
            id: 3,
            uuid: 'test-uuid-3',
            name: 'Pedro Costa',
            email: 'pedro@exemplo.com',
            user_type: 'client'
         }
      }
   ];

   mockResponses.forEach((response, index) => {
      console.log(`\n📋 Resposta ${index + 1}:`, response);

      const userData = response.data || response.user;
      if (userData) {
         console.log(`✅ Dados de usuário encontrados:`, userData);
      } else {
         console.log(`❌ Nenhum dado de usuário encontrado`);
      }
   });
}

// Expor funções para uso no console
window.ListUpdateTests = {
   checkCurrentList,
   simulateAddUser,
   checkTableUpdate,
   testCompleteFlow,
   checkAPIResponseStructure
};

console.log('✅ Script de teste carregado. Use:');
console.log('  - ListUpdateTests.checkCurrentList() para verificar lista atual');
console.log('  - ListUpdateTests.simulateAddUser() para simular adição');
console.log('  - ListUpdateTests.checkTableUpdate() para verificar tabela');
console.log('  - ListUpdateTests.testCompleteFlow() para teste completo');
console.log('  - ListUpdateTests.checkAPIResponseStructure() para verificar API');
