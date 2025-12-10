#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando setup do WCAG Analyser...${NC}"

# Verificar se pnpm está instalado
if ! command -v pnpm &> /dev/null; then
    echo "pnpm não encontrado. Instalando..."
    npm install -g pnpm
fi

# Instalar dependências
echo -e "${GREEN}📦 Instalando dependências...${NC}"
pnpm install

# Subir banco de dados
echo -e "${GREEN}🗄️  Iniciando MongoDB...${NC}"
docker compose up -d mongo

# Aguardar Mongo estar pronto (check simples)
echo "Aguardando MongoDB iniciar..."
sleep 5

# Build dos pacotes
echo -e "${GREEN}🏗️  Buildando o projeto...${NC}"
pnpm build

echo -e "${GREEN}✅ Setup concluído!${NC}"
echo -e "Para iniciar em modo desenvolvimento, execute: ${GREEN}pnpm dev${NC}"
echo -e "Para rodar os testes, execute: ${GREEN}pnpm test${NC}"
