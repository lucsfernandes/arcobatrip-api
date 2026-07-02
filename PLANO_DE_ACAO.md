# Plano de Ação — Backend Zarpa (ex-arcobatrip-api)

> Documento de planejamento. **Nada foi implementado.** O objetivo é mapear a situação
> atual do código, propor mudanças (endpoints, schema/migrações, serviços), listar
> dependências novas e riscos. As decisões do dono do produto já foram tomadas e estão
> refletidas em cada item e consolidadas na seção **"Decisões tomadas"**.

Data: 2026-07-01 · Atualizado: 2026-07-01 (decisões do produto incorporadas)

---

## ⚠️ ALERTA DE SEGURANÇA — PRÉ-REQUISITO DE QUALQUER DEPLOY

**Segredos reais estão versionados no repositório e devem ser rotacionados ANTES de
qualquer deploy ou implementação:**

- O `.env` local contém **credenciais reais do banco de produção na Neon** (host, usuário e
  senha em texto puro) — arquivo não versionado, mas as mesmas credenciais estavam no
  `docker-compose.yml` versionado, junto com um `JWT_SECRET` fraco.

**Ações obrigatórias (bloqueiam o deploy):**
1. **Rotacionar** imediatamente a senha do banco Neon e gerar um novo `JWT_SECRET` forte.
   ⏳ **PENDENTE — ação manual do dono do produto** (painel da Neon + atualizar `.env`).
2. ✅ **FEITO (2026-07-02):** segredos removidos do versionamento — `docker-compose.yml`
   passou a ler tudo de variáveis de ambiente e o **histórico git completo foi reescrito**
   (`git filter-repo`) expurgando senha, host, usuário e JWT_SECRET de todos os commits;
   todos os branches foram force-pushed para o GitHub.
3. ✅ `.env` já está no `.gitignore` e nunca foi commitado (o vazamento era no
   `docker-compose.yml`).

Enquanto a rotação (item 1) não for feita, considerar as credenciais atuais como
**comprometidas** — o histórico antigo pode persistir em caches do GitHub (diffs de PRs
antigos, forks) até coleta de lixo pelo suporte do GitHub.

---

## 0. Resumo da stack encontrada

| Camada | Tecnologia |
|---|---|
| Runtime / linguagem | Node.js + TypeScript 5.6 (execução via `tsx`) |
| Framework HTTP | Express 4 |
| ORM / Banco | TypeORM 0.3 + PostgreSQL 17 (`pg`) |
| Validação | Zod 3 (+ `zod-to-json-schema` para Swagger) |
| Logs | Winston |
| Docs | Swagger (`swagger-jsdoc`, `swagger-ui-express`) |
| Testes | Jest (config presente, sem testes relevantes) |
| Deploy | Vercel (`@vercel/node`), banco de produção na Neon |
| Arquitetura | Clean Architecture (`domain` / `application` / `infra` / `presentation` / `main`) |

**Entidades existentes** (`src/domain/entities/`): `User`, `Trip`, `Participant`, `Activity`, `Link`.
Todas herdam de `BaseEntity` (`src/domain/entities/base.entity.ts`) que já possui `id` (uuid),
`createdAt`, `updatedAt` e uma coluna `deletedAt` (mas **sem** `@DeleteDateColumn`, ou seja,
soft-delete não está funcional).

### Estado real da API (crítico para o planejamento)

O backend está em estágio **muito inicial**. Apesar de as entidades estarem modeladas,
quase nada está exposto como endpoint:

- **Único endpoint funcional:** `POST /v1/trips` (criar viagem + participantes).
  - Rota: `src/presentation/routers/trips/createTripRouter.ts`
  - Controller: `src/presentation/controllers/Trip/CreateTripController.ts`
  - Use case: `src/application/usecases/trips/create/CreateTripUseCase.ts`
- **Arquivos de rota vazios** (esqueleto sem código): `confirmTripRouter.ts`,
  `getTripDetailRouter.ts`, `updateTripRouter.ts` em `src/presentation/routers/trips/`.
- **Participant:** existe `CreatParticipantUseCase` e `FindOneParticipantByEmailUseCase` +
  controller, mas **nenhum deles está ligado a uma rota** (não há `participantRouter`).
