# 🟢 M5 Operating System

> Plataforma operacional interna da M5 Marketing — substitui Notion, Planilhas e WhatsApp por um sistema centralizado de gestão de clientes, tarefas, financeiro, pipeline comercial e IA assistente.

---

## 🛠️ Tecnologias & Serviços

**Frontend**
- React 19 + TypeScript
- Vite 8
- Tailwind CSS 3
- Lucide React (ícones)

**Backend & Banco de Dados**
- Supabase (PostgreSQL + Auth + Row Level Security)
- 13 tabelas com soft delete, RBAC por role e triggers automáticos

**IA**
- Groq API — modelo `llama-3.3-70b-versatile` (gratuito)

**Infraestrutura**
- Vercel (deploy automático via GitHub)
- GitHub — branch `main` = produção

---

## 📦 Como Rodar o Projeto

**Pré-requisitos**: Node.js 18+, npm

```bash
# 1. Clonar o repositório
git clone git@github.com:guimaraesvictorb-cmyk/m5-project-manager.git
cd m5-project-manager

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# preencha os valores no .env.local

# 4. Rodar em desenvolvimento
npm run dev

# 5. Build de produção
npm run build
```

---

## ⚙️ Funcionalidades Principais

**Autenticação & Acesso**
- [x] Login com Supabase Auth (email + senha)
- [x] RBAC: Admin / Coordenador / GT / Gestor de Projetos
- [x] Row Level Security no banco — cada role acessa apenas o que é permitido
- [x] Área de perfil com edição de nome e troca de senha

**Operação**
- [x] Gestão de tarefas (kanban + lista) com status, prioridade e prazo
- [x] Carteira de clientes com health flag (verde/amarelo/vermelho)
- [x] Pipeline operacional com fases F0–F8 (metodologia M5)
- [x] Playbooks com geração automática de tarefas por template

**Financeiro**
- [x] Lançamentos de mensalidades por cliente
- [x] Status de pagamento com atualização inline (pago / pendente / atrasado)
- [x] Geração automática de mensalidades do mês
- [x] Resumo MRR: total faturado, recebido, pendente, atrasado

**Comercial**
- [x] Pipeline CRM em kanban por etapas
- [x] Leads com MRR potencial, probabilidade e fonte
- [x] MRR ponderado calculado automaticamente

**Dashboard & IA**
- [x] Dashboard com KPIs: clientes ativos, MRR, tarefas atrasadas, leads
- [x] M5 AI — assistente com Llama 3.3 via Groq (gratuito)
- [ ] Integração com Meta Ads API (métricas de campanhas)
- [ ] Integração com Google Ads API
- [ ] Notificações por e-mail / WhatsApp
- [ ] App mobile (PWA)

---

## 🔒 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com as seguintes variáveis:

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Groq AI (gratuito em console.groq.com)
VITE_GROQ_API_KEY=
```

> As mesmas variáveis devem ser configuradas no painel da Vercel em **Settings → Environment Variables**.

---

## 🚀 Fluxo de Deploy & Branches

| Branch | Ambiente | Trigger |
|--------|----------|---------|
| `main` | Produção (`m5-project-manager.vercel.app`) | Push automático via GitHub |

```bash
# Ciclo de trabalho padrão
git add .
git commit -m "descrição da mudança"
git push
# → Vercel detecta e publica em ~1 minuto
```

> Para alterações maiores, crie uma branch de feature e abra um PR antes de mergear na `main`.

---

## 🗄️ Banco de Dados

O schema completo está em `supabase/schema.sql`. Para aplicar em um novo projeto Supabase:

1. Acesse o SQL Editor no dashboard do Supabase
2. Cole e execute o conteúdo de `supabase/schema.sql`
3. Após criar o primeiro usuário via Auth, rode:

```sql
UPDATE profiles
SET role = 'admin', display_name = 'Seu Nome'
WHERE email = 'seu@email.com';
```

---

## 👥 Roles & Permissões

| Role | Acesso |
|------|--------|
| `admin` | Total — todos os clientes, financeiro, usuários |
| `coordenador` | Total — todos os clientes e operação |
| `gt` | Apenas clientes atribuídos + tarefas |
| `gp` | Apenas clientes atribuídos + tarefas |
