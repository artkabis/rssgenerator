#!/bin/bash

# Script d'initialisation de la démo RSS Generator
# Usage: ./scripts/setup-demo.sh

set -e

echo "🚀 Configuration de la démo RSS Generator..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Créer les dossiers nécessaires
echo -e "${BLUE}📁 Création des dossiers...${NC}"
mkdir -p server/data
mkdir -p server/rss
mkdir -p server/uploads

# Copier les données de démo
echo -e "${BLUE}📋 Copie des données de démonstration...${NC}"
cp demo/data/posts.json server/data/posts.json
cp demo/data/config.json server/data/config.json
cp demo/rss/feed.xml server/rss/feed.xml

echo -e "${GREEN}✅ Données de démo copiées avec succès !${NC}"

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installation des dépendances root...${NC}"
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo -e "${BLUE}📦 Installation des dépendances serveur...${NC}"
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${BLUE}📦 Installation des dépendances client...${NC}"
    cd client && npm install && cd ..
fi

echo ""
echo -e "${GREEN}🎉 Configuration terminée !${NC}"
echo ""
echo "Pour démarrer l'application en mode développement :"
echo "  npm run dev"
echo ""
echo "Le dashboard sera disponible sur : http://localhost:5173"
echo "Le flux RSS sera disponible sur : http://localhost:3001/rss/feed.xml"