- **Activity / Link:** existem apenas as entidades. **Não há** use case, controller, rota
  ou repositório para atividades nem para links.
- **User:** existe a entidade e a tabela na migração, mas **não há repositório, use case,
  rota, nem qualquer fluxo de autenticação**. A coluna `password` é `varchar` simples.
- **Sem autenticação:** não há `jsonwebtoken`, `bcrypt`, `passport` nem middleware de auth.
  A variável `JWT_SECRET` existe no `.env`/`docker-compose.yml` mas **não é usada em lugar
  nenhum**. Todas as rotas atuais são públicas.
- **Sem upload de arquivos:** não há `multer`, SDK de S3, Cloudinary etc.
- **Sem serviço de email:** em `CreateTripUseCase` há um `// private mailService` comentado.

> **Implicação central:** vários requisitos (2, 3, 5, 6, 9) partem do pressuposto de que já
> existe cadastro/edição de usuário, autenticação e CRUD de atividade. **Nada disso existe.**
> Boa parte deste plano é, na prática, construção do zero e não "ajuste".

### Descobertas de bugs / riscos já identificados

1. **Item 5 (excluir atividade) — o endpoint não existe.** Não há rota `DELETE` de
   atividade em lugar nenhum (nem GET/POST/PUT). Se o app chama algo, recebe 404. Detalhes
   na seção 5.
2. **FK de `activities` é `ON DELETE NO ACTION`** (migração `1767024665338-migration.ts`).
   Enquanto `participants` é `ON DELETE CASCADE`, `activities` e `links` não são. Excluir uma
   viagem com atividades falharia por violação de FK.
3. **`ParticipantRepo.create` nunca persiste.** Em `src/infra/repositories/ParticipantRepo.ts`,
   `await this.participantRepository.create(payload)` usa o `create()` do TypeORM, que é
   **síncrono e apenas instancia** a entidade — falta o `.save()`. A criação avulsa de
   participante não grava no banco.
4. **`ParticipantRepo.update` retorna `result.raw`** de um `update()` que, no Postgres sem
   `returning`, vem vazio → mapeamento quebrado.
5. **Segredos versionados:** o `.env` contém credenciais reais do banco de produção (Neon,
   usuário/senha/host) e o `docker-compose.yml` trazia um `JWT_SECRET` fraco exposto. Devem ser
   rotacionados e removidos do versionamento.
6. **`Trip.startsAt` / `endsAt` são `varchar`**, não `timestamp` — dificulta ordenação,
   split por data e validações.
7. **Relação `Trip <-> User` (ManyToMany) sem tabela de junção na migração.** A relação
   existe no código mas a migração não cria a join table — a associação usuário↔viagem está
   inoperante.

---

## Item 1 — Trocar imagem de perfil do usuário (avatar)

**Situação atual:** Não existe fluxo de usuário nem upload. A entidade `User`
(`src/domain/entities/User/user.entity.ts`) não possui campo de avatar. Não há `multer`
nem storage configurado.

**Decisão:** storage em **Cloudinary**; resize/otimização feitos pelo próprio Cloudinary
(transformações na URL/upload), **sem `sharp` no backend**.

**Mudanças propostas:**
- Schema: adicionar colunas `avatar_url` (varchar, nullable) e `avatar_public_id` (varchar,
  nullable, para permitir exclusão/substituição no Cloudinary) em `users`. Migração nova.
- Serviço de storage: abstração `IStorageService` em `application` com implementação
  `CloudinaryStorageService` em `infra` (upload, delete, geração de URL com transformação).
- Middleware de upload (`multer` com `memoryStorage`) validando mimetype (jpeg/png/webp) e
  tamanho; o buffer é enviado ao Cloudinary via `upload_stream`.
- Endpoints: `POST /v1/users/me/avatar` (multipart, autenticado) e
  `DELETE /v1/users/me/avatar` (remove do Cloudinary via `public_id`).
- Retornar `avatarUrl` no DTO de usuário.

**Dependências novas:** `multer` (+ `@types/multer`), `cloudinary`.

**Riscos:** exige autenticação já pronta (não existe hoje); custo de storage no Cloudinary;
política de exclusão de arquivos órfãos (mitigada guardando `public_id`).

---

## Item 2 — Alterar dados pessoais além do nome

