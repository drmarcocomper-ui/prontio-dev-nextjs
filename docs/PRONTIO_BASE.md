# PRONTIO — Documento Base Oficial
Versão: 1.1  
Status: CANÔNICO (fonte única de verdade)

Última atualização: alinhado à estrutura real do repositório (2026)

---

## 1. O que é o PRONTIO
PRONTIO é um sistema web próprio de **prontuário eletrônico e gestão de consultório médico**, desenvolvido em **HTML, CSS e JavaScript puro**, com **Google Apps Script + Google Sheets** como backend.

Objetivos principais:
- Prontuário clínico unificado
- Fluxo médico rápido, sem cliques desnecessários
- Arquitetura limpa, modular e auditável
- Baixo custo operacional
- Total controle do código e da evolução do sistema

---

## 2. Princípios fundamentais (NÃO NEGOCIÁVEIS)

1. **API-first**
   - Frontend **nunca** acessa planilhas
   - Toda comunicação passa por `backend/api/Api.gs`

2. **Repo-first / DB central**
   - Toda leitura/escrita usa:
     - `Repository.gs`
     - helpers centralizados (`Repo_getDb_`, `PRONTIO_getDb_`)
   - Proibido `SpreadsheetApp.getActiveSpreadsheet()` fora de helpers

3. **Namespace único no frontend**
   - Namespace global: `PRONTIO`
   - Nada fora dele no `window`

4. **Prontuário unificado**
   - Evolução, documentos, receitas, exames e timeline pertencem ao mesmo domínio
   - Backend oficial: `domain/Prontuario`

5. **Decisão documentada**
   - O que estiver neste arquivo prevalece sobre qualquer chat
   - Mudou regra → atualiza este documento

---

## 3. Arquitetura REAL do Backend

backend/
├─ api/
│ └─ Api.gs → Router central da API
│
├─ data/
│ ├─ Repository.gs → Acesso central ao DB
│ ├─ Schema.gs → Definição de schema
│ ├─ Meta.gs
│ ├─ Migrations/
│ │ ├─ Migrations.gs
│ │ ├─ MigrationsAgendaProfissional.gs
│ │ └─ MigrationsAtendimento.gs
│ └─ registry/ → Registro de domínios
│ ├─ Registry.Agenda.gs
│ ├─ Registry.Pacientes.gs
│ ├─ Registry.Prontuario.gs
│ ├─ Registry.Usuarios.gs
│ └─ ...
│
├─ domain/
│ ├─ Agenda/
│ ├─ Atendimento/
│ ├─ Pacientes/
│ ├─ Prontuario/
│ ├─ Receita/
│ ├─ Exames/
│ ├─ Usuarios/
│ └─ Clinica/
│
├─ infra/
│ ├─ Cache.gs
│ ├─ Errors.gs
│ ├─ Ids.gs
│ ├─ Locks.gs
│ ├─ Validators.gs
│ └─ Utils.gs
│
├─ security/
│ ├─ Auth.gs
│ ├─ Audit.gs
│ ├─ RecoverySchema.gs
│ └─ ...
│
└─ integrations/
├─ Chat.gs
├─ PublicUrl.gs
└─ TestMail.gs


### Regras de backend
- Funções privadas terminam com `_`
- Erros sempre retornam via padrão da API
- Migrations controlam schema
- Registry define o que a API expõe

---

## 4. Arquitetura REAL do Frontend

frontend/
├─ .html → páginas
│
├─ assets/
│ ├─ css/
│ │ ├─ core/ → reset, tokens, layout
│ │ ├─ components/ → botões, cards, forms
│ │ ├─ pages/ → CSS por página
│ │ ├─ print/ → CSS de impressão
│ │ └─ theme/
│ │
│ └─ js/
│ ├─ main.js → bootstrap central
│ ├─ core/ → api, auth, router, state
│ ├─ features/
│ │ ├─ agenda/
│ │ ├─ pacientes/
│ │ └─ prontuario/
│ ├─ pages/ → page-.js
│ ├─ ui/ → sidebar, topbar, modals
│ ├─ widgets/ → componentes reutilizáveis
│ └─ print/
│
├─ partials/ → sidebar, topbar
└─ fragments/ → painéis reutilizáveis


---

## 5. Padrões obrigatórios (Frontend)

- `main.js`:
  - bootstrap
  - init global
  - registro de páginas
- Lógica de negócio **NUNCA** em `page-*.js`
- Cada feature:
feature/
├─ *.state.js
├─ *.api.js
├─ *.view.js
├─ *.controller.js

- Estado único centralizado (`core/state.js` + feature state)

---

## 6. Estado do paciente (REGRA CRÍTICA)

- Paciente ativo armazenado em **localStorage**
- Dados mínimos:
- `idPaciente`
- `nome`
- `telefone`
- Nenhum dado sensível em URL
- Prontuário, agenda, receita e exames consomem esse estado

---

## 7. Prontuário (decisão consolidada)

- Backend oficial:
domain/Prontuario/

- Inclui:
- Timeline
- Evoluções
- Documentos
- Receitas
- Exames
- Não criar prontuários paralelos
- `Evolucao.gs` existe apenas como suporte histórico / integração

---

## 8. O que NÃO deve ser feito

- Duplicar regras entre frontend e backend
- Criar estado fora do state oficial
- Criar endpoints sem registry
- Acessar planilha direto
- Resolver “rápido” quebrando arquitetura

---

## 9. Documentação viva

Documentos auxiliares:
- `docs/BACKEND-ARCHITECTURE.md`
- `docs/FRONTEND-ARCHITECTURE.md`

Mas **este arquivo manda mais que todos eles**.

---

## 10. Regra final
Se houver conflito entre:
- chat
- memória implícita
- opinião momentânea
- documentação antiga

👉 **vale este PRONTIO_BASE.md**

Este documento define o PRONTIO.