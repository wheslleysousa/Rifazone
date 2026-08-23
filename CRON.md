# Configuração de Expiração Ativa de Pedidos & Agendamento (Cron / Cloud Scheduler)

Para garantir que pedidos Pix não pagos sejam desativados automaticamente e suas cotas sejam liberadas sem depender exclusivamente de acessos na página (expiração preguiçosa/fallback), configure uma tarefa agendada chamando o endpoint seguro do backend.

---

## 1. Dados do Endpoint

- **Método**: `POST`
- **URL**: `https://sua-aplicacao.com/api/tarefas/expirar-pedidos`
- **Frequência recomendada**: A cada 1 ou 2 minutos (`*/1 * * * *` ou `*/2 * * * *`)
- **Cabeçalho de Autenticação**: 
  - `X-Cron-Secret: <SEU_CRON_SECRET>`
  - Ou `Authorization: Bearer <SEU_CRON_SECRET>`
  - Ou via parâmetro query: `?secret=<SEU_CRON_SECRET>`

> Configurado através da variável de ambiente `CRON_SECRET` no servidor/Render/Cloud Run.

---

## 2. Exemplos de Configuração

### Opção A: Render Cron Job
1. No painel do Render, vá em **New +** > **Cron Job**.
2. **Command**:
   ```bash
   curl -X POST "$APP_URL/api/tarefas/expirar-pedidos" -H "X-Cron-Secret: $CRON_SECRET"
   ```
3. **Schedule**: `*/2 * * * *` (a cada 2 minutos).

### Opção B: Google Cloud Scheduler
1. Acesse o **GCP Console** > **Cloud Scheduler**.
2. Clique em **Criar Trabalho**.
3. **Frequência**: `* * * * *` (a cada minuto).
4. **Target (Destino)**: `HTTP`
5. **URL**: `https://sua-aplicacao.com/api/tarefas/expirar-pedidos`
6. **Método HTTP**: `POST`
7. **HTTP Headers**:
   - Chave: `X-Cron-Secret`
   - Valor: `<SEU_CRON_SECRET>`

### Opção C: Teste Manual via cURL
```bash
curl -X POST http://localhost:3000/api/tarefas/expirar-pedidos \
  -H "X-Cron-Secret: rifazone_cron_secret_default"
```

**Resposta esperada (200 OK)**:
```json
{
  "success": true,
  "pedidosExpirados": 2,
  "cotasLiberadas": 10,
  "timestamp": "2026-08-23T12:00:00.000Z"
}
```

Se o secret estiver ausente ou incorreto, o endpoint retornará HTTP `401 Unauthorized`.
