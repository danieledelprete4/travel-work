# 🚀 GUIDA DEPLOY - Vercel + Fly.io + Google Sheets

## ✅ PREREQUISITI

- Account **Google Cloud** (per Service Account)
- Account **Vercel** (gratuito)
- Account **Fly.io** (gratuito fino a 3 app)
- Git repository (GitHub, GitLab, Bitbucket)

---

## 📋 STEP 1: Preparazione Google Sheets

### 1.1 Google Cloud Console

1. Vai su https://console.cloud.google.com/
2. Crea nuovo progetto: **"amma-backend"**
3. Abilita API:
   - Google Sheets API
   - Google Drive API

### 1.2 Service Account

1. IAM & Admin → Service Accounts → Create Service Account
2. Nome: **amma-service**
3. Role: **Editor**
4. Crea chiave → JSON → Scarica il file `service_account.json`

### 1.3 Google Spreadsheet

1. Crea nuovo Google Spreadsheet
2. Condividi con email del Service Account (trovata nel JSON)
3. Permessi: **Editor**
4. Copia Spreadsheet ID dall'URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### 1.4 Inizializza Database

```bash
cd backend
python db_sheets.py      # Crea i fogli (users, cities, workdays, roles)
python populate_data.py  # Popola dati iniziali
```

---

## 📦 STEP 2: Deploy Backend su Fly.io

### 2.1 Installa Fly CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### 2.2 Login

```bash
flyctl auth login
```

### 2.3 Crea `fly.toml`

Crea file `/backend/fly.toml`:

```toml
app = "amma-work-travel"
primary_region = "fra"  # Frankfurt (puoi cambiare: lhr=London, ams=Amsterdam)

[build]
  builder = "paketobuildpacks/builder:base"
  buildpacks = ["gcr.io/paketo-buildpacks/python"]

[env]
  PORT = "8001"

[http_service]
  internal_port = 8001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

### 2.4 Crea `Procfile`

Crea file `/backend/Procfile`:

```
web: python server.py
```

### 2.5 Deploy

```bash
cd backend

# Prima volta (crea app)
flyctl launch --no-deploy

# Carica Service Account JSON come secret
flyctl secrets set SERVICE_ACCOUNT_JSON="$(cat service_account.json)"

# Carica JWT secret
flyctl secrets set JWT_SECRET="your-super-secret-key-2025-production"

# Carica CORS origins (con dominio Vercel)
flyctl secrets set CORS_ORIGINS="https://your-app.vercel.app,http://localhost:3000"

# Deploy!
flyctl deploy
```

### 2.6 Verifica

```bash
flyctl status
flyctl logs

# Test API
curl https://amma-work-travel.fly.dev/api/
```

**📝 Nota Backend URL:** Salva questo URL, servirà per frontend!

---

## 🌐 STEP 3: Deploy Frontend su Vercel

### 3.1 Push su GitHub

```bash
# Se non hai ancora fatto commit
git init
git add .
git commit -m "feat: Work Travel Manager with Google Sheets backend"
git branch -M main
git remote add origin https://github.com/tuousername/work-travel-app.git
git push -u origin main
```

### 3.2 Connetti Vercel

1. Vai su https://vercel.com/
2. Click **"Add New Project"**
3. Importa il tuo repository GitHub
4. Configura:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `yarn build`
   - **Output Directory:** `build`

### 3.3 Variabili Ambiente

In Vercel Dashboard → Settings → Environment Variables:

```
REACT_APP_BACKEND_URL=https://amma-work-travel.fly.dev
```

**⚠️ IMPORTANTE:** Sostituisci con il tuo URL Fly.io!

### 3.4 Deploy

Click **"Deploy"** → Attendi completamento (2-3 minuti)

### 3.5 Aggiorna CORS Backend

Dopo aver ottenuto l'URL Vercel (es: `https://work-travel.vercel.app`):

```bash
cd backend
flyctl secrets set CORS_ORIGINS="https://work-travel.vercel.app,http://localhost:3000"
```

---

## 🧪 STEP 4: Testing Produzione

### 4.1 Test Backend

```bash
# Health check
curl https://amma-work-travel.fly.dev/api/

# Test login Super Admin
curl -X POST https://amma-work-travel.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"adminamma","password":"farfallaamma20"}'
```

### 4.2 Test Frontend

1. Apri `https://work-travel.vercel.app`
2. Login Super Admin: `adminamma` / `farfallaamma20`
3. Login Sales: `mario.rossi@mediaworld.it` / `amma1234`
4. Crea giornata lavorativa
5. Import CSV
6. Verifica calcolo minuti

---

## 💰 COSTI (Piano Gratuito)

### Vercel
- ✅ 100 GB bandwidth/mese
- ✅ Deploy illimitati
- ✅ Custom domain
- **Costo: $0/mese**

### Fly.io
- ✅ 3 VM shared-cpu-1x (256MB RAM)
- ✅ 3GB storage persistente
- ✅ 160GB bandwidth/mese
- **Costo: $0/mese** (con carta registrata)

### Google Sheets
- ✅ 15GB storage Google Drive
- ✅ API calls: 100 req/100 sec (sufficienti)
- **Costo: $0/mese**

**TOTALE: €0/mese** 🎉

---

## 🔄 Aggiornamenti Futuri

### Backend (Fly.io)

```bash
cd backend
# Modifica codice
flyctl deploy
```

### Frontend (Vercel)

Vercel rileva automaticamente i push su GitHub main branch.

```bash
git add .
git commit -m "feat: nuova funzionalità"
git push origin main
# Auto-deploy in ~2 minuti
```

---

## 🐛 Troubleshooting

### Errore: "Service Account permission denied"

```bash
# Verifica che Service Account abbia permessi Editor sul Google Sheet
# Condividi sheet con email: amma-service@amma-backend-482318.iam.gserviceaccount.com
```

### Errore: "CORS blocked"

```bash
# Aggiorna CORS_ORIGINS su Fly.io
flyctl secrets set CORS_ORIGINS="https://your-vercel-url.vercel.app"
```

### Backend Fly.io non risponde

```bash
# Check logs
flyctl logs

# Restart app
flyctl apps restart amma-work-travel

# Scale up (se auto-stop è abilitato)
flyctl scale count 1
```

### Frontend Vercel non carica dati

1. Verifica `REACT_APP_BACKEND_URL` in Vercel settings
2. Controlla browser console per errori CORS
3. Test backend direttamente: `curl https://your-backend.fly.dev/api/`

---

## 📞 SUPPORTO

- **Fly.io Community:** https://community.fly.io/
- **Vercel Discord:** https://vercel.com/discord
- **Google Sheets API Docs:** https://developers.google.com/sheets/api

---

## ✅ CHECKLIST PRE-DEPLOY

- [ ] Service Account JSON creato e testato
- [ ] Google Sheet condiviso con Service Account
- [ ] `db_sheets.py` eseguito (fogli creati)
- [ ] `populate_data.py` eseguito (dati iniziali)
- [ ] Backend testato in locale (`python server.py`)
- [ ] Frontend testato in locale (`yarn start`)
- [ ] Repository Git creato e pushato
- [ ] Fly.io app creata e secrets configurati
- [ ] Vercel app connessa con env vars
- [ ] CORS aggiornato con URL Vercel
- [ ] Login Super Admin testato in produzione
- [ ] Login Sales testato in produzione
- [ ] Creazione workday testata
- [ ] Import CSV testato

---

**🎉 DEPLOY COMPLETO! Il tuo Work Travel Manager è live!**
