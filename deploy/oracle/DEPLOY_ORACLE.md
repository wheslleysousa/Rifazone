# 🚀 Deploy do RifaZone na Oracle Cloud (Always Free) — App + Worker WhatsApp

Guia completo para rodar o **app** e o **worker do WhatsApp** numa VM da Oracle
Cloud que fica **sempre ligada, de graça e sem dormir**.

> Arquitetura na VM:
> - **App RifaZone** → Node na porta `3000` (interno)
> - **Caddy** → recebe o `443` (HTTPS público) e repassa para o app
> - **Worker WhatsApp** → Node na porta `3001` (interno, acessado por túnel SSH)
> - **Supabase** continua sendo seu banco (nada muda lá)

---

## Passo 0 — Criar a conta e a VM na Oracle

1. Crie a conta em <https://www.oracle.com/cloud/free/>.
   - ⚠️ Pede um **cartão só para verificação** — o plano **Always Free não cobra**.
2. No painel: **Menu → Compute → Instances → Create Instance**.
   - **Image:** Canonical **Ubuntu 22.04**.
   - **Shape:** **Ampere (VM.Standard.A1.Flex)** — coloque **2 OCPUs e 12 GB RAM**
     (bem dentro do Always Free, que dá até 4 OCPU / 24 GB). Sobra pro Chromium.
   - **SSH keys:** salve a chave privada (você vai usar pra conectar).
3. Depois de criada, anote o **IP público** da instância.

### Abrir as portas na Oracle (2 lugares!)
A Oracle bloqueia tudo por padrão. Libere as portas **80** e **443**:
- **Na nuvem (VCN):** Networking → sua **VCN** → **Security Lists** → Default →
  **Add Ingress Rules**: Source `0.0.0.0/0`, TCP, portas **80** e **443**.
- **No Ubuntu (iptables):** o `setup.sh` já faz isso automaticamente (passo 4).

---

## Passo 1 — Domínio grátis (necessário pro HTTPS)

Pagamento e login (Mercado Pago, Firebase) exigem **HTTPS**, e HTTPS precisa de
um domínio. Use o **DuckDNS** (grátis):

1. Entre em <https://www.duckdns.org> (login com Google).
2. Crie um subdomínio, ex: `rifazone` → vira `rifazone.duckdns.org`.
3. No campo **current ip**, coloque o **IP público da sua VM** e salve.

(Se você já tem um domínio próprio, só aponte um registro **A** para o IP.)

---

## Passo 2 — Conectar na VM e rodar o setup

No seu computador:

```bash
ssh -i sua-chave.key ubuntu@SEU_IP_PUBLICO
```

Já dentro da VM, rode o instalador (clona o repo, instala Node/Caddy/Chromium,
builda o app e o worker, e cria os serviços):

```bash
curl -fsSL https://raw.githubusercontent.com/wheslleysousa/Rifazone/main/deploy/oracle/setup.sh -o setup.sh
bash setup.sh
```

---

## Passo 3 — Configurar as variáveis de ambiente

### 3a) App — arquivo `/opt/rifazone/.env`
Crie o arquivo com **as mesmas variáveis que você usa no Render** (copie os
valores de lá). Exemplo dos nomes (veja `.env.example` na raiz do repo):

```bash
nano /opt/rifazone/.env
```
```
NODE_ENV=production
PORT=3000
APP_URL=https://rifazone.duckdns.org
BASE_URL=https://rifazone.duckdns.org

SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...

FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ... }   # a mesma linha JSON do Render

MP_CLIENT_ID=...
MP_CLIENT_SECRET=...
MP_ACCESS_TOKEN=...
MP_WEBHOOK_SECRET=...

EFI_CLIENT_ID=...
EFI_CLIENT_SECRET=...
EFI_CHAVE_PIX=...
EFI_AMBIENTE=producao
EFI_CERTIFICADO_BASE64=...

SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

GEMINI_API_KEY=...
CRON_SECRET=...
WORKER_SECRET=...
AUTH_DEV_BYPASS=false
```
> Dica: o `dotenv` lê esse arquivo. Para o `FIREBASE_SERVICE_ACCOUNT` (JSON
> grande), cole **tudo em uma linha só**, igual está no Render.

### 3b) Worker — arquivo `/opt/rifazone/rifazone-whatsapp-worker/.env`
```bash
nano /opt/rifazone/rifazone-whatsapp-worker/.env
```
```
PORT=3001
RIFAZONE_URL=http://localhost:3000
CRON_SECRET=...          # IGUAL ao do app
WORKER_SECRET=...        # IGUAL ao do app
DATA_PATH=/opt/rifazone/rifazone-whatsapp-worker/session_data
```

---

## Passo 4 — Configurar o domínio no Caddy e subir tudo

```bash
# Coloca seu domínio no Caddy (troque pelo seu):
sudo cp /opt/rifazone/deploy/oracle/Caddyfile /etc/caddy/Caddyfile
sudo sed -i 's/rifazone.duckdns.org/SEU_DOMINIO_AQUI/' /etc/caddy/Caddyfile

# Liga app, worker e Caddy (e faz iniciar sozinhos no boot):
sudo systemctl enable --now rifazone-app rifazone-worker caddy
sudo systemctl restart caddy
```

Em ~30s o Caddy pega o certificado HTTPS sozinho. Teste:
`https://SEU_DOMINIO/api/health` → deve responder `{"status":"ok"}`.

---

## Passo 5 — Agendador (expirar pedidos + remarketing)

```bash
crontab -e
```
Cole as 2 linhas do arquivo `deploy/oracle/rifazone-tarefas.cron` (troque
`SEU_CRON_SECRET` pelo valor real). Elas rodam localmente na VM.

---

## Passo 6 — Conectar o WhatsApp (escanear o QR)

O worker não é exposto na internet (segurança). Para ver o QR, abra um **túnel
SSH** do seu PC:

```bash
ssh -i sua-chave.key -L 3001:localhost:3001 ubuntu@SEU_IP_PUBLICO
```
Com o túnel aberto, no navegador do seu PC acesse: <http://localhost:3001/qr>
→ escaneie com o WhatsApp do celular (Aparelhos conectados). A sessão fica
salva em `DATA_PATH` — só precisa escanear de novo se você deslogar.

---

## Comandos úteis do dia a dia

```bash
# Ver logs ao vivo
sudo journalctl -u rifazone-app -f
sudo journalctl -u rifazone-worker -f

# Reiniciar
sudo systemctl restart rifazone-app
sudo systemctl restart rifazone-worker

# Atualizar o app depois de um push no GitHub
cd /opt/rifazone && git pull origin main && npm ci && npm run build && sudo systemctl restart rifazone-app
```

---

## Depois que tudo estiver no ar
- Atualize as **URLs de webhook** (Mercado Pago, Efí) e domínios autorizados do
  **Firebase Auth** para apontarem pro novo domínio `https://SEU_DOMINIO`.
- Pode desligar o serviço no Render (ou deixar como backup).

## Dúvidas comuns
- **Site não abre / HTTPS falha:** confira as portas 80/443 na **Security List**
  da VCN e rode `sudo systemctl status caddy`.
- **Worker não envia:** veja `journalctl -u rifazone-worker -f`; confirme que
  `CRON_SECRET`/`WORKER_SECRET` são iguais nos dois `.env` e que o WhatsApp está
  conectado (passo 6).
