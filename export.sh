#!/bin/bash
# Script per preparare il progetto per il download

echo "🚀 Preparazione Work Travel Manager per download..."

# Crea directory di export
EXPORT_DIR="/tmp/work-travel-export"
rm -rf $EXPORT_DIR
mkdir -p $EXPORT_DIR

# Copia backend
echo "📦 Copia backend..."
cp -r /app/backend $EXPORT_DIR/
cd $EXPORT_DIR/backend

# Rimuovi cache e file temporanei
rm -rf __pycache__ .pytest_cache *.pyc .DS_Store

# Copia frontend
echo "📦 Copia frontend..."
cp -r /app/frontend $EXPORT_DIR/
cd $EXPORT_DIR/frontend

# Rimuovi node_modules e build
rm -rf node_modules build .DS_Store

# Copia file root
echo "📄 Copia file documentazione..."
cp /app/README.md $EXPORT_DIR/
cp /app/DEPLOY_GUIDE.md $EXPORT_DIR/
cp /app/.gitignore $EXPORT_DIR/ 2>/dev/null || echo "node_modules/
__pycache__/
*.pyc
.env
service_account.json
build/
.DS_Store" > $EXPORT_DIR/.gitignore

# Crea README per service_account.json
echo "⚠️  IMPORTANTE: Aggiungi il tuo service_account.json in backend/

1. Scarica il file JSON da Google Cloud Console
2. Salvalo come backend/service_account.json
3. NON committare su Git (già in .gitignore)

Vedi DEPLOY_GUIDE.md per istruzioni complete.
" > $EXPORT_DIR/backend/SERVICE_ACCOUNT_README.txt

# Crea archivio
echo "📦 Creazione archivio..."
cd /tmp
tar -czf work-travel-manager.tar.gz work-travel-export/

echo "✅ Export completo!"
echo ""
echo "📁 File creato: /tmp/work-travel-manager.tar.gz"
echo ""
echo "📋 Dimensione:"
du -h /tmp/work-travel-manager.tar.gz
echo ""
echo "🎉 Pronto per il download!"
echo ""
echo "Per estrarre:"
echo "  tar -xzf work-travel-manager.tar.gz"