**Situação atual:** Campos existentes em `User`: `username`, `firstName`, `lastName`,
`phoneNumber`, `email`, `password`. **Não há endpoint de edição de usuário** (nem de
leitura/criação).

**Decisão — campos editáveis do perfil:** nome, **telefone/celular, data de nascimento,
bio, cidade/país**. Email **bloqueado** (item 3).

**Mudanças propostas:**
- Schema (migração nova em `users`): adicionar `birth_date` (date, nullable),
  `bio` (varchar/text, nullable), `city` (varchar, nullable), `country` (varchar, nullable).
  Campos `avatar_url` (item 1), `phone_verified` (item 4) já cobertos nos respectivos itens.
- Endpoint `PATCH /v1/users/me` (autenticado) editando somente a whitelist: `firstName`,
  `lastName` (nome), `phoneNumber`, `birthDate`, `bio`, `city`, `country`.
- **`email` fica fora da whitelist** (item 3). Alteração de `phoneNumber` dispara o fluxo de
  verificação do item 4 (marca `phone_verified = false` e envia código).
- Validação Zod específica para update parcial (telefone em E.164 — ver item 4).

**Dependências novas:** nenhuma além das de auth.

**Riscos:** precisa de autenticação; alterações de `phoneNumber` disparam fluxo do item 4;
unicidade de `username`/`email` precisa de índices únicos (hoje os índices de `email` **não
são únicos** — recomenda-se torná-los únicos ao construir a fundação de auth).

---

## Item 3 — Bloquear alteração de email (somente via suporte)

**Situação atual:** Não há edição de usuário, então nada altera email hoje. Precisa ser
garantido por design quando o item 2 for implementado.

**Decisão:** email **imutável pela API**. Não há endpoint público nem administrativo de troca
de email neste escopo (troca ocorre apenas via suporte, fora da aplicação).

**Mudanças propostas:**
- No `PATCH /v1/users/me`, **não incluir** `email` na whitelist; se enviado, ignorar ou
  retornar 403.
- Documentar no Swagger que email é imutável via API.

**Dependências novas:** nenhuma.

**Riscos:** baixo. Garantir que nenhum outro endpoint (especialmente o fluxo OAuth do item 9,
que **vincula** contas por email) sobrescreva o email da conta existente silenciosamente.

---

## Item 4 — Confirmação de celular via email (token/código)

**Decisão:** verificação **por EMAIL** (confirmado — não é SMS), usando **Resend** como
provedor transacional. Telefone armazenado em **E.164**.

**Situação atual:** `phoneNumber` existe em `users`, mas não há flag de verificação, nem
serviço de email, nem tabela de tokens.

**Mudanças propostas:**
- Schema: `phone_verified` (boolean, default false) em `users`; nova tabela
  `verification_tokens` (id, user_id, type ['phone'|'email'], code_hash, expires_at,
  consumed_at, created_at).
- Serviço de email (`IMailService`) com implementação `ResendMailService` em `infra`.
- Fluxo: ao salvar/alterar `phoneNumber` (em E.164), marcar `phone_verified = false`, gerar
  código, enviar por email; endpoint `POST /v1/users/me/phone/verify` que valida o código e
  marca `phone_verified = true`.
- Endpoints: `POST /v1/users/me/phone` (define/atualiza e dispara envio) e
  `POST /v1/users/me/phone/verify`.
- **Padrões propostos (ajustáveis):** código de **6 dígitos**, expiração **15 min**, reenvio
  com **cooldown de 60s**. Armazenar apenas o **hash** do código.

**Dependências novas:** `resend` (SDK oficial). Validação de telefone E.164 (ex.:
`libphonenumber-js`, opcional).

**Riscos:** entregabilidade de email; necessidade de rate-limit no reenvio e limite de
tentativas de validação (anti brute force).

---

## Item 5 — Corrigir exclusão de atividade

**Situação atual / causa provável do "bug":** **Não existe endpoint de exclusão de
atividade** — na verdade, não existe nenhum CRUD de atividade no backend. Só há a entidade
`Activity` e a tabela `activities`. Portanto qualquer chamada do app para excluir atividade
resulta em rota inexistente (404). Além disso:
- A `BaseEntity` tem coluna `deletedAt` mas **não** usa `@DeleteDateColumn`, então
  `softRemove`/`softDelete` do TypeORM não funcionam como esperado.
