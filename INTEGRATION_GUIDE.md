# 🚀 Guia de Integração PingPague

Este documento descreve a arquitetura técnica, integrações e configurações necessárias para o funcionamento completo do sistema PingPague.

## 📋 Arquitetura do Sistema

### Stack Tecnológico

#### Frontend
- **React 18** + TypeScript
- **Vite** como build tool
- **Tailwind CSS** + shadcn/ui
- **React Query** para cache e sincronização

#### Backend (Supabase)
- **PostgreSQL** - Banco de dados relacional
- **Edge Functions** - Funções serverless em Deno
- **Authentication** - Sistema completo de auth
- **Row Level Security (RLS)** - Segurança em nível de linha

#### Integrações Externas
- **Evolution API v2** - Envio de mensagens WhatsApp

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `profiles`
Armazena informações adicionais dos usuários.
```sql
- id (uuid, FK para auth.users)
- full_name (text)
- phone (text)
- pix_key (text)
- bank_name (text)
- bank_agency (text)
- bank_account (text)
- bank_account_type (text)
- profile_completed (boolean)
- created_at (timestamp)
```

#### `clients`
Cadastro de clientes do usuário.
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- name (text)
- phone (text)
- email (text)
- total_charged (numeric)
- total_paid (numeric)
- overdue_count (integer)
- last_payment_date (date)
- created_at (timestamp)
```

#### `charges`
Cobranças criadas pelo usuário.
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- client_id (uuid, FK)
- amount (numeric)
- due_date (date)
- status (payment_status: pending, paid, overdue, canceled)
- is_recurrent (boolean)
- recurrence_interval (text: weekly, biweekly, monthly, quarterly, yearly)
- recurrence_day (integer)
- next_charge_date (date)
- parent_charge_id (uuid)
- payment_link (text)
- notes (text)
- paid_at (timestamp)
- canceled_at (timestamp)
- last_notification_sent_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `notifications`
Histórico de notificações enviadas.
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- client_id (uuid, FK)
- charge_id (uuid, FK)
- notification_type (text: reminder, overdue, payment_confirmed)
- channel (text: whatsapp)
- message_content (text)
- status (text: sent, failed)
- sent_at (timestamp)
```

### Funções do Banco de Dados

#### `update_overdue_charges()`
Atualiza automaticamente o status de cobranças vencidas.
```sql
UPDATE charges
SET status = 'overdue'
WHERE status = 'pending' AND due_date < CURRENT_DATE;
```

#### `update_client_stats()`
Trigger que atualiza estatísticas do cliente após mudanças em cobranças.

---

## 🔧 Edge Functions

### 1. `check-overdue-charges`

**Função:** Verifica cobranças vencidas e envia notificações automáticas via WhatsApp.

**Execução:** Deve ser chamada diariamente via cron job.

**Fluxo de Operação:**
1. Atualiza status de cobranças vencidas (chama `update_overdue_charges()`)
2. Busca cobranças que vencem em 2 dias (para enviar lembretes)
3. Busca cobranças já vencidas (para enviar alertas)
4. Busca chaves PIX dos usuários
5. Cria registros na tabela `notifications`
6. Envia mensagens via Evolution API
7. Atualiza `last_notification_sent_at`

**Endpoint:**
```
POST https://dzqkcrxcivlnuoniyqab.supabase.co/functions/v1/check-overdue-charges
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "remindersSent": 5,
  "overdueAlerts": 2
}
```

**Mensagens Enviadas:**

*Lembrete (2 dias antes):*
```
Olá {nome}! Lembramos que sua cobrança de R$ {valor} vence em 2 dias ({data}). 
Por favor, não deixe para última hora! 
Chave PIX para pagamento: {pix_key}
```

*Alerta de Atraso:*
```
Olá {nome}! Sua cobrança de R$ {valor} está vencida desde {data}. 
Por favor, regularize seu pagamento. 
Chave PIX para pagamento: {pix_key}
```

---

### 2. `payment-webhook`

**Função:** Processa confirmações de pagamento de gateways (webhook).

**Uso:** Endpoint para receber webhooks de gateways de pagamento.

**Fluxo de Operação:**
1. Recebe payload do gateway de pagamento
2. Atualiza status da cobrança para `paid`
3. Registra data de pagamento (`paid_at`)
4. Busca chave PIX do usuário
5. Cria notificação de confirmação
6. Envia mensagem de confirmação via WhatsApp
7. Se for cobrança recorrente, cria a próxima cobrança automaticamente

**Endpoint:**
```
POST https://dzqkcrxcivlnuoniyqab.supabase.co/functions/v1/payment-webhook
```

