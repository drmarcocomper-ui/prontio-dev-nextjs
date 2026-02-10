# Prontio — Sistema de Gestão para Consultório Médico

## Visão geral

Sistema web para gestão de consultório médico. Módulos: pacientes, agenda, prontuários (evoluções clínicas), financeiro e configurações.

Idioma da interface: **português do Brasil**. Nomes de rotas, variáveis, tabelas e textos são em pt-BR.

## Stack

- **Next.js 16** (App Router, `src/` dir)
- **React 19** com Server Components e Server Actions
- **TypeScript** (strict mode)
- **Tailwind CSS 4** (via `@tailwindcss/postcss`, sem `tailwind.config`)
- **Supabase** (auth, database, RLS) — pacotes `@supabase/supabase-js` e `@supabase/ssr`
- **ESLint** com `eslint-config-next`

## Comandos

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção (valida TypeScript)
npm run start    # Servir build de produção
npm run lint     # ESLint
```

Sempre rodar `npm run build` após alterações para validar que o TypeScript compila sem erros.

## Estrutura do projeto

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (lang="pt-BR", fontes Geist)
│   ├── globals.css                 # @import "tailwindcss"
│   ├── login/                      # Página de login + server actions (auth)
│   ├── auth/callback/              # Route handler para OAuth callback
│   └── (dashboard)/                # Route group — layout com sidebar
│       ├── layout.tsx              # Sidebar + área de conteúdo
│       ├── page.tsx                # Dashboard (painel inicial)
│       ├── pacientes/              # CRUD de pacientes
│       ├── agenda/                 # Agendamentos por dia
│       ├── prontuarios/            # Evoluções clínicas (SOAP)
│       ├── financeiro/             # Receitas e despesas
│       └── configuracoes/          # Settings (abas: consultório, profissional, horários, conta)
├── components/
│   ├── sidebar.tsx                 # Sidebar de navegação (Client Component)
│   └── logout-button.tsx           # Botão de logout
├── lib/
│   └── supabase/
│       ├── client.ts               # createBrowserClient (Client Components)
│       ├── server.ts               # createServerClient (Server Components / Actions)
│       └── middleware.ts            # Refresh de sessão + proteção de rotas
└── middleware.ts                    # Redireciona para /login se não autenticado
```

## Padrões e convenções

### Arquitetura por feature

Cada módulo (pacientes, agenda, etc.) segue a mesma estrutura dentro de `(dashboard)/`:

- `page.tsx` — listagem (Server Component, busca no Supabase)
- `actions.ts` — Server Actions (criar, atualizar, excluir)
- `novo/page.tsx` — formulário de criação
- `[id]/page.tsx` — detalhes
- `[id]/editar/page.tsx` — formulário de edição

### Server Components vs Client Components

- **Server Components** (padrão): pages, layouts, data fetching
- **Client Components** (`"use client"`): formulários, interações, componentes com estado
- Server Actions ficam em arquivos `actions.ts` com `"use server"`

### Formulários

- Usam `useActionState` do React 19 para integrar com Server Actions
- Validação server-side nas actions (retorna `fieldErrors` por campo)
- Máscaras de input feitas inline com `onChange` (CPF, telefone, CEP, CNPJ, moeda)
- Componentes de formulário aceitam `defaults` prop para reutilização em criar/editar

### Supabase

- **Três clientes**: `client.ts` (browser), `server.ts` (server), `middleware.ts` (middleware)
- Queries usam o client de `server.ts` em Server Components
- Queries client-side (ex: autocomplete de pacientes) usam `client.ts`
- Joins feitos via `select("..., tabela(colunas)")` — cast com `as unknown as Type` para resolver tipagem

### Estilo

- Tailwind CSS utilitário direto nos componentes (sem arquivos CSS customizados)
- Paleta principal: `sky-600` (primária), `gray-50/200/900` (neutras)
- Cards: `rounded-xl border border-gray-200 bg-white p-6`
- Inputs: `rounded-lg border border-gray-300 ... focus:border-sky-500 focus:ring-1 focus:ring-sky-500`
- Ícones: SVGs inline do Heroicons (outline, strokeWidth 1.5)

## Banco de dados (Supabase)

Schema em `supabase/schema.sql`. Tabelas:

| Tabela | Descrição |
|---|---|
| `pacientes` | Cadastro de pacientes (CPF unique condicional) |
| `agendamentos` | Consultas agendadas (FK paciente, check hora_fim > hora_inicio) |
| `prontuarios` | Evoluções clínicas SOAP (FK paciente) |
| `transacoes` | Receitas e despesas (FK opcional paciente) |
| `configuracoes` | Chave-valor para settings do consultório |

RLS habilitado em todas as tabelas. Política: acesso total para `authenticated` (single-tenant).

Extensão `pg_trgm` usada para busca parcial por nome.

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

Arquivo `.env.example` disponível na raiz. Criar `.env.local` com os valores reais.