- A FK `activities.trip_id` é `ON DELETE NO ACTION`.

**Decisão:** **soft delete**. Corrigir a `BaseEntity` trocando a coluna `deletedAt` por
`@DeleteDateColumn`, habilitando `softRemove`/`softDelete` do TypeORM em todas as entidades.
Exclusão permitida ao **criador da atividade** e ao **dono da viagem** (padrão proposto,
ajustável).

**Mudanças propostas:**
- Corrigir `src/domain/entities/base.entity.ts`: `deletedAt` → `@DeleteDateColumn`. Isso
  afeta todas as entidades (migração para ajustar a coluna, se necessário).
- Criar o módulo completo de atividade: entidade já existe; adicionar `IActivityRepo`,
  `ActivityRepo`, use cases (`Create`, `Update`, `Delete`, `List`), controllers e rotas.
- Endpoint `DELETE /v1/trips/:tripId/activities/:activityId` (autenticado) usando `softDelete`,
  autorizando **criador da atividade** ou **dono da viagem**.
- Para permitir a checagem de "criador", adicionar `created_by` (user_id) na tabela
  `activities` ao criar o módulo (item 6/7).

**Dependências novas:** nenhuma (usa stack atual).

**Riscos:** consistência com despesas vinculadas à atividade (item 7) — o soft delete da
atividade deve tratar as despesas associadas (manter/soft-deletar em conjunto); a FK
`activities.trip_id` `ON DELETE NO ACTION` deixa de ser problema com soft delete, mas deve ser
revista para exclusão de viagem.

---

## Item 6 — Editar uma atividade

**Situação atual:** Não existe endpoint de edição (nem o módulo de atividade). Campos atuais
da atividade: `title`, `occursAt`, `tripId`.

**Mudanças propostas:**
- Endpoint `PUT/PATCH /v1/trips/:tripId/activities/:activityId`.
- Use case `UpdateActivityUseCase` + validação Zod.
- Campos editáveis dependem do item 7 (descrição, banner, links, etc.).

**Dependências novas:** nenhuma.

**Riscos:** validar `occursAt` dentro do intervalo da viagem; concorrência (edições
simultâneas) — provavelmente irrelevante no MVP.

---

## Item 7 — Atividades ricas + split de despesas

**Situação atual:** `Activity` só tem `title`, `occursAt`, `tripId`. Não há comentários,
links por atividade, banner nem despesas. Existe a entidade `Link` **mas** ligada a `Trip`
(não a `Activity`) e sem endpoints. Não existe conceito de "despesa" no schema.

**Decisões:**
- **Despesa com vínculo OPCIONAL a atividade:** pode ser geral da viagem OU vinculada a uma
  atividade. Despesas de atividades **somam** no cálculo total de "quem-paga-quem" da viagem.
- **Comentários:** qualquer participante da viagem **vê e comenta**; o **autor** exclui o
  próprio comentário; o **dono da viagem** exclui qualquer comentário.
- Banner da atividade via **Cloudinary** (mesmo serviço do item 1).

**Mudanças propostas (schema — várias tabelas novas):**
- `activities`: adicionar `description` (text, nullable), `banner_url` (varchar, nullable),
  `banner_public_id` (varchar, nullable), `created_by` (user_id).
- `activity_comments`: id, activity_id, author_id (user/participant), body, createdAt,
  deletedAt (soft delete).
- `activity_links`: id, activity_id, title, url (ou reaproveitar `links` adicionando
  `activity_id` nullable além de `trip_id`).
- `expenses`: id, trip_id, **activity_id (nullable)**, payer (participant_id), amount
  (inteiro em **centavos**), currency, description, createdAt, deletedAt.
- `expense_shares`: id, expense_id, participant_id, amount (centavos) — divisão da despesa.
- Banner da atividade: upload via `IStorageService` (Cloudinary).
- **Split de despesas:** serviço de cálculo que agrega **todas** as despesas da viagem
  (gerais + as vinculadas a atividades) e calcula o saldo líquido por participante
  (quem-paga-quem). A regra de divisão detalhada (igual/por beneficiários) segue como
  **padrão proposto ajustável** — modelar `expense_shares` já suporta divisão flexível.
