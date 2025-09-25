# Sistema de Acompanhamento de Pedidos

Sistema público para acompanhamento de pedidos TMS via código de acesso enviado por email.

## 🚀 Funcionalidades

- **Validação de Acesso**: Tela para inserir código recebido por email
- **Acompanhamento Completo**: Visualização detalhada do pedido com:
  - Informações gerais do pedido
  - Dados de transporte e motorista
  - Valores e custos
  - Rastreamento GPS em mapa
  - Ocorrências do processo
  - Follow-ups
  - Documentos anexos
  - Comprovantes de entrega
- **Branding Personalizado**: Cada empresa pode ter suas cores e logo
- **Tema Claro/Escuro**: Alternância de temas
- **Responsivo**: Funciona em desktop e mobile
- **Atualização Automática**: Dados são atualizados a cada 5 minutos

## 📁 Estrutura dos Arquivos

```
app/public/pages/
├── validacao-acesso/           # Tela de validação de código
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── script.js
└── acompanhamento/             # Tela de acompanhamento
    ├── index.html
    ├── css/
    │   └── styles.css
    └── js/
        └── script.js
```

## 🌐 Rotas

### Públicas (sem autenticação)
- `/validacao-acesso` - Tela para inserir código de acesso
- `/acompanhamento/{hash}` - Tela de acompanhamento do pedido
- `/acompanhamento` - Redireciona para validação de acesso

### URLs de Exemplo
```
https://dominio.com.br/validacao-acesso
https://dominio.com.br/acompanhamento/abc123def456-789xyz
```

## 🔄 Fluxo de Uso

### 1. Sistema Externo
```javascript
// Sistema externo gera código e envia email
const accessCode = generateAccessCode(); // Ex: "TMS2024001"
const trackingUrl = "https://dominio.com.br/validacao-acesso";

sendEmail({
  to: customer.email,
  subject: "Acompanhe seu pedido",
  body: `
    Código de acesso: ${accessCode}
    Link: ${trackingUrl}
  `
});
```

### 2. Cliente Acessa Sistema
1. Cliente recebe email com código e link
2. Acessa `/validacao-acesso`
3. Insere código recebido
4. Sistema valida e gera URL única
5. Redireciona para `/acompanhamento/{hash}`

### 3. Visualização
- Tela completa sem sidebar ou menu
- Todas as informações do modal TMS
- Mapa de rastreamento
- Atualização automática dos dados

## 🎨 Branding Personalizado

O sistema aplica automaticamente as cores e logo da empresa baseado nos dados salvos no localStorage:

```javascript
// Estrutura do branding salvo
const branding = {
  primaryColor: "#6c63ff",      // Cor primária da empresa
  logo: "https://example.com/logo.png",  // URL da logo
  companyName: "Empresa XYZ"    // Nome da empresa
};

localStorage.setItem('companyBranding', JSON.stringify(branding));
```

### Como o Branding é Aplicado
1. **Cor Primária**: Aplicada em botões, badges, títulos
2. **Logo**: Exibida no header das telas
3. **Responsivo**: Logo se adapta ao tamanho da tela

## 📱 Responsividade

### Desktop (>= 768px)
- Layout com cards em grid
- Abas horizontais completas
- Mapa em tamanho grande (500px)

### Mobile (< 768px)
- Cards empilhados
- Abas com texto reduzido
- Mapa menor (400px)
- Botões e inputs maiores

## 🔧 APIs Necessárias

Ver arquivo `BACKEND_APIS.md` para detalhes completos das APIs que devem ser implementadas no backend.

### Principais Endpoints
```
POST /api/acompanhamento/check-access       # Verificar código existente
POST /api/acompanhamento/validate-access    # Validar novo código
GET  /api/acompanhamento/tracking/{hash}    # Obter dados do pedido
```

## 🗄️ Banco de Dados

### MySQL - Tabela de Controle
```sql
CREATE TABLE acompanhamento_acessos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_acesso VARCHAR(50) NOT NULL UNIQUE,
    url_hash VARCHAR(100) NOT NULL UNIQUE,
    nomovtra VARCHAR(20) NOT NULL,
    empresa_id INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE
);
```

### Firebird - Validação Original
- Usa as tabelas existentes do TMS
- Valida códigos de acesso
- Retorna dados do pedido

## 🔐 Segurança

### Medidas Implementadas
1. **URLs Únicas**: Hash não previsível para cada acesso
2. **Expiração**: Links têm data de validade
3. **Validação**: Códigos são validados no sistema origem
4. **Rate Limiting**: Previne abuso das APIs
5. **Logs**: Auditoria de acessos

### Exemplo de Hash Único
```javascript
function generateUniqueHash() {
  return crypto.randomBytes(32).toString('hex') + '-' + Date.now();
}
// Resultado: "a1b2c3d4e5f6...789xyz-1642680000000"
```

## 🚦 Estados da Aplicação

### Validação de Acesso
- ✅ **Inicial**: Formulário para inserir código
- 🔄 **Validando**: Verificando código no backend
- ✅ **Sucesso**: Código válido, redirecionando
- ❌ **Erro**: Código inválido ou erro de sistema

### Acompanhamento
- 🔄 **Carregando**: Buscando dados do pedido
- ✅ **Dados Carregados**: Mostrando informações completas
- 🔄 **Atualizando**: Refresh automático dos dados
- ❌ **Erro**: Falha ao carregar dados

## 🎯 Recursos Avançados

### Atualização Automática
```javascript
// Atualiza dados a cada 5 minutos
setInterval(() => {
  this.refreshData();
}, 5 * 60 * 1000);
```

### Mapa Interativo
- Usa Leaflet.js
- Mostra localização atual do veículo
- Popup com detalhes da localização
- Fallback quando não há GPS

### Theme Switcher
- Alternância entre claro/escuro/auto
- Salva preferência no localStorage
- Aplicado em toda a interface

## 📦 Dependências

### CSS/JS Frameworks
- **Bootstrap 5**: Layout e componentes
- **Bootstrap Icons**: Ícones
- **Leaflet**: Mapas interativos
- **SweetAlert2**: Alertas elegantes

### Estrutura Base
- Usa os mesmos assets do sistema principal
- Reutiliza estilos e componentes existentes
- Mantém consistência visual

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Backend
```bash
# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com as URLs corretas do backend
```

### 3. Executar
```bash
npm start
# Servidor rodando em http://localhost:3000
```

### 4. Testar
```
# Acessar validação
http://localhost:3000/validacao-acesso

# Acessar acompanhamento (com hash válido)
http://localhost:3000/acompanhamento/abc123def456
```

## 📋 TODO Backend

Para finalizar a implementação, é necessário:

1. ✅ Criar APIs de validação no backend
2. ✅ Implementar tabela MySQL de controle
3. ✅ Integrar validação com Firebird
4. ✅ Implementar geração de hashes únicos
5. ✅ Adicionar sistema de expiração
6. ✅ Configurar logs de auditoria
7. ✅ Implementar rate limiting
8. ✅ Testar fluxo completo

## 🤝 Contribuição

1. Clone o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Teste em diferentes tamanhos de tela
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique os logs do browser (F12 → Console)
- Confira as APIs do backend
- Valide as configurações de branding
- Teste a conectividade com o backend
