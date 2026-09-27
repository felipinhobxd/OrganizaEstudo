# 11_PENDING_WORK — Trabalho pendente (real, verificado)

> Área: Backlog
> Escopo: Bugs, melhorias, features pedidas pelo operador, dívidas, testes faltantes
> Última atualização: 2026-09-25
> Fonte principal: pedidos explícitos do operador nas sessões de trabalho + diagnóstico das sessões

## Migrations para aplicar (P-13 — ação do OPERADOR)

```text
ID: P-13
Título: Aplicar as migrations pendentes no Supabase (SQL Editor)
Prioridade: Alta (avisos no dashboard, ciclo de 3, edição de lote, exclusão de leilão, LIMITs de egress e 200 cartas só funcionam após aplicar)
Status: PARCIAL — 150000 (rascunhos), 160000 (brinde), 20260925130000 (delete_auction renomeado pelo operador), 20260925134000/135000 (queue integrity, operador) APLICADAS ou em produção.
PENDENTES (ordem lexical):
  1. 20260924180000_dashboard_warnings_snapshot.sql      (avisos no dashboard)
  2. 20260924200000_warning_cycle_reset.sql              (ciclo de 3 com reset)
  3. 20260924210000_edit_queue_item.sql                  (editar lote pendente)
  4. 20260924220000_auction_lot_sequence_no_drift.sql    (RECONCILIADA — se já colou a original, cole esta por cima)
  5. 20260925140000_max200_export_limits.sql             (200 cartas + export com LIMITs)
  6. 20260925150000_dashboard_snapshot_limits.sql       (LIMITs no snapshot do dashboard — fix de egress/log)
Próximo passo: colar as 6 no SQL Editor → `npm run doctor` → smokes:
  (a) excluir leilão de teste ("sim quero") some do Excel
  (b) 3+3 reduções → 2 DMs de ciclo (com reset)
  (c) editar lote pendente na fila
  (d) export Excel funciona sem timeout
  (e) backup com cloudPath no log
  (f) regras+figurinha+@all na próxima fila (ordem correta, sem duplicar)
```

## Bugs / Features pendentes

```text
ID: P-04
Título: SigLIP2 quantizado (fp16/int8) para PC fraco
Prioridade: Média (meta declarada: "rodar até num PC meio ruim")
Status: Não iniciado (estacionado — a qualidade depende da FOTO, não da velocidade)
Arquivos relacionados: recognition/scripts/download_models.py, calibrate_thresholds.py, benchmark.py; recognizer/config.py
Próximo passo: rodar scripts/bakeoff_embeddings.py com o candidato quantizado nas fixtures existentes.
```

```text
ID: P-11
Título: Vercel — RECOGNITION_SERVICE_SHARED_SECRET como env server-only
Prioridade: Alta para quem usa o painel publicado (senão pipeline do navegador no Vercel)
Status: Aguardando configuração do operador (feito localmente; falta na Vercel)
Arquivos relacionados: .env.local (valor de referência), painel Vercel → Settings → Environment Variables
Próximo passo: operador copiar o valor para a Vercel (server-only) → redeploy → chip "serviço local ✅" no domínio publicado.
```

```text
ID: P-14
Título: Conversão para aplicativo desktop (.exe) — Electron wrapper
Prioridade: Baixa (o sistema já roda 100% local com npm run start; o Electron só colocaria janela nativa)
Status: AVALIAÇÃO FEITA (2026-09-25) — Electron wrapper recomendado (NÃO SQLite/rewrite completo):
  - Electron main.cjs abre janela nativa carregando http://localhost:3000
  - [spawn] bot (node bot/index.mjs) como processo filho
  - [spawn] reconhecimento (Python .venv) como processo filho
  - Supabase CONTINUA como banco (grátis, já configurado, o bot fala direto com ele)
  - electron-builder → Setup.exe + auto-update via GitHub Releases
  - GitHub Actions: build electron + upload artifact na aba Releases
Próximo passo: se o operador confirmar que quer isso, criar pasta electron/ com main.cjs, preload, package.json do builder e workflow .yml.
```

## Não confirmado / fora de escopo atual

- Supabase Log Ingestion: 0.96/1 GB no free plan — polling reduzido ~56%, mas os logs acumulados só resetam no próximo ciclo de billing. Monitorar.
- Conversão para desktop: avaliada mas NÃO iniciada — o operador pediu passo a passo mas a decisão final sobre Electron vs. rewrite SQLite é dele.
- Limitless como fonte do catálogo: cliente pronto, `LIMITLESS_API_KEY` nunca configurado.