- Endpoints: CRUD de comentários (com regra de autorização acima), links e despesas por
  atividade; endpoint de resumo `GET /v1/trips/:tripId/expenses/summary` com total da viagem
  e saldo por participante.

**Dependências novas:** serviço de storage (Cloudinary, item 1). Dinheiro em **inteiro
(centavos)** para evitar float; possível `decimal.js` no cálculo de split se necessário.

**Riscos:** complexidade do split (arredondamento, quem pagou vs quem participou); interação
com o soft delete de atividade (item 5) — despesas de uma atividade excluída devem ser
tratadas no agregado; é o item de maior escopo — deve ser quebrado em subtarefas.

---

## Item 8 — Convite com nome e email; nome vazio usa prefixo do email

**Situação atual:** O convite já carrega `name` e `email` (`participants_to_invite` em
`CreateTripUseCase` e `tripPayloadValidation`). **Porém** a validação exige `name` com
`min(3)` (`src/presentation/validators/trip/tripPayloadValidation.ts`), então **hoje não é
possível enviar nome vazio**, e **não há fallback** para usar a parte antes do `@`. O
`CreateTripUseCase` apenas copia `participant.name` direto.

**Decisão:** quando o nome vier vazio, derivar do prefixo do email e **capitalizar** —
`"ana.souza"` → `"Ana Souza"` — replicando o comportamento atual do frontend.

**Mudanças propostas:**
- Tornar `name` opcional na validação de convite (`tripPayloadValidation`).
- No use case, se `name` vazio/ausente: pegar `email.split('@')[0]`, dividir por separadores
  (`.`, `_`, `-`), capitalizar cada parte e juntar com espaço (ex.: `ana.souza` → `Ana Souza`).
  Espelhar exatamente a função equivalente do frontend para consistência.
- Aplicar a mesma regra em qualquer endpoint futuro de "adicionar participante avulso".

**Dependências novas:** nenhuma.

**Riscos:** baixíssimo. Garantir paridade exata com a implementação do frontend.

---

## Item 9 — Login social (Google, Apple, Facebook)

**Situação atual:** **Não há autenticação alguma.** Sem login/registro por email+senha, sem
JWT, sem OAuth. `password` é armazenado em texto puro no schema. `JWT_SECRET` existe mas não é
usado.

**Decisões:**
- **Implementar só Google agora.** Apple e Facebook ficam para fase posterior — a
  arquitetura deve ser **extensível** (abstração de provedor) para acomodá-los sem refatorar.
- **Vinculação automática:** se o email retornado pelo Google (e **verificado** pelo provedor)
  já existir como usuário, **vincular** a identidade social à conta existente automaticamente.

**Mudanças propostas:**
- Primeiro, **fundação de auth** (pré-requisito de quase tudo): registro/login por
  email+senha com `bcrypt`, emissão de JWT, middleware de autenticação. Sem isso, itens
  1–4, 5, 6 e 7 não têm "usuário logado".
- Schema: tabela `user_identities` (provider ['google'|'apple'|'facebook'|'local'],
  provider_user_id, user_id, unique(provider, provider_user_id)) para vincular contas sociais
  a um `User`. Modelo já preparado para os provedores futuros.
- Abstração `IOAuthProvider` em `application` com implementação `GoogleOAuthProvider` em
  `infra` (verificação do ID token). Apple/Facebook entram depois como novas implementações.
- Fluxo de vinculação: verificar `email_verified` do provedor; se o email já existe →
  associar a identidade ao usuário existente (respeitando item 3: **não** sobrescrever o email);
  se não existe → criar usuário + identidade.
- Endpoint `POST /v1/auth/google` recebendo o **ID token** do Google enviado pelo app
  (token-based — funciona para web e mobile).

**Dependências novas:** `google-auth-library` (verificação do ID token do Google), `bcrypt`
(+ `@types/bcrypt`), `jsonwebtoken` (+ `@types/jsonwebtoken`). `apple-signin-auth` / SDK do
Facebook ficam para a fase posterior.

**Riscos:** maior item de infraestrutura; necessário cadastrar app/credenciais no Google
Cloud; cuidado na vinculação automática para não sobrescrever email (item 3) nem permitir
takeover de conta (só vincular com `email_verified = true`).

---

## Item 10 — Banner do planejamento de viagem (upload)

**Situação atual:** `Trip` não tem campo de imagem; sem upload/storage.

