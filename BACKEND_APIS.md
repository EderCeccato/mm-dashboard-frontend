# APIs Backend - Sistema de Acompanhamento de Pedidos

Este documento descreve as APIs que precisam ser implementadas no backend para suportar o sistema de acompanhamento de pedidos.

## 1. Validação de Acesso

### 1.1. Verificar Código Existente (MySQL)
**Endpoint:** `POST /api/acompanhamento/check-access`

**Descrição:** Verifica se um código de acesso já foi validado anteriormente e está salvo no banco MySQL.

**Request Body:**
```json
{
  "accessCode": "ABC123DEF456"
}
```

**Response (Código encontrado):**
```json
{
  "success": true,
  "data": {
    "url": "dajsdasj-343897hisa-kjsahdkasd",
    "nomovtra": "123456",
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-02-15T10:30:00Z"
  },
  "message": "Código de acesso válido"
}
```

**Response (Código não encontrado):**
```json
{
  "success": false,
  "message": "Código de acesso não encontrado"
}
```

---

### 1.2. Validar Novo Código (Firebird → MySQL)
**Endpoint:** `POST /api/acompanhamento/validate-access`

**Descrição:** Valida o código no banco Firebird e, se válido, cria uma URL única no MySQL.

**Request Body:**
```json
{
  "accessCode": "ABC123DEF456"
}
```

**Response (Código válido):**
```json
{
  "success": true,
  "data": {
    "url": "dajsdasj-343897hisa-kjsahdkasd",
    "nomovtra": "123456",
    "expiresAt": "2024-02-15T10:30:00Z"
  },
  "message": "Código validado com sucesso"
}
```

**Response (Código inválido):**
```json
{
  "success": false,
  "message": "Código de acesso inválido ou expirado"
}
```

**Lógica:**
1. Validar código no banco Firebird
2. Se válido, obter dados do pedido (nomovtra, etc.)
3. Gerar hash único para URL
4. Salvar no MySQL: código, hash, nomovtra, data_criacao, data_expiracao
5. Retornar hash para construir URL

---

## 2. Acompanhamento de Pedido

### 2.1. Obter Dados de Acompanhamento
**Endpoint:** `GET /api/acompanhamento/tracking/{hash}`

**Descrição:** Retorna os dados completos do pedido baseado no hash da URL.

**Response:**
```json
{
  "success": true,
  "data": {
    "pedido": {
      "nomovtra": "123456",
      "processo": "PROC001",
      "container": "CONT123",
      "nomstatusfre": "Em Trânsito",
      "color": "#28a745",
      "nomtipcarga": "Carga Geral",
      "destinatario": "Empresa XYZ Ltda",
      "rota": "São Paulo - Rio de Janeiro",
      "motorista": "João Silva",
      "placacav": "ABC1234",
      "placacar": "XYZ5678",
      "nomtipfre": "CIF",
      "nomtipcont": "20'",
      "data": "2024-01-15T08:00:00Z",
      "dataentregue": "2024-01-18T16:30:00Z",
      "vlrfrete": 1500.00,
      "vlrped": 250.00,
      "vlrgris": 75.00,
      "vlrseg": 100.00,
      "icmvlr": 180.00,
      "vlrout": 45.00,
      "totalfrete": 2150.00
    }
  }
}
```

---

## 3. Estrutura do Banco de Dados MySQL

### 3.1. Tabela: `acompanhamento_acessos`
```sql
CREATE TABLE acompanhamento_acessos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_acesso VARCHAR(50) NOT NULL UNIQUE,
    url_hash VARCHAR(100) NOT NULL UNIQUE,
    nomovtra VARCHAR(20) NOT NULL,
    empresa_id INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_expiracao TIMESTAMP,
    ativo BOOLEAN DEFAULT TRUE,

    INDEX idx_codigo_acesso (codigo_acesso),
    INDEX idx_url_hash (url_hash),
    INDEX idx_nomovtra (nomovtra)
);
```

### 3.2. Campos Explicados:
- **codigo_acesso**: Código enviado por email ao cliente
- **url_hash**: Hash único usado na URL de acompanhamento
- **nomovtra**: Número do pedido/movimento no sistema TMS
- **empresa_id**: ID da empresa (para aplicar branding correto)
- **data_expiracao**: Data limite para acesso (ex: 30 dias)
- **ativo**: Flag para desativar acesso se necessário

---

## 4. Fluxo Completo

### 4.1. Sistema Externo Gera Código
1. Sistema externo gera código único
2. Envia email com código e link: `dominio.com.br/validacao-acesso`

### 4.2. Cliente Acessa Sistema
1. Cliente acessa `/validacao-acesso`
2. Insere código recebido por email
3. Sistema verifica se código já existe no MySQL:
   - Se existe: redireciona para `/acompanhamento/{hash}`
   - Se não existe: valida no Firebird
4. Se válido no Firebird:
   - Gera hash único
   - Salva no MySQL
   - Redireciona para `/acompanhamento/{hash}`

### 4.3. Visualização do Acompanhamento
1. Cliente acessa `/acompanhamento/{hash}`
2. Sistema busca dados do pedido pelo hash
3. Exibe tela completa de acompanhamento
4. Dados são atualizados automaticamente

---

## 5. Branding da Empresa

As APIs podem retornar dados de branding baseados na empresa do pedido:

```json
{
  "branding": {
    "primaryColor": "#6c63ff",
    "logo": "https://exemplo.com/logo.png",
    "companyName": "Empresa XYZ"
  }
}
```

Isso permite que cada cliente tenha sua própria identidade visual na tela de acompanhamento.

---

## 6. Segurança e Validações

- URLs têm data de expiração
- Hash é único e não previsível
- Validação de origem do código
- Rate limiting nas APIs de validação
- Log de acessos para auditoria

---

## 7. Exemplo de Implementação

### Backend (Node.js/Express):
```javascript
// Validar código
router.post('/acompanhamento/validate-access', async (req, res) => {
  const { accessCode } = req.body;

  try {
    // 1. Verificar no MySQL primeiro
    const existing = await checkExistingAccess(accessCode);
    if (existing) {
      return res.json({ success: true, data: existing });
    }

    // 2. Validar no Firebird
    const firebirdResult = await validateInFirebird(accessCode);
    if (!firebirdResult.valid) {
      return res.json({ success: false, message: 'Código inválido' });
    }

    // 3. Criar novo acesso no MySQL
    const urlHash = generateUniqueHash();
    await createAccess({
      accessCode,
      urlHash,
      nomovtra: firebirdResult.nomovtra,
      empresaId: firebirdResult.empresaId
    });

    res.json({
      success: true,
      data: { url: urlHash, nomovtra: firebirdResult.nomovtra }
    });

  } catch (error) {
    console.error('Erro na validação:', error);
    res.status(500).json({ success: false, message: 'Erro interno' });
  }
});
```