**Payload Esperado:**
```json
{
  "charge_id": "uuid-da-cobranca",
  "status": "paid",
  "paid_at": "2025-01-15T10:30:00Z"
}
```

**Mensagem de Confirmação:**
```
Pagamento confirmado! Obrigado, {nome}! Recebemos seu pagamento de R$ {valor}. 
Chave PIX: {pix_key}
```

---

## 📱 Integração com Evolution API v2

### Configuração Inicial

A Evolution API v2 é usada para envio de mensagens WhatsApp. Você precisa:

1. **Instalar Evolution API**: [Documentação oficial](https://doc.evolution-api.com/v2/)
2. **Criar uma instância**: Conecte seu WhatsApp
3. **Obter credenciais**: API Key e Instance ID

### Secrets Necessários no Supabase

Configure os seguintes secrets nas Edge Functions:

```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key-aqui
EVOLUTION_INSTANCE_ID=seu-instance-id-aqui
```

**Como configurar secrets:**
1. Acesse o painel do Supabase
2. Vá em Edge Functions → Settings
3. Adicione os secrets acima

### Exemplo de Requisição

```typescript
const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_ID}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
  },
  body: JSON.stringify({
    number: phone, // Formato: 5511999999999
    text: message,
  }),
});
```

### Formatos de Telefone

- **Entrada no sistema**: (11) 99999-9999
- **Processado para API**: 5511999999999
- Remoção automática de caracteres especiais

---

## ⚙️ Configuração do Cron Job

Para executar a verificação automática de cobranças vencidas, configure um cron job para chamar a edge function `check-overdue-charges` diariamente.

### Opção 1: Cron via Supabase (Recomendado)

```sql
-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar verificação diária às 9h (horário UTC)
SELECT cron.schedule(
  'check-overdue-charges-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://dzqkcrxcivlnuoniyqab.supabase.co/functions/v1/check-overdue-charges',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4eXJoenZ6b2ZyeHdreGFlaGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDU5MTQsImV4cCI6MjA3NzMyMTkxNH0.zFBqiwu01DLorio9i_5RYOP5CsHVl6OItCgsNkNspIs"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### Opção 2: Cron Externo

Use serviços como [cron-job.org](https://cron-job.org) ou [EasyCron](https://www.easycron.com):

**URL para chamar:**
```
POST https://dzqkcrxcivlnuoniyqab.supabase.co/functions/v1/check-overdue-charges
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4eXJoenZ6b2ZyeHdreGFlaGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDU5MTQsImV4cCI6MjA3NzMyMTkxNH0.zFBqiwu01DLorio9i_5RYOP5CsHVl6OItCgsNkNspIs
```

**Frequência:** Diariamente às 9h

---

## 💰 Integração com Gateway de Pagamento

### Fluxo de Pagamento

1. **Usuário cria cobrança** no sistema
2. **Sistema pode gerar link de pagamento** (via gateway)
3. **Cliente recebe notificação** com link e/ou chave PIX
4. **Cliente efetua pagamento**
5. **Gateway envia webhook** para `payment-webhook`
6. **Sistema processa** e confirma pagamento
7. **Cliente recebe confirmação** via WhatsApp

### Exemplo: Integração com Mercado Pago

#### 1. Criar Pagamento PIX

```typescript
// Edge Function ou backend
import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
});

const payment = await mercadopago.payment.create({
  transaction_amount: 100.00,
  description: 'Cobrança PingPague',
  payment_method_id: 'pix',
  payer: {
    email: 'cliente@email.com',
  },
  metadata: {
    charge_id: 'uuid-da-cobranca-pingpague'
  }
});

const pixQrCode = payment.point_of_interaction.transaction_data.qr_code;
const pixCopyPaste = payment.point_of_interaction.transaction_data.qr_code_base64;
```

#### 2. Configurar Webhook no Mercado Pago

No painel do Mercado Pago:
1. Vá em Configurações → Webhooks
2. Adicione a URL: `https://dzqkcrxcivlnuoniyqab.supabase.co/functions/v1/payment-webhook`
3. Selecione eventos: `payment.created`, `payment.updated`

#### 3. Adaptar Edge Function

Ajuste o `payment-webhook` para processar o payload do Mercado Pago:

```typescript
// Mercado Pago envia:
{
  "action": "payment.updated",
  "data": {
    "id": "123456789"
  }
}

// Buscar detalhes do pagamento:
const paymentDetails = await mercadopago.payment.get(data.id);
const charge_id = paymentDetails.metadata.charge_id;
const status = paymentDetails.status; // "approved"
```

### Exemplo: Integração com Gerencianet (Efí)