**Decisão:** banner via **Cloudinary**; aparece nos **cards da lista** de viagens; pode ser
definido **já na criação** da viagem e também **editável depois**.

**Mudanças propostas:**
- Schema: `banner_url` (varchar, nullable) e `banner_public_id` (varchar, nullable) em
  `trips`. Migração nova.
- Reaproveitar o `IStorageService` (Cloudinary) do item 1.
- Suportar banner **na criação** (`POST /v1/trips` — aceitar o banner já enviado/URL) e em
  edição via `POST /v1/trips/:tripId/banner` (multipart, autenticado, dono da viagem).
- Incluir `bannerUrl` no DTO de listagem de viagens (para renderizar os cards).

**Dependências novas:** mesmas do item 1 (Cloudinary + `multer`).

**Riscos:** mesmos do item 1 (custo, arquivos órfãos mitigados via `public_id`, autorização).

---

## Item 11 — Sugestões de lugares turísticos (5 por destino)

**Situação atual:** Não existe integração externa alguma. Ao criar atividade, nenhuma
sugestão é oferecida. A viagem tem apenas `destination` como string livre (ex.:
"Florianópolis"), sem geocoding.

**Decisão:** usar **Foursquare Places**. As sugestões são expostas por um endpoint que o
frontend chama ao clicar em um botão **"ver sugestões"** no formulário de criar atividade; ao
selecionar uma sugestão, o formulário é **preenchido**. Retornar **5 POIs** do destino.

**Mudanças propostas:**
- Serviço `IPlacesService` (`application`) + implementação `FoursquarePlacesService` em
  `infra` chamando a Foursquare Places API.
- Endpoint `GET /v1/trips/:tripId/suggestions` (deriva o destino da viagem; opcionalmente
  aceitar `?category=` para filtrar praias/restaurantes/shoppings) que:
  1. Geocodifica/usa o destino da viagem (`near=<destino>` na Foursquare, ou lat/long).
  2. Busca POIs turísticos, ordenados por relevância/popularidade.
  3. Retorna **5 sugestões** com campos que preenchem o form de atividade
     (nome/`title`, categoria, endereço, foto se disponível, rating quando aplicável).
- Cache (em banco ou memória) por destino para reduzir custo e latência.
- Atenção aos campos **Premium** da Foursquare (fotos, tips, ratings) — são pagos; confirmar
  no consumo se serão usados (mantém custo previsível se restringir a campos Pro).

### Comparativo de APIs pesquisado (item 11)

| API | Tier gratuito (2026) | Qualidade p/ turismo | Dados no Brasil | Facilidade |
|---|---|---|---|---|
| **Google Places (New)** | Fim do crédito de US$200/mês (fev/2025); billing por field-mask, planos ~US$275/mês | Excelente (fotos, reviews, ratings, popularidade) | Excelente cobertura | Alta, muito documentada |
| **Foursquare Places** | Pay-as-you-go com ~US$200/mês de crédito; endpoints Pro com cota gratuita; Premium (fotos/tips/ratings) pagos (~US$18,75/1000) | Muito boa, forte em restaurantes/bares/entretenimento (check-ins) | Boa (200+ países) | Alta |
| **Geoapify** | Tier gratuito generoso e previsível; bundle Places+Geocoding+Routing | Média (baseado em OpenStreetMap; sem reviews/ratings/fotos) | Depende da densidade do OSM | Alta |
| **OpenTripMap** | Chave gratuita disponível; planos a partir de ~US$19/mês | Focado em atrações turísticas/sightseeing | Cobertura variável (base OSM/Wikidata) | Média |
| **TripAdvisor Content API** | 5.000 chamadas/mês grátis (exige cartão) — **porém a API oficial está descontinuada / sem novas aplicações** | Excelente para atrações/reviews | Boa | Baixa (acesso restrito) |

**Decisão adotada:** **Foursquare Places** (melhor custo-benefício + boa cobertura de
restaurantes/atrações no Brasil, com modelo pay-as-you-go). As demais permanecem no
documento apenas como referência comparativa, não serão usadas nesta fase.

**Dependências novas:** cliente HTTP (`fetch` nativo do Node 18+ ou `axios`) + credenciais da
Foursquare Places API.

