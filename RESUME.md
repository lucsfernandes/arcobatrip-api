Pronto — parei por aqui. Todos os processos encerrados, portas 3000/3001 livres. Nada foi commitado (as mudanças estão no working tree dos repositórios).

Resumo do processo

1. Backend zarpa-api — ✅ completo e validado ao vivo

- Implementei os 15 endpoints do contrato (openapi.yaml) sob /api/v1: auth (signup/login/me), trips + activities/links/guests, expenses+settlements, notifications.
- Respostas "cruas" + erro uniforme { error: { code, message, details? } }; novas entidades Expense e Notification; rateio portado de lib/expenses.ts; notificações auto-geradas por eventos (convite/confirmacao/atividade/link).
- Migration reconciliada: removi as 2 migrations inconsistentes (backup no scratchpad) e gerei 1 migration limpa a partir das entidades.
- Criei um banco zarpa isolado no seu Postgres do WSL (porta 5433), rodei a migration, subi a API e fiz smoke test HTTP real: 28/28 + 71/71 testes unitários + tsc limpo.

2. Frontend web (Next.js) — ✅ conectado e validado no navegador

- Liguei as telas ao seam de dados (apiClient/queries/mutations): auth real com token JWT, leituras via useQuery e escritas via mutation hooks — preservando o modo mock e os testes.
- Validei no navegador contra a API real: signup → POST /auth/signup 201 (JWT real gravado), criar viagem → POST /trips 201, e a viagem apareceu no dashboard (GET /trips) com status derivado. tsc limpo, vitest 89/89, 0 erros de lint, 0 erros no console.

3. Frontend mobile (Expo) — ✅ validado ao vivo via Expo web (react-native-web) + Playwright

- Apliquei o mesmo padrão (token via useAuthStore.getState().token, leituras/escritas pelo seam, guest-id tratado). tsc limpo, jest 127/127, 0 erros de lint.
- Validação ao vivo (29/06/2026) contra a API real, dirigindo o app no navegador:
  - signup → POST /auth/signup 201 (usuário "Zarpa Mobile QA" persistido).
  - dashboard → GET /trips + GET /notifications 200 (conta nova = "Nenhuma viagem ainda").
  - criar viagem com 1 convidado → POST /trips 201 (viagem Florianópolis 10–15/ago + organizador confirmado + convidado pendente, todos no banco; UUID real do servidor).
  - abrir viagem → GET /trips/{id} 200; adicionar atividade → POST /trips/{id}/activities 201, com notificação auto-gerada (type "atividade") que aparece em GET /notifications.
  - 0 erros de console em todo o fluxo.

Bug encontrado e CORRIGIDO durante a validação (mobile)

- `markAllNotificationsRead` chamava `PATCH /notifications/read-all` → 404. O contrato (openapi.yaml), a API e o cliente web usam **POST**. Corrigido o método para POST em `zarpa/frontend/mobile/src/data/client.ts` (+ comentário de mapeamento). Re-validado ao vivo: "Marcar todas como lidas" → POST 200, notificação marcada read=true no banco, 0 erros. Gates do mobile permanecem verdes (tsc 0, jest 127/127, lint 0 erros).

Bug de fuso horário — CORRIGIDO com date-fns (mobile)

- Causa-raiz (dois bugs que se cancelavam na exibição mas corrompiam a data persistida): `formatDayLabel` usava `new Date("YYYY-MM-DD")` (UTC midnight) e relia com `getDate()` local → rotulava cada chip -1 dia; e o `dateRangeDays` local do `index.tsx` usava `toISOString()` (UTC). Sob UTC-3 o seletor mostrava "Dia 9–14" (para a viagem 10–15/ago) e o botão rotulado "Dia 11" carregava na verdade `2026-08-12`, persistindo a atividade no dia errado.
- Correção (a pedido, usando date-fns em vez de código próprio): instalei `date-fns@^4.4.0` no mobile e reescrevi os helpers de data em `zarpa/frontend/mobile/src/lib/format.ts` com `parseISO` (lê date-only como LOCAL, sem o off-by-one do `new Date()`), `eachDayOfInterval`/`format` (range e rótulos TZ-safe), `differenceInCalendarDays` (contagens) e os locales `ptBR`/`enUS`. `dateRangeDays` virou helper exportado/testado; o `index.tsx` agora o importa. Moeda segue em `Intl.NumberFormat`.
- Testes: `src/lib/format.test.ts` ganhou cobertura de `dateRangeDays`, de `formatDayLabel` com input date-only e um bloco de regressão sob `TZ=America/Sao_Paulo` (offset negativo, onde o bug aparecia). Suíte mobile: tsc 0, jest 137/137, lint 0 erros.
- Re-validado AO VIVO: o seletor agora mostra "Dia 10 · Segunda" … "Dia 15 · Sábado" (range/dias-da-semana corretos); a atividade existente (gravada 2026-08-12 na run bugada) passou a rotular corretamente "Dia 12 · Quarta-feira"; e uma nova atividade marcada "Dia 11 · Terça" persistiu como `2026-08-11 14:30` (Tue) no banco — POST /activities 201, 0 erros.
- Paridade web: o web NÃO tem o bug — `enumerateDays`/`dayChipLabel` em `web/.../new-activity-modal.tsx` já usam `parseLocalDate` (noon) + componentes locais. Só o mobile havia divergido. (Opcional: alinhar o web a date-fns também, por consistência — não feito, web está correto.)
- Nota operacional: durante o passo, o Metro precisou de restart com `--clear` (foi iniciado ANTES de instalar o date-fns → cache stale não resolvia o pacote) e a API foi reiniciada (processo nohup havia sido reapado); ambos de volta no ar.

Configuração de ambiente (estado atual — tudo NO AR)

- .env.local (gitignored) em web e mobile apontando para http://localhost:3000/api/v1.
- Banco recriado do zero: container Docker `zarpa-db` (postgres:17.1-alpine) no WSL, porta 5433, db `zarpa`. O volume tinha schema antigo (migration deletada 1756688988199) → dropei/recriei o database e a API aplicou a migration limpa 1782669726595 no boot.
- API rodando no host (tsx) na porta 3000, apontada ao banco local via env inline (TYPEORM_HOST=localhost PORT=5433 DB=zarpa SSLMODE=prefer) — o `.env` em disco continua apontando para produção (Neon), intocado.
- Bundler Expo web no ar na porta 8081 (`npx expo start --web`).

Pontos em aberto (para depois)

- (Opcional) Alinhar os helpers de data do web a date-fns por consistência — o web já é TZ-correto, então é só padronização.
- Operações sem endpoint no contrato (editar/excluir despesa, remover atividade/link, editar viagem, "marcar como pago"): em modo HTTP elas ainda alteram só o estado local — exigiriam novos endpoints + métodos no apiClient/mutations.
- Botão "Continuar com Google" é placeholder (erra em modo HTTP).
- Nada commitado: mudanças no working tree de zarpa-api, zarpa/frontend/web e zarpa/frontend/mobile (incluindo o fix do read-all no mobile).
- Processos ainda ativos (API:3000, Expo:8081, Postgres:5433) para revisão; posso derrubá-los quando quiser.
