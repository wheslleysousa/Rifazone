# 🤖 RifaZone WhatsApp Worker

Este é um projeto Node.js **separado** desenvolvido para conectar uma conta do WhatsApp via **WhatsApp Web** e processar automaticamente a fila de mensagens (`outbox`) do seu aplicativo **RifaZone**. 

Ele se conecta à fila do RifaZone de forma segura, consome mensagens destinadas ao WhatsApp, envia-as utilizando a biblioteca `whatsapp-web.js` (com Puppeteer) e devolve o status do envio (`enviada` ou `erro`).

---

## ⚠️ AVISO IMPORTANTE: PROTEÇÃO CONTRA BANIMENTOS
> **A automação através de emulação do WhatsApp Web (como esta ferramenta faz) viola os Termos de Serviço do WhatsApp.** 
> O uso indevido pode resultar no **banimento permanente** do seu número de telefone.
> 
> **Recomendações essenciais para reduzir drasticamente o risco de bloqueio:**
> 1. **Volume Baixo:** Não use o robô para fazer disparos massivos (spam). Limite o envio apenas para remarketing genuíno de clientes que geraram Pix ou realizaram compras no RifaZone.
> 2. **Intervalo Aleatório:** O robô já vem configurado de fábrica com um **atraso aleatório inteligente de 8 a 20 segundos** entre cada mensagem, simulando o comportamento de digitação humana e reduzindo as chances de detecção algorítmica.
> 3. **Mensagens Humanizadas:** Evite links secos e repetitivos. Utilize as variáveis do RifaZone como `{nome}` para que cada mensagem enviada seja única e personalizada.
> 4. **Aparelho Antigo/Aquecido:** Não utilize chips recém-comprados ("chips virgens"). Use números que já possuem histórico de conversação diária ativa (chamado de número "aquecido").

---

## ⚙️ Variáveis de Ambiente Necessárias

Configure estas variáveis no seu ambiente de execução (arquivo `.env` local ou nas configurações da sua VM/Plataforma Cloud):

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `RIFAZONE_URL` | URL completa de onde o seu app RifaZone está rodando | `https://seu-rifazone.com` |
| `CRON_SECRET` | Chave secreta compartilhada para ler/gravar na fila do RifaZone | `sua_chave_cron_secreta_aqui` |
| `WORKER_SECRET` | Chave de proteção para o endpoint de status do worker | `sua_chave_do_worker_secreta` |
| `PORT` | Porta onde o servidor Express do worker irá rodar (QR Code e Status) | `3001` |
| `DATA_PATH` | (Opcional) Caminho para persistência da sessão do WhatsApp Web | `/data` ou `./.wwebjs_auth` |

---

## 💻 Como Rodar Localmente (Desenvolvimento)

### Pré-requisitos
- Node.js instalado (versão **18.0.0** ou superior)
- Navegador Google Chrome/Chromium instalado no sistema (o Puppeteer o utilizará para a automação)

### Passo a Passo

1. Navegue até a pasta do worker:
   ```bash
   cd rifazone-whatsapp-worker
   ```

2. Instale as dependências npm:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente. Você pode exportá-las no seu terminal ou criar um arquivo `.env`:
   ```bash
   export RIFAZONE_URL="http://localhost:3000"
   export CRON_SECRET="rifazone_cron_secret_default"
   export WORKER_SECRET="rifazone_worker_secret_default"
   export PORT=3001
   ```

4. Inicie o trabalhador:
   ```bash
   npm start
   ```

5. **Escaneie o QR Code:**
   Abra seu navegador e acesse **`http://localhost:3001/qr`**. 
   Aponte a câmera do seu celular no WhatsApp (Aparelhos Conectados) para escanear o código QR gerado na tela. Assim que conectado, o status mudará para "Conectado" e os disparos começarão de forma automatizada a cada 15 segundos!

---

## ☁️ Como Subir em uma VM Sempre Ligada (Produção)

Para garantir que as mensagens sejam enviadas sem interrupções, você precisa hospedar este worker em um servidor ativo 24/7 que possua persistência de disco (para não deslogar o WhatsApp).

### Opção 1: Oracle Cloud Free Tier (Instância Linux Ubuntu)

A Oracle oferece instâncias gratuitas perfeitas para este tipo de carga.

1. **Crie sua instância Ubuntu** na Oracle Cloud.
2. **Instale as dependências do Puppeteer** (essencial para rodar o Chrome Headless em servidores sem interface gráfica):
   ```bash
   sudo apt update
   sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libext6 libxfixes3 libxi6 libxrandr2 librender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev
   ```
3. **Instale o Node.js v18+** na VM.
4. Clone ou transfira este diretório para o servidor.
5. Instale as dependências com `npm install`.
6. Crie um serviço permanente com o **PM2** para manter o worker ativo e reiniciar em caso de travamentos:
   ```bash
   sudo npm install -y pm2 -g
   pm2 start index.js --name "rifazone-worker" --env RIFAZONE_URL="https://seu-app-rifazone.com" --env CRON_SECRET="suacron" --env WORKER_SECRET="suaworker" --env PORT=3001
   pm2 save
   pm2 startup
   ```
7. Libere a porta `3001` no firewall da Oracle Cloud e acesse `http://ip-da-sua-vm:3001/qr` para escanear o QR Code.

### Opção 2: Fly.io (Hospedagem PaaS com Volume Persistente)

O Fly.io é uma opção prática que permite rodar containers com volumes persistentes.

1. Instale a ferramenta CLI do fly (`flyctl`) e faça login.
2. Crie um arquivo `fly.toml` na raiz da pasta do worker:
   ```toml
   app = "rifazone-whatsapp-worker"
   primary_region = "gru"

   [build]
     # Usa o buildpack padrão do Node
   
   [env]
     RIFAZONE_URL = "https://seu-app-rifazone.com"
     CRON_SECRET = "suacron"
     WORKER_SECRET = "suaworker"
     PORT = "8080"
     DATA_PATH = "/data"

   [[mounts]]
     source = "worker_data"
     destination = "/data"

   [http_service]
     internal_port = 8080
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
   ```
3. Crie o volume persistente de 1GB para armazenar a sessão do WhatsApp Web:
   ```bash
   fly volumes create worker_data --size 1
   ```
4. Faça o deploy:
   ```bash
   fly deploy
   ```
5. Acesse `https://rifazone-whatsapp-worker.fly.dev/qr` para escanear o QR Code.

---

## 📡 Endpoints de Monitoramento Expostos

O worker expõe dois caminhos principais para integração com o RifaZone ou monitoramento externo:

- **`GET /qr`**: Exibe o QR Code dinâmico gerado pelo WhatsApp para pareamento ou uma mensagem de sucesso caso já esteja conectado.
- **`GET /status?secret=WORKER_SECRET`**: Retorna um JSON detalhado com as informações de pareamento, ideal para o monitoramento central de integridade.
  ```json
  {
    "conectado": true,
    "numero": "5511999999999",
    "mensagemStatus": "Pronto para uso",
    "timestamp": "2026-08-23T15:30:00.000Z"
  }
  ```
