# 💰 PingPague

Sistema completo de gestão de cobranças com envio automático via WhatsApp, desenvolvido para facilitar o controle financeiro e a comunicação com clientes.

## 📖 Sobre o Projeto

**PingPague** é uma solução web moderna para profissionais autônomos e pequenas empresas que precisam gerenciar cobranças de forma eficiente. O sistema automatiza o processo de criação, acompanhamento e envio de lembretes de pagamento via WhatsApp, reduzindo a inadimplência e economizando tempo.

### Para quem é?
- Profissionais liberais (dentistas, psicólogos, advogados, etc.)
- Personal trainers e professores particulares
- Prestadores de serviços recorrentes
- Pequenos negócios que precisam cobrar clientes regularmente

### Problema que resolve
- **Inadimplência**: Envio automático de lembretes antes do vencimento
- **Tempo perdido**: Automatização completa de cobranças recorrentes
- **Desorganização**: Dashboard centralizado com todas as informações financeiras
- **Comunicação manual**: Mensagens automáticas via WhatsApp

## ✨ Principais Funcionalidades

### 📊 Dashboard Completo
- Métricas em tempo real: valores recebidos, pendentes e em atraso
- Gráficos de recebimentos dos últimos 7 dias
- Distribuição visual de valores (gráfico de pizza)
- Lista de cobranças recentes
- Estatísticas de clientes

### 👥 Gestão de Clientes
- Cadastro completo de clientes (nome, telefone, email)
- Histórico individual de cobranças por cliente
- Total cobrado, pago e quantidade de atrasos
- Timeline completa de interações

### 💳 Cobranças Inteligentes
- Criação rápida de cobranças com valor e data de vencimento
- **Cobranças recorrentes**: Configuração de intervalos (semanal, quinzenal, mensal, trimestral, anual)
- Geração automática da próxima cobrança após pagamento
- Status em tempo real: Pendente, Pago, Vencido, Cancelado
- Link de pagamento e observações personalizadas

### 📱 Notificações Automáticas via WhatsApp
- Lembretes automáticos 2 dias antes do vencimento
- Alertas de cobranças vencidas
- Confirmação de pagamento recebido
- Inclusão automática da chave PIX nas mensagens
- Histórico completo de notificações enviadas

### 📄 Histórico e Relatórios
- Histórico paginado de todas as notificações enviadas
- Filtros por nome do cliente, tipo de notificação e status
- Exportação de relatórios em CSV
- Busca e ordenação avançadas

### 👤 Perfil do Usuário
- Dados pessoais completos
- Informações bancárias (banco, agência, conta)
- Cadastro de chave PIX (incluída automaticamente nas mensagens)

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática e melhor DX
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI modernos e acessíveis
- **React Router** - Navegação entre páginas
- **React Hook Form** - Formulários performáticos
- **Recharts** - Gráficos e visualizações
- **date-fns** - Manipulação de datas

### Backend
- **Supabase** - Backend completo (BaaS)
  - PostgreSQL - Banco de dados relacional
  - Authentication - Sistema de autenticação
  - Edge Functions - Funções serverless
  - Realtime - Sincronização em tempo real
  - Row Level Security (RLS) - Segurança em nível de linha

### Integrações
- **Evolution API v2** - Envio de mensagens via WhatsApp
- **Supabase Edge Functions** - Automações e webhooks

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
- Node.js 18+ e npm instalados ([instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Conta no Supabase (gratuita)
- Evolution API configurada

### Passo 1: Clone o repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd pingpague
```

### Passo 2: Instale as dependências
```bash
npm install
```

### Passo 3: Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-supabase
VITE_SUPABASE_PROJECT_ID=seu-project-id
```

**Como obter as chaves do Supabase:**
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto ou acesse um existente
3. Vá em Settings → API
4. Copie a `URL` e a `anon public` key

### Passo 4: Configure o banco de dados
Execute as migrations do Supabase localizadas em `supabase/migrations/` para criar as tabelas necessárias.

### Passo 5: Configure os Edge Functions Secrets
No painel do Supabase, adicione os seguintes secrets para as Edge Functions:

```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE_ID=seu-instance-id
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### Passo 6: Inicie o servidor de desenvolvimento
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 🌐 Deploy

### Deploy do Frontend
O projeto pode ser facilmente implantado em:
- **Vercel** (recomendado)
- **Netlify**
- **GitHub Pages**

Lembre-se de configurar as variáveis de ambiente na plataforma de deploy.

### Deploy das Edge Functions
As Edge Functions do Supabase são automaticamente deployadas quando você faz push para o repositório conectado ao Supabase.

## 📁 Estrutura do Projeto

```
pingpague/
├── src/
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes base (shadcn)
│   │   ├── Layout.tsx    # Layout principal
│   │   └── ...
│   ├── pages/            # Páginas da aplicação
│   │   ├── Auth.tsx      # Login/Cadastro
│   │   ├── Dashboard.tsx # Dashboard principal
│   │   ├── Clients.tsx   # Gestão de clientes
│   │   ├── Charges.tsx   # Gestão de cobranças
│   │   └── ...
│   ├── integrations/     # Integrações (Supabase)
│   ├── hooks/            # React hooks customizados
│   ├── lib/              # Utilitários
│   └── types/            # Tipos TypeScript
├── supabase/
│   ├── functions/        # Edge Functions
│   │   ├── check-overdue-charges/  # Verifica vencimentos
│   │   └── payment-webhook/        # Webhook de pagamento
│   └── migrations/       # Migrations do banco
└── public/              # Arquivos estáticos
```

## 🔐 Segurança

- ✅ Row Level Security (RLS) configurado em todas as tabelas
- ✅ Autenticação obrigatória para todas as operações
- ✅ Validação de dados no frontend e backend
- ✅ Chaves API armazenadas como secrets
- ✅ HTTPS obrigatório em produção

## 📝 Licença

Este projeto é proprietário. Todos os direitos reservados.

## 🤝 Contribuindo

Se você encontrou um bug ou tem uma sugestão de melhoria, abra uma issue ou envie um pull request.

## 📞 Suporte

Para dúvidas e suporte:
- Abra uma issue no GitHub
- Consulte a [documentação do Supabase](https://supabase.com/docs)
- Consulte a [documentação da Evolution API](https://doc.evolution-api.com)
