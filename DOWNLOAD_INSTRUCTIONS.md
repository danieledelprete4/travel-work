# 📥 ISTRUZIONI DOWNLOAD COMPLETO

## ✅ PROGETTO PRONTO

**Migrazione MongoDB → Google Sheets completata!**
**UI restyling Apple (bianco/nero minimale) completato!**

---

## 📦 OPZIONE 1: Git (Consigliato)

```bash
# Sul tuo computer locale
git clone <repository-url>
cd work-travel-manager

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# ⚠️ IMPORTANTE: Aggiungi service_account.json
# Scarica da Google Cloud Console e salva come:
# backend/service_account.json

# Frontend setup
cd ../frontend
yarn install

# Configura .env
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Avvia backend
cd ../backend
python server.py

# Avvia frontend (nuovo terminale)
cd frontend
yarn start
```

---

## 📦 OPZIONE 2: Download Diretto

### File da scaricare manualmente:

1. **Backend completi:**
   - `/app/backend/server.py`
   - `/app/backend/db_sheets.py` 
   - `/app/backend/populate_data.py`
   - `/app/backend/requirements.txt`
   - `/app/backend/.env`
   - ⚠️ `/app/backend/service_account.json` (GIÀ PRESENTE)

2. **Frontend completo:**
   - `/app/frontend/` (intera cartella)

3. **Documentazione:**
   - `/app/README.md`
   - `/app/DEPLOY_GUIDE.md`
   - `/app/MIGRATION_SUMMARY.md`

### Comandi per creare archivio:

```bash
# Su server
cd /app
tar -czf work-travel-complete.tar.gz \
  backend/server.py \
  backend/db_sheets.py \
  backend/populate_data.py \
  backend/requirements.txt \
  backend/.env \
  backend/service_account.json \
  frontend/ \
  README.md \
  DEPLOY_GUIDE.md \
  MIGRATION_SUMMARY.md \
  .gitignore

# Download su locale
scp user@server:/app/work-travel-complete.tar.gz .

# Estrai
tar -xzf work-travel-complete.tar.gz
```

---

## 🔑 CREDENZIALI

**Super Admin:**
- Username: `adminamma`
- Password: `farfallaamma20`

**Sales User:**
- Email: `mario.rossi@mediaworld.it`
- Password: `amma1234`

**Google Sheets:**
- Spreadsheet ID: `1oUun7urYjJZeLz8G8Lnbo3g9Eyptt34yGEAhNdZFBeA`
- Service Account: `amma-service@amma-backend-482318.iam.gserviceaccount.com`

---

## ✅ CHECKLIST PRE-DEPLOY

- [x] Database migrato a Google Sheets
- [x] Backend testato (login, cities, workdays, CSV)
- [x] UI restyling Apple completato
- [x] Service Account JSON presente
- [x] Dati iniziali popolati (2 users, 7 cities)
- [ ] Test frontend completo (fallo tu)
- [ ] Deploy Fly.io (segui DEPLOY_GUIDE.md)
- [ ] Deploy Vercel (auto da Git)

---

## 🎨 RESTYLING APPLICATO

✅ **Stile Apple minimale:**
- Sfondo bianco puro
- Bordi sottili grigi
- Bottoni neri con rounded-full
- Typography pulita (font-semibold, tracking-tight)
- Input con bg-gray-50
- Nessun gradient, focus su contenuto

---

## 💰 COSTI: €0/mese

- Google Sheets: Free
- Fly.io: Free tier
- Vercel: Free tier

---

## 🚀 PROSSIMI STEP

1. Scarica tutto (Git o manuale)
2. Test locale: `python server.py` + `yarn start`
3. Verifica login funziona
4. Deploy produzione (DEPLOY_GUIDE.md)
5. Profit! 🎉