**Riscos:** custo recorrente conforme volume (mitigado com cache por destino e uso de campos
Pro em vez de Premium); termos de uso quanto a cache/armazenamento de POIs; qualidade variável
por cidade no Brasil; necessidade de tratar rate-limit.

---

## Itens que NÃO se aplicam ao backend

Todos os 11 itens têm componente de backend relevante. Observações pontuais:
- **Renderização/telas** dos avatares, banners e sugestões (itens 1, 10, 11) são
  responsabilidade do frontend web/mobile — o backend só provê armazenamento e dados.
- O **fluxo de UI de OAuth** (item 9) e o **redirect** ficam majoritariamente no frontend; o
  backend valida tokens e emite a sessão.

Nenhum item foi classificado como "totalmente fora do backend".

---

## Decisões tomadas (dono do produto)

> As decisões abaixo foram fornecidas pelo dono do produto e já estão refletidas nos itens
> 1–11 acima. Itens marcados como **"padrão proposto, ajustável"** têm um valor sugerido que
> pode ser revisto durante a implementação sem nova decisão formal.

**Fundação (pré-requisito de vários itens):**
- **Autenticação:** será construída do zero (login/registro email+senha com `bcrypt`, JWT e
  middleware de auth). É pré-condição para os itens 1, 2, 3, 4, 5, 6, 7 e 9.

**Storage de imagens (itens 1, 7, 10):**
1. **Cloudinary** para avatar, banner de atividade e banner de viagem.
2. Resize/otimização feitos pelo **Cloudinary** — **sem `sharp`** no backend.

**Email transacional (item 4 e afins):**
3. Provedor **Resend** (também para convites e reset de senha).
4. Verificação de celular é feita **por EMAIL** (confirmado — **não é SMS**).

**Perfil (item 2) e email (item 3):**
5. Campos editáveis: **nome, telefone/celular, data de nascimento, bio, cidade/país**.
6. **Email bloqueado** para alteração via API (troca só via suporte, fora da aplicação).

**Atividade (itens 5 e 6):**
7. Exclusão de atividade via **soft delete** (corrigir `@DeleteDateColumn` na `BaseEntity`).
8. Exclusão permitida ao **criador da atividade** e ao **dono da viagem**
   *(padrão proposto, ajustável)*.

**Atividades ricas + despesas (item 7):**
9. Despesa com **vínculo opcional a atividade** (geral da viagem OU por atividade); despesas
   de atividades são **agregadas** no cálculo total de quem-paga-quem da viagem.
10. Comentários: qualquer participante **vê e comenta**; **autor** exclui o próprio comentário;
    **dono da viagem** exclui qualquer um.

**Convite (item 8):**
11. Nome derivado do email é **capitalizado** (`"ana.souza"` → `"Ana Souza"`), replicando o
    comportamento atual do frontend.

**Login social (item 9):**
12. **Google primeiro**; Apple e Facebook em fase posterior (arquitetura extensível, implementar
    só Google agora).
13. OAuth com email já cadastrado: **vincular automaticamente** à conta existente (com
    `email_verified` do provedor).

**Sugestões turísticas (item 11):**
14. **Foursquare Places**.
15. Endpoint chamado pelo frontend via botão **"ver sugestões"** no form de criar atividade; a
    seleção preenche o formulário. Retornar **5 POIs** do destino.

**Banner de viagem (item 10):**
16. Aparece nos **cards da lista**; pode ser definido **na criação** e **editável depois**.

**Padrões propostos (ajustáveis):**
- Código de verificação de email: **6 dígitos**, expiração **15 min**, reenvio com **cooldown
  de 60s**.
- Telefone armazenado em **E.164**.
- Exclusão de atividade permitida ao **criador** e ao **dono da viagem**.

**Segurança (pré-requisito de deploy):**
- Rotacionar e remover do versionamento as **credenciais de produção expostas** (`.env` da
  Neon) e o **`JWT_SECRET`** do `docker-compose.yml`. Ver **Alerta de Segurança** no topo do
  documento.

### Ponto ainda não abordado pelo produto

- **Renomeação do projeto para "zarpa"** (pacote, container, banco `arcobatrip`, repositório,
  variáveis): não houve decisão sobre fazer agora ou em etapa separada. Registrado aqui para
  não se perder — não bloqueia os itens funcionais.
