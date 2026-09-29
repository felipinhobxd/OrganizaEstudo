# EVAL — Rubric do avaliador (uso interno)

| Peso | Critério                                                          |
|------|-------------------------------------------------------------------|
| 20%  | Funcionalidades core de ponta a ponta                             |
| 15%  | RLS contextual correta (papel por turma, não global)              |
| 15%  | Sessão de foco server-authoritative (sobrevive reload, realtime)  |
| 10%  | SM-2 correto                                                      |
| 10%  | Locking otimista, idempotência, cursor, ausência de N+1           |
| 10%  | Segurança: RLS testado, magic bytes, sanitização, CSP             |
| 10%  | Testes: unit + E2E dos fluxos críticos                            |
| 5%   | README + ADRs + SQL executável no SQL Editor sem erro             |
| 5%   | Deploy Vercel funcionando + SQL aplicável no Supabase             |

## Armadilhas para verificar (o agente NÃO sabe)
- RLS global em vez de contextual?
- RLS habilitado mas sem policy (bloqueia tudo)?
- Usou `setInterval` no client para contar tempo de foco?
- Paginação por offset no chat?
- SM-2 aproximado?
- Upload validando só extensão?
- N+1 silencioso no feed?
- Edge Function para operação que deveria ser função SQL?
- SQL não idempotente (não roda duas vezes)?
- `BEGIN/COMMIT` dentro de arquivo para SQL Editor?
- PAT commitado por acidente? Verificar histórico.