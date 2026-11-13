# Logs do Zarpa no dia a dia (Loki, Alloy e Grafana)

Guia prático para instalar, abrir e usar os logs da API e do site. Não precisa saber Kubernetes a fundo: cada passo tem o comando pronto e o que esperar dele.

> **Antes da primeira instalação:** a política de privacidade **1.1** precisa estar publicada. A versão 1.0 dizia que o IP ficava só na memória por 1 hora; com estes logs, o IP de cada acesso fica guardado por 6 meses (Marco Civil da Internet, art. 15).

---

## 1. O que é cada peça

Pense nos logs como o "diário de bordo" do Zarpa: cada linha diz o que aconteceu, quando e com qual resultado.

| Peça | O que faz | Analogia |
|---|---|---|
| **Alloy** | Lê o que a API e o site escrevem, esconde dados sensíveis e envia para o Loki. | O carteiro que recolhe as cartas, risca o que é confidencial e entrega no arquivo. |
| **Loki** | Guarda os logs no disco da VPS e apaga o que passou do prazo. | O arquivo, com prazo de descarte por tipo de documento. |
| **Grafana** | A tela onde você procura e lê os logs. | A sala de consulta do arquivo. |

Tudo roda no próprio cluster k3s, no namespace `observability`. Nada sai da VPS.

### Os dois tipos de log

Cada linha tem um rótulo `log_type`:

| `log_type` | O que é | Exemplo | Guardado por |
|---|---|---|---|
| `access` | Uma linha por requisição feita à API. | `GET /api/v1/trips/:id` → 200, 12 ms, IP 203.0.113.7 | **6 meses** (obrigação legal) |
| `app` | Tudo o mais: erros, avisos, o que o app conta sobre si mesmo. | "falha ao enviar e-mail", erros do site | **30 dias** |

### O que **nunca** aparece nos logs

A API, o site e o Alloy apagam, cada um, o que não pode ser guardado:

- senhas, tokens, cookies e o cabeçalho `Authorization`;
- endereços de e-mail, que aparecem como `[email]`;
- tokens de links enviados por e-mail e qualquer `?token=...` em URL, que aparecem como `[REDACTED]`;
- o conteúdo do que a pessoa enviou (o corpo das requisições).

O log de acesso guarda o **id interno** da conta (`user_id`), nunca o e-mail. A rota aparece como modelo (`/trips/:id`), nunca com o id real da viagem.

---

## 2. Primeira instalação (uma vez só)

Rode os comandos num terminal com acesso ao cluster de produção (o mesmo contexto que o Lens usa).

**Passo 1 — confirme que está no cluster certo.**

```bash
kubectl config current-context
```

Tem que aparecer o contexto da VPS (hoje: `k3s_vps_hostinger`). Se aparecer outro, **pare** e troque de contexto antes de seguir.

**Passo 2 — crie o namespace e a senha do Grafana.**

A senha **não** fica no Git. Gere uma senha forte e guarde-a no seu gerenciador de senhas:

```bash
kubectl apply -f k8s/observability/namespace.yaml

SENHA=$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))")
echo "Senha do Grafana (guarde agora): $SENHA"

kubectl -n observability create secret generic grafana-admin \
  --from-literal=admin-user=admin \
  --from-literal=admin-password="$SENHA"
```

**Passo 3 — instale Loki, Alloy e Grafana.**

```bash
kubectl apply -k k8s/observability
```

**Passo 4 — espere ficarem prontos (1 a 2 minutos).**

```bash
kubectl -n observability get pods -w
```

O esperado é `1/1 Running` em `loki-0`, `alloy-...` e `grafana-...`. Saia com `Ctrl+C`.

> Nos primeiros segundos é normal ver `Readiness probe failed: 503` no Loki e "error sending batch, will retry" no Alloy: o Alloy tenta enviar antes de o Loki terminar de subir. Some sozinho em menos de um minuto.

**Passo 5 — confira o disco.** O Loki reserva 10 GiB. Veja quanto sobra na VPS:

```bash
df -h /var/lib/rancher
```

---

## 3. Abrir o Grafana

O Grafana **não** tem endereço público, de propósito. Você o abre por um "túnel" (port-forward) que só existe enquanto estiver aberto no seu computador.

**Pelo Lens:** namespace `observability` › Services › `grafana` › botão **Forward** na porta 3000 › **Open in browser**.

**Pelo terminal:**

```bash
kubectl -n observability port-forward svc/grafana 3000:3000
```

Abra <http://localhost:3000>. Usuário `admin`, senha a que você guardou no passo 2. Feche o túnel com `Ctrl+C` quando terminar.

---

## 4. Usando no dia a dia

No Grafana, vá em **Explore** (ícone de bússola) e escolha a fonte **Loki** no topo. Cole uma das consultas abaixo no campo de consulta, escolha o período no canto superior direito (por exemplo, "Last 1 hour") e clique em **Run query**.

As consultas usam **LogQL**. A parte entre chaves `{...}` escolhe o "arquivo" (rótulos); o resto filtra as linhas.

### 4.1 "O app está com erro?"

Erros da API na última hora:

```logql
{app="zarpa-api", level="error"}
```

Erros do site (servidor do Next.js):

```logql
{app="zarpa-frontend"} |= "server error"
```

### 4.2 "Um usuário disse que deu erro e me mandou um código"

Toda resposta da API traz o cabeçalho `X-Request-Id`. Com esse código você acha a requisição exata:

```logql
{app="zarpa-api", log_type="access"} |= "COLE-O-CODIGO-AQUI"
```

Clique na linha para ver os campos: rota, status, duração e IP.

### 4.3 Requisições que falharam (status 500 ou mais)

