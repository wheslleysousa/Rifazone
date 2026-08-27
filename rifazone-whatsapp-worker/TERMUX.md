# 📱 Rodar o Worker do WhatsApp no Termux (Android) — grátis, sem cartão

Guia pra rodar o worker de remarketing num celular Android usando o **Termux**.
Funciona junto com o app hospedado no Render (grátis). O celular precisa ficar
ligado/carregando pra manter o WhatsApp conectado.

> ⚠️ Instale o **Termux pelo F-Droid** (https://f-droid.org/packages/com.termux/),
> **NÃO** pela Play Store — a versão da Play Store é antiga e dá erro.

---

## 1. Preparar o Termux

```bash
pkg update && pkg upgrade -y
pkg install -y nodejs git
```

Instalar o Chromium (o Puppeteer vai usar este, não o dele):
```bash
pkg install -y tur-repo
pkg install -y chromium
```
Confira o caminho do chromium (guarde, vai usar no .env):
```bash
which chromium
# geralmente: /data/data/com.termux/files/usr/bin/chromium
```

---

## 2. Baixar o worker

```bash
cd ~
git clone https://github.com/wheslleysousa/Rifazone.git
cd Rifazone/rifazone-whatsapp-worker
```

Instalar as dependências **sem** baixar o Chromium do Puppeteer (que não roda no Android):
```bash
export PUPPETEER_SKIP_DOWNLOAD=true
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
npm install
```

---

## 3. Configurar o `.env`

```bash
nano .env
```
Cole (troque pelos SEUS valores — os secrets têm que ser **iguais aos do app no Render**):
```
PORT=3001
RIFAZONE_URL=https://rifazone.onrender.com
CRON_SECRET=coloque_o_mesmo_do_app
WORKER_SECRET=coloque_o_mesmo_do_app
DATA_PATH=./session_data
PUPPETEER_EXECUTABLE_PATH=/data/data/com.termux/files/usr/bin/chromium
```
Salve com `Ctrl+O`, `Enter`, e saia com `Ctrl+X`.

---

## 4. Impedir o Android de matar o worker

```bash
# Impede o celular de "dormir" e derrubar o processo:
termux-wake-lock
```
E no Android: **Configurações → Apps → Termux → Bateria → Sem restrição /
Não otimizar**. Deixe o celular no carregador.

---

## 5. Rodar e conectar o WhatsApp

```bash
node index.js
```
Vai aparecer um **QR Code direto no terminal**. Abra o **WhatsApp → Aparelhos
conectados → Conectar um aparelho** e escaneie o QR da tela do Termux.

> Se o QR ficar "quebrado" na tela, diminua a fonte do Termux (aperte com dois
> dedos e junte) ou acesse `http://localhost:3001/qr` no Chrome do próprio
> celular pra ver a imagem.

Pronto! A sessão fica salva em `session_data` — só precisa escanear de novo se
você desconectar.

---

## 6. Deixar rodando sempre (opcional, recomendado)

Pra reiniciar sozinho se cair, instale o **pm2**:
```bash
npm install -g pm2
pm2 start index.js --name rifazone-worker
pm2 save
```
Ver logs: `pm2 logs rifazone-worker` · Parar: `pm2 stop rifazone-worker`

---

## Dúvidas comuns
- **"Failed to launch the browser process":** confira o `PUPPETEER_EXECUTABLE_PATH`
  (rode `which chromium` e use o caminho exato). O código já usa `--no-sandbox`.
- **Worker não envia mensagens:** confirme que `RIFAZONE_URL` aponta pro seu app
  no Render e que `CRON_SECRET`/`WORKER_SECRET` são **idênticos** aos do app.
- **Parou ao bloquear a tela:** rode `termux-wake-lock` e tire o Termux da
  otimização de bateria (passo 4).