```typescript
import EfiPay from 'gn-api-sdk-node';

const options = {
  client_id: process.env.GERENCIANET_CLIENT_ID,
  client_secret: process.env.GERENCIANET_CLIENT_SECRET,
  sandbox: false
};

const efipay = new EfiPay(options);

const body = {
  calendario: { expiracao: 3600 },
  devedor: { 
    cpf: '12345678909', 
    nome: 'Nome do Cliente' 
  },
  valor: { original: '100.00' }
};

const charge = await efipay.pixCreateImmediateCharge([], body);
const pixCopyPaste = charge.pixCopiaECola;
const qrCodeImage = charge.imagemQrcode;
```

---

## 🔐 Segurança

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS configuradas:

```sql
-- Exemplo: Tabela charges
CREATE POLICY "Users can view own charges"
  ON charges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own charges"
  ON charges FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Secrets Management

✅ Todas as chaves API são armazenadas como **Supabase Secrets**
✅ Nunca expor secrets no código frontend
✅ Edge Functions acessam secrets via `Deno.env.get()`

### HTTPS Obrigatório

✅ Todas as comunicações usam HTTPS
✅ Webhooks só aceitam requisições HTTPS

---

## 📊 Monitoramento e Logs

### Logs das Edge Functions

**Acessar logs:**
1. Supabase Dashboard → Edge Functions
2. Selecione a função
3. Veja logs em tempo real

**Exemplo de log:**
```
[check-overdue-charges] Reminders sent: 5
[check-overdue-charges] Overdue alerts: 2
[payment-webhook] Payment confirmed for charge: abc-123
[payment-webhook] Next charge created: def-456
```

### Métricas Importantes

- Taxa de envio de notificações bem-sucedidas
- Tempo de resposta da Evolution API
- Cobranças vencidas x pagas
- Taxa de inadimplência por cliente

---

## 🎯 Checklist de Implementação

### ✅ Já Implementado
- [x] Sistema de autenticação
- [x] CRUD de clientes e cobranças
- [x] Dashboard com métricas e gráficos
- [x] Sistema de cobranças recorrentes
- [x] Edge Functions (check-overdue-charges, payment-webhook)
- [x] Histórico de notificações com filtros
- [x] Exportação de relatórios CSV
- [x] Perfil do usuário com dados bancários e PIX

### 🔧 Configuração Necessária
- [ ] Configurar Evolution API v2
  - [ ] Instalar e configurar instância
  - [ ] Conectar WhatsApp
  - [ ] Obter API Key e Instance ID
- [ ] Adicionar secrets no Supabase
  - [ ] EVOLUTION_API_URL
  - [ ] EVOLUTION_API_KEY
  - [ ] EVOLUTION_INSTANCE_ID
- [ ] Configurar cron job diário
  - [ ] Via pg_cron no Supabase (recomendado)
  - [ ] Ou via serviço externo
- [ ] (Opcional) Integrar gateway de pagamento
  - [ ] Mercado Pago, Gerencianet ou outro
  - [ ] Configurar webhook
  - [ ] Adaptar payload no payment-webhook

### 🧪 Testes
- [ ] Testar envio de notificações via WhatsApp
- [ ] Testar criação de cobrança recorrente
- [ ] Testar webhook de pagamento
- [ ] Testar filtros e paginação
- [ ] Verificar logs das Edge Functions

---

## 📞 Suporte e Documentações

### Documentações Externas
- [Supabase](https://supabase.com/docs)
- [Evolution API v2](https://doc.evolution-api.com/v2/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [React](https://react.dev)

### Solução de Problemas Comuns

**❌ Mensagens WhatsApp não estão sendo enviadas**
- Verifique se os secrets estão configurados corretamente
- Confirme que o Instance ID da Evolution API está ativo
- Verifique logs da Edge Function `check-overdue-charges`

**❌ Webhook de pagamento não está funcionando**
- Confirme que a URL do webhook está correta no gateway
- Verifique se o payload está no formato esperado
- Veja logs da Edge Function `payment-webhook`

**❌ Cobranças recorrentes não são criadas automaticamente**
- Verifique se `is_recurrent` está `true`
- Confirme que `recurrence_interval` e `recurrence_day` estão preenchidos
- Veja logs do `payment-webhook` após pagamento

---

## 🔄 Atualizações Futuras

### Próximas Melhorias Planejadas
- [ ] Integração com mais gateways de pagamento
- [ ] Envio de mensagens por SMS
- [ ] Relatórios avançados e BI
- [ ] App mobile (React Native)
- [ ] Sistema de créditos e débitos
- [ ] Múltiplos métodos de pagamento por cobrança

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2025