```logql
{app="zarpa-api", log_type="access"} | json | status >= 500
```

Troque por `status = 401` para ver acessos recusados, ou por `status = 429` para ver quem bateu no limite de tentativas.

### 4.4 As rotas mais lentas

```logql
topk(10, avg by (route) (avg_over_time({app="zarpa-api", log_type="access"} | json | unwrap duration_ms [15m])))
```

Mostra as 10 rotas com maior tempo médio de resposta, em milissegundos, nos últimos 15 minutos. Use a visualização em tabela.

### 4.5 Quantos acessos por minuto

```logql
sum(count_over_time({app="zarpa-api", log_type="access"}[1m]))
```

Bom para ver picos. Troque a visualização para **Time series**.

### 4.6 Tudo o que uma conta fez

Use o **id interno** da conta (está na tabela `users` do banco), nunca o e-mail:

```logql
{app="zarpa-api", log_type="access"} | json | user_id = "COLE-O-ID-AQUI"
```

### 4.7 Acessos de um IP

```logql
{app="zarpa-api", log_type="access"} | json | ip = "203.0.113.7"
```

> **Cuidado:** o registro de acesso é sigiloso. O Marco Civil (art. 15) só permite entregá-lo a terceiros **com ordem judicial**. Investigar abuso e incidentes de segurança é uso legítimo; entregar a qualquer outra pessoa, não.

### 4.8 Exportar o resultado

Num painel do Explore: botão **Inspect** › **Data** › **Download CSV**. Use só quando houver um motivo (ordem judicial, investigação de incidente) e apague o arquivo depois.

---

## 5. Por quanto tempo cada log fica

| Rótulo | Prazo | Por quê |
|---|---|---|
| `log_type="access"` | 183 dias (6 meses) | Marco Civil da Internet, art. 15 |
| todo o resto (`app`) | 30 dias | Depuração; não há motivo para guardar mais |

Quem apaga é o próprio Loki (o "compactor"), a cada 10 minutos, com 2 horas de folga. Os prazos estão em `k8s/observability/loki.yaml`, em `limits_config`:

```yaml
retention_period: 720h          # 30 dias, padrão
retention_stream:
  - selector: '{log_type="access"}'
    period: 4392h               # 183 dias
```

Para mudar um prazo, edite o arquivo, rode `kubectl apply -k k8s/observability` e reinicie o Loki (seção 6). **Se mudar o prazo dos acessos, mude também a política de privacidade.**

Lembrete: o backup semanal da VPS também copia o disco do Loki. Um log apagado pode continuar num backup até ele ser substituído.

---

## 6. Manutenção

**Ver se está tudo de pé:**

```bash
kubectl -n observability get pods
```

**Reiniciar uma peça** (por exemplo, depois de mudar a configuração):

```bash
kubectl -n observability rollout restart statefulset/loki
kubectl -n observability rollout restart deployment/alloy
kubectl -n observability rollout restart deployment/grafana
```

**Quanto disco o Loki está usando:**

```bash
kubectl -n observability exec loki-0 -- du -sh /loki
```

Se passar de uns 8 GiB (de 10), reduza o prazo dos logs `app` ou aumente o volume.

**Ler o que cada peça diz sobre si mesma:**

```bash
kubectl -n observability logs loki-0 --tail=50
kubectl -n observability logs deploy/alloy --tail=50
```

**Atualizar versões:** as imagens estão fixadas (`grafana/loki:3.4.2`, `grafana/alloy:v1.7.1`, `grafana/grafana:11.5.2`). Para atualizar, troque a versão no `.yaml`, leia as notas da versão nova e aplique. Suba uma peça por vez.

**Trocar a senha do Grafana:**

```bash
kubectl -n observability delete secret grafana-admin
kubectl -n observability create secret generic grafana-admin \
  --from-literal=admin-user=admin --from-literal=admin-password='NOVA-SENHA'
kubectl -n observability rollout restart deployment/grafana
```

Se a senha antiga já foi gravada no banco do Grafana, troque também pela tela (Administration › Users › admin).

---

## 7. Problemas comuns

| O que você vê | O que fazer |
|---|---|
| Explore não mostra nada | Confira o período (canto superior direito) e se o Alloy está `Running`. Leia `kubectl -n observability logs deploy/alloy --tail=50`. |
| Alloy com "error sending batch" o tempo todo | O Loki caiu. Veja `kubectl -n observability get pods` e os logs do Loki. |
| `loki-0` em `Pending` | O volume não foi criado. Veja `kubectl -n observability describe pvc data-loki-0`; costuma ser falta de disco. |
| Pod reiniciando com `OOMKilled` | Faltou memória. Aumente o `limits.memory` da peça no `.yaml` e aplique. |
| `Error from server (Forbidden): ... violates PodSecurity "restricted"` | Alguém mudou um `securityContext`. Volte à versão do Git. |
| Esqueci a senha do Grafana | Siga "Trocar a senha" na seção 6. |

---

## 8. Segurança, em resumo

- O Grafana **nunca** ganha endereço público. Abra só por port-forward.
- Uma `NetworkPolicy` só deixa o Alloy e o Grafana falarem com o Loki; nenhum outro pod do cluster alcança o Grafana ou o Loki.
- Quem tem acesso ao cluster tem acesso aos logs. Mantenha essa lista pequena.
- Registros de acesso são sigilosos: só saem com ordem judicial.

---

## 9. Desinstalar

Apaga Loki, Alloy, Grafana **e todos os logs guardados**:

```bash
kubectl delete -k k8s/observability
kubectl -n observability delete pvc --all
kubectl delete namespace observability
```

Antes de desinstalar, lembre que os registros de acesso dos últimos 6 meses são obrigação legal.
