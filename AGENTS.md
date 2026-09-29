# AGENTS.md — Regras do projeto OrganizaEstudo

Fonte de verdade para convenções, comandos e arquitetura. Ler antes
de qualquer ação. Atualizar ao final de cada fase.

## Idioma
- Código (nomes, funções, classes, SQL): inglês.
- Comentários, docs, README, ADRs, commits: PT-BR.
- Mensagens de erro ao usuário: PT-BR.

## Diretório de trabalho
- Raiz do projeto: `D:\OrganizaEstudo`
- Todos os comandos (`git`, `npm`, `make`, etc.) devem ser executados a
  partir dessa raiz.
- Se o terminal abrir em outro diretório, navegue até `D:\OrganizaEstudo`
  antes de qualquer ação.
- Em comandos shell, use o formato Windows (PowerShell) ou WSL conforme
  o ambiente disponível. Documente qual foi usado no README.

## Stack fixa (não mude sem STOP CONDITION)
- Framework: **Next.js 14+ (App Router) + TypeScript**.
- Hospedagem: **Vercel**.
- Banco/Auth/Realtime/Storage: **Supabase**.
- Cliente Supabase: `@supabase/supabase-js` e `@supabase/ssr`.
- Estilo: Tailwind CSS.
- Testes: Vitest (unit) + Playwright (E2E).
- UI: shadcn/ui quando útil.

## Estrutura esperada do repositório
/app
/(auth)
/(app)
/api
/components
/lib
/supabase # clients (browser, server, admin)
/srs # SM-2
/validators
/sql # SQL puro, numerado, para SQL Editor do Supabase
001_extensions.sql
002_profiles.sql
003_turmas.sql
004_enrollments.sql
005_materials.sql
006_assignments.sql
007_submissions.sql
008_groups.sql
009_flashcards.sql
010_focus_sessions.sql
011_messages.sql
012_notifications.sql
013_calendar_events.sql
014_rls_policies.sql
015_rpc_functions.sql
016_triggers.sql
099_seed.sql
/e2e
/docs
/adr
/.env.example
/.github/workflows/ci.yml
/README.md
/AGENTS.md
/SPEC.md

## SQL — REGRAS CRÍTICAS

Os arquivos em `sql/` são feitos para serem colados NO SQL EDITOR DO
SUPABASE, um por um, na ordem numérica. Portanto:

1. Cada arquivo deve ser **idempotente** quando possível:
   `CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de
   `CREATE POLICY`, `CREATE OR REPLACE FUNCTION`.
2. Cada arquivo começa com um comentário `-- 00N_nome.sql` e uma
   descrição de 1 linha.
3. **Sem** `BEGIN; ... COMMIT;` (o SQL Editor gerencia a transação).
4. **Sem** `\i` ou includes.
5. **Sem** dependência de variáveis externas.
6. Toda tabela DEVE ter `ENABLE ROW LEVEL SECURITY` no mesmo arquivo
   em que é criada, mais as policies básicas. Policies complexas vão
   em `014_rls_policies.sql`.
7. Seed em `099_seed.sql` deve ser executável após todos os anteriores.
8. O README deve ter uma seção **"Como aplicar no Supabase"** com a
   ordem exata de execução.

## Comandos obrigatórios
- `npm run dev` — desenvolvimento local.
- `npm run build` — build de produção.
- `npm run test` — Vitest.
- `npm run test:e2e` — Playwright.
- `npm run lint` — ESLint + Prettier.
- `npm run typecheck` — tsc --noEmit.
- `make sql-check` — valida que todos os arquivos SQL são parseáveis
  (via `psql --dry-run` local ou `pg_query` em Node).

## Convenções de git
- Repositório: `https://github.com/felipinhobxd/OrganizaEstudo` (público).
- Remote: usar variável de ambiente `GH_TOKEN` (o usuário fornece o PAT).
  NUNCA escrever o PAT em arquivo do repositório, README ou log.
  Configurar uma vez com:
  `git remote set-url origin https://x-access-token:$GH_TOKEN@github.com/felipinhobxd/OrganizaEstudo.git`
- Commits atômicos com Conventional Commits (`feat:`, `fix:`, `test:`,
  `docs:`, `chore:`, `refactor:`).
- Um PR por fase. Nunca commitar múltiplas fases juntas.
- Nunca commitar `.env`, `.env.local`, `node_modules`, `.next`, `dist`,
  `build`, `.vercel`.
- Antes de cada push: `git status` para garantir que nenhum segredo
  está staged.

## Regras de arquitetura
- Autorização SEMPRE via RLS no Postgres. Middleware Node só valida
  sessão, não papel. Papel é responsabilidade do banco.
- Operações multi-tabela em **funções SQL** (`RPC`), chamadas via
  `supabase.rpc('nome', {...})`.
- Optimistic locking: `version integer` + `WHERE version = $n`.
- Idempotência em Edge Functions de criação via `Idempotency-Key`.
- Cursor pagination em todas as listas grandes.
- Zero N+1: usar nested select do Supabase ou RPC.

## Segurança
- Rich text: sanitizar com `sanitize-html` em Edge Function antes de gravar.
- CSP em `next.config.js`.
- Upload: validar magic bytes em Edge Function; bucket com policy.
- Toda tabela testada com casos "acesso negado".

## Orçamento por sessão
- Cada fase cabe em UMA sessão do agente.
- Se uma fase exceder ~15 arquivos novos, divida em sub-fases.
- Ao final de cada fase: testes → lint → commit → atualizar docs.

## Observabilidade
- Logs JSON estruturados nas Edge Functions com `request_id`.
- Endpoint `/api/healthz` retorna status do Supabase.