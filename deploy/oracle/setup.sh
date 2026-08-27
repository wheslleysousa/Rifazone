#!/usr/bin/env bash
# =====================================================================
# RifaZone — provisionamento da VM Oracle Cloud (Ubuntu 22.04)
# Roda o app + worker do WhatsApp sempre ligados, de graça.
# Uso:  bash setup.sh
# Rode como usuário 'ubuntu' (padrão do Oracle Ubuntu). Use sudo quando pedir.
# =====================================================================
set -e

REPO_URL="https://github.com/wheslleysousa/Rifazone.git"
APP_DIR="/opt/rifazone"

echo "==> 1/8 Atualizando o sistema..."
sudo apt-get update -y && sudo apt-get upgrade -y

echo "==> 2/8 Instalando Node.js 20 LTS + git + Caddy..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git debian-keyring debian-archive-keyring apt-transport-https curl
# Caddy (repositório oficial)
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
sudo apt-get update -y && sudo apt-get install -y caddy

echo "==> 3/8 Instalando dependências do Chromium (para o worker WhatsApp)..."
# Bibliotecas que o Chromium do Puppeteer precisa (o próprio npm install baixa o Chromium certo p/ a arquitetura)
sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
  libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release \
  wget xdg-utils 2>/dev/null || true

echo "==> 4/8 Abrindo portas 80/443 no firewall local (gotcha clássico do Oracle Ubuntu)..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo netfilter-persistent save || (sudo apt-get install -y iptables-persistent && sudo netfilter-persistent save)

echo "==> 5/8 Clonando/atualizando o repositório em ${APP_DIR}..."
sudo mkdir -p "${APP_DIR}"
sudo chown -R ubuntu:ubuntu "${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  git -C "${APP_DIR}" pull origin main
else
  git clone "${REPO_URL}" "${APP_DIR}"
fi

echo "==> 6/8 Instalando dependências e buildando o app..."
cd "${APP_DIR}"
npm ci
npm run build

echo "==> 7/8 Instalando o worker do WhatsApp (baixa o Chromium do Puppeteer)..."
cd "${APP_DIR}/rifazone-whatsapp-worker"
npm install

echo "==> 8/8 Instalando os serviços systemd (app + worker)..."
sudo cp "${APP_DIR}/deploy/oracle/rifazone-app.service" /etc/systemd/system/
sudo cp "${APP_DIR}/deploy/oracle/rifazone-worker.service" /etc/systemd/system/
sudo systemctl daemon-reload

echo ""
echo "=============================================================="
echo " Instalação base concluída. FALTAM 3 PASSOS MANUAIS:"
echo " 1) Criar /opt/rifazone/.env (variáveis do app)"
echo " 2) Criar /opt/rifazone/rifazone-whatsapp-worker/.env (worker)"
echo " 3) Configurar o domínio no /etc/caddy/Caddyfile"
echo " Depois: sudo systemctl enable --now rifazone-app rifazone-worker caddy"
echo " Veja o passo a passo em deploy/oracle/DEPLOY_ORACLE.md"
echo "=============================================================="
