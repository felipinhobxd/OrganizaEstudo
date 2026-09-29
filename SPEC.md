# SPEC — OrganizaEstudo

Especificação funcional e de domínio. O agente DEVE ler este arquivo
antes de implementar qualquer feature. Qualquer divergência entre o
prompt e este arquivo: este arquivo vence.

## 0. Infraestrutura obrigatória

- Frontend + API: hospedado na **Vercel**.
- Banco, Auth, Realtime, Storage: **Supabase**.
- Banco de dados: **Postgres gerenciado pelo Supabase**.
- Migrations: arquivos **SQL puros** em `sql/`, numerados, para colar
  no **SQL Editor do Supabase**. Sem ORM de migration, sem Prisma
  migrate, sem Supabase CLI migrations.
- Autorização: **Row Level Security (RLS)** do Postgres. Toda tabela
  deve ter RLS habilitado e políticas explícitas. Nenhuma tabela
  acessível com RLS desabilitado.
- Realtime: **Supabase Realtime** (Postgres Changes + Broadcast).
  Sem servidor WebSocket próprio.
- Storage de arquivos: **Supabase Storage** com buckets e policies.
- Auth: **Supabase Auth** (email/senha). Sem implementar auth própria.
  Mas o RBAC contextual (papel por turma) é implementado via RLS.

## 1. Entidades do domínio

- User: perfil público em `profiles`, ligado a `auth.users` (Supabase).
  Roles globais (`admin`, `teacher`, `student`) — pode acumular.
- Turma: nome, código de entrada (com TTL), dono (teacher), arquivada?
- Matrícula: user + turma + papel + status (`pendente`|`ativo`|`saiu`).
- Material: tipo (`arquivo`|`link`|`texto`), tags, descrição, visibilidade.
- Tarefa: prazo, nota máxima, critérios (rubrica), anexos.
- Submissão: aluno, tarefa, texto, storage_path, nota, feedback por critério.
- Grupo de estudo: subconjunto de membros da turma, objetivo, chat próprio.
- Flashcard + Deck: frente/verso, tags, agendamento SRS.
- Sessão de foco: sala, `started_at` (server), `duration_seconds`, participantes.
- Mensagem: chat por turma e por grupo.
- Notificação: in-app. Email simulado por log estruturado.
- Evento de calendário: turma, grupo ou pessoal.

## 2. Funcionalidades obrigatórias

### 2.1 Autenticação e permissões
- Supabase Auth com email/senha.
- Trigger `on auth.user created` cria `profiles` correspondente.
- RBAC contextual via RLS: políticas SQL que verificam papel do usuário
  NA turma específica (via `enrollments`). Sem middleware Node checando
  papel — a fonte de verdade é o Postgres.
- Convite por link/código com TTL e regeneração.
- Rate limiting: usar função SQL ou Edge Function para contadores.

### 2.2 Turmas
- CRUD (com RLS). Arquivar em vez de deletar.
- Listagem paginada por cursor (`created_at` + `id` como tie-breaker).
- Feed com atividades recentes (material, tarefa, mensagem, anúncio).
- Anúncios do professor com destaque.

### 2.3 Materiais
- Upload para bucket `materials` do Supabase Storage.
- Validação de tipo em **Edge Function** com magic bytes; rejeitar
  antes de gravar no bucket.
- Bucket `materials` com policy: só membros da turma leem; só dono
  escreve. Nome do objeto = UUID aleatório.
- Materiais por link e por texto rico (sanitização server-side).
- Tags + busca full-text com `tsvector` do Postgres.
- Versionamento: edição gera nova versão em `material_versions`.
- Comentários por material.

### 2.4 Tarefas e submissões
- Professor cria tarefa com prazo e rubrica (JSON de critérios).
- Aluno submete (texto + upload). Reenvio antes do prazo.
- Professor corrige com nota + feedback por critério.
- Média ponderada calculada por função SQL `turma_media(turma_id)`.
- Exportar notas em CSV via Edge Function.

### 2.5 Grupos de estudo
- Criar grupo dentro da turma, convidar membros.
- Grupo tem: objetivo, materiais próprios, chat, deck próprio.
- **Sessão de foco colaborativa**:
  - Estado autoritativo em Postgres (`focus_sessions`).
  - Cliente NÃO usa `setInterval` para contar tempo. Ao entrar, lê
    `started_at + duration_seconds` e calcula o restante.
  - Supabase Realtime Broadcast no canal `focus:<session_id>` para
    sincronizar start/pause/stop. Latência < 2s em rede local.
  - Ao dar reload, o cliente reconecta, relê estado do Postgres e
    retoma o timer corretamente.
- Histórico: minutos por pessoa em `focus_participants`.

### 2.6 Flashcards (SM-2)
- Algoritmo SM-2 correto (EF, intervalo, repetições) em TypeScript
  puro, testado com Vitest.
- Fila diária por usuário, por deck.
- Estatísticas: retenção, streak, carga prevista para 7 dias.
- Modo "cram" (não afeta SRS).

### 2.7 Calendário
- Visões mensal e semanal.
- Eventos pessoais, de turma e de grupo agregados com cores distintas.
- Prazo de tarefa aparece automaticamente.
- Export `.ics` via Edge Function.

### 2.8 Chat e notificações
- Chat por turma e por grupo usando Supabase Realtime.
- Histórico paginado por cursor.
- Menção `@user` gera notificação (trigger SQL).
- Notificações in-app em tempo real via Realtime.
- Email simulado por log estruturado.

### 2.9 Painel do professor
- Alunos ativos, entregas pendentes, materiais mais acessados.
- Alerta de aluno "em risco": sem login há X dias E tarefa atrasada.
- Lembrete em massa para subconjunto de alunos.

### 2.10 Painel do aluno
- Agenda do dia (tarefas, revisões SRS, eventos).
- Streak de estudo.
- Metas semanais configuráveis com progresso.

## 3. Requisitos não-funcionais

- **RLS obrigatório** em TODAS as tabelas. Nenhuma `select` sem RLS.
- **Transações**: usar funções SQL (`CREATE FUNCTION`) para operações
  multi-tabela. Nada de múltiplos `insert` soltos do client.
- **Optimistic locking**: coluna `version integer` em `tasks`, `materials`,
  `assignments`. Update com `WHERE id = $1 AND version = $2`; se `rowCount = 0`,
  retornar 409.
- **Idempotência**: tabela `idempotency_keys(key, user_id, response, created_at)`.
  Edge Function de criação checa antes de executar.
- **Paginação por cursor**: `created_at` + `id`. Proibido `OFFSET`.
- **N+1**: proibido. Usar `select` com joins do Supabase (`{ foreign_table(*) }`).
- **Segurança**:
  - Rich text sanitizado em Edge Function antes de gravar.
  - CSP configurado no `next.config.js` (ou equivalente).
  - Upload: validar magic bytes em Edge Function; bucket com policy restritiva.
  - Toda tabela com RLS testado (SELECT/INSERT/UPDATE/DELETE negados sem permissão).
- **Observabilidade**: logs JSON com `request_id` em Edge Functions.
  Endpoint `/api/healthz`.
- **Performance**: feed de turma com 10k atividades < 300 ms (provar com seed).
- **Resiliência**: sessão de foco sobrevive a reload (estado no Postgres).