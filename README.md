# 🚗 Work Travel Manager - Google Sheets Edition

Applicazione completa per la gestione di viaggi e ore lavorative nei negozi Vodafone dei MediaWorld.

**🆕 VERSIONE AGGIORNATA:** Database migrato da MongoDB a **Google Sheets** per zero costi operativi!

---

## ✨ Caratteristiche Principali

- ✅ **Autenticazione JWT** sicura con ruoli (Super Admin, HR, Sales)
- 📊 **Calendario interattivo** per gestione giornate lavorative
- 🏙️ **Gestione città** con calcolo automatico minuti viaggio
- 📁 **Import CSV** giornate con validazione completa
- 🧮 **Calcolo automatico** ore lavoro (esclusione 30 min + tolleranza 15 min)
- 👤 **Profilo utente** con modifica email
- 🎨 **Ruoli personalizzati** (solo Super Admin)
- 🔒 **Gestione permessi** e blocco utenti
- 💾 **Database Google Sheets** - Zero costi infrastrutturali!

---

## 🛠️ Stack Tecnologico

### Backend
- **FastAPI** (Python 3.11+)
- **Google Sheets API** (database)
- **JWT Authentication**
- **Bcrypt** password hashing
- **gspread** (Google Sheets client)

### Frontend
- **React 19**
- **React Router**
- **Axios** (con interceptor auth)
- **Tailwind CSS**
- **Shadcn UI**

### Deploy
- **Backend:** Fly.io (free tier)
- **Frontend:** Vercel (free tier)
- **Database:** Google Sheets (gratuito)

**💰 Costo totale:** €0/mese

---

## 📦 Installazione Locale

### Prerequisiti

- Python 3.11+
- Node.js 18+
- Yarn
- Service Account Google (vedi sotto)

### 1. Setup Google Sheets

#### Crea Service Account

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea progetto → Abilita "Google Sheets API" e "Google Drive API"
3. IAM & Admin → Service Accounts → Crea Service Account
4. Scarica JSON della chiave
5. Salva come `/backend/service_account.json`

#### Crea Spreadsheet

1. Crea nuovo Google Spreadsheet
2. Condividi con email del Service Account (permessi: Editor)
3. Copia Spreadsheet ID dall'URL
4. Aggiorna `SPREADSHEET_ID` in `/backend/db_sheets.py`

#### Inizializza Database

```bash
cd backend
python db_sheets.py      # Crea fogli (users, cities, workdays, roles)
python populate_data.py  # Popola dati iniziali
```

### 2. Backend Setup

```bash
cd backend

# Crea virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installa dipendenze
pip install -r requirements.txt

# Configura .env
cp .env.example .env
# Modifica JWT_SECRET e CORS_ORIGINS

# Avvia server
python server.py
# Backend: http://localhost:8001
```

### 3. Frontend Setup

```bash
cd frontend

# Installa dipendenze
yarn install

# Configura .env
echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env

# Avvia dev server
yarn start
# Frontend: http://localhost:3000
```

---

## 🌐 Deploy Produzione

Vedi **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** per istruzioni complete su:
- Deploy backend su **Fly.io**
- Deploy frontend su **Vercel**
- Configurazione Google Sheets API
- Setup Service Account

---

## 🔐 Credenziali Iniziali

Dopo `populate_data.py`:

### Super Admin
- **Username:** `adminamma`
- **Password:** `farfallaamma20`
- **Ruolo:** Super Admin (accesso completo)

### Sales User
- **Email:** `mario.rossi@mediaworld.it`
- **Password:** `amma1234`
- **Ruolo:** User (gestione proprie giornate + città)

---

## 📊 Import CSV

### Formato File

```csv
Giorno,Città,Minuti andata,Minuti ritorno,Minuti viaggio inclusi,Minuti lavoro in VIS,Presenza VIS (pausa),Arrivo VIS,Partenza da casa,Uscita VIS,Rientro a casa,Stato Giornata
01/12/2025,Verona,0,0,0,480,540,10:00:00,10:00:00,19:00:00,19:00:00,
24/12/2025,Modena,70,70,80,400,460,10:00:00,08:50:00,17:40:00,18:50:00,
26/12/2025,Festivo,,,,,,,,,, - Festivo -
```

### Caratteristiche Supportate

- ✅ Separatore `,` o `;` (auto-detect)
- ✅ Date formato: `DD/MM/YYYY`
- ✅ Orari formato: `HH:MM:SS` o `HH:MM`
- ✅ Stati speciali: Riposo, Festivo, Compleanno, Riunione, Ferie, Malattia

### Come Importare

1. Login come Sales user
2. Dashboard → Import CSV
3. Seleziona file `.csv`
4. Upload → Visualizza report (righe lette/salvate/errori)

---

## 🧮 Logica Calcolo Minuti

### Formula Ore Lavorative

```
Minuti Viaggio A/R = (Minuti Andata + Minuti Ritorno)
Minuti Viaggio Pagati = max(0, Minuti Andata - 30) * 2
Minuti Lavoro Negozio = 540 - Minuti Viaggio Pagati + Tolleranza (default: 15)
```

### Esempi

| Città | Viaggio (min) | Viaggio Pagato | Ore Negozio |
|-------|---------------|----------------|-------------|
| Verona | 0 | 0 | 9h 15min |
| Mantova | 30 | 0 | 9h 15min |
| Modena | 70 | 80 (40*2) | 7h 55min |
| Reggio Emilia | 80 | 100 (50*2) | 7h 35min |

**📌 Nota:** Primi 30 minuti andata/ritorno NON pagati (legge italiana).

---

## 🐛 Troubleshooting

### Backend non si avvia

```bash
# Verifica Service Account JSON
ls -la backend/service_account.json

# Verifica Google Sheets access
python backend/db_sheets.py

# Check dipendenze
pip install -r backend/requirements.txt

# Logs
tail -f /var/log/supervisor/backend.err.log
```

### Frontend non connette backend

```bash
# Verifica .env
cat frontend/.env
# Deve contenere: REACT_APP_BACKEND_URL=http://localhost:8001

# Riavvia
yarn start
```

### Errori Google Sheets API

```bash
# Verifica permessi Spreadsheet
# - Service Account email deve avere ruolo Editor
# - Spreadsheet ID corretto in db_sheets.py

# Test connessione
python backend/db_sheets.py
```

### Calendario non salva/modifica

- ✅ **RISOLTO:** Endpoint DELETE e PUT workdays corretti
- Verifica autenticazione JWT valida
- Check browser console per errori

---

## 📁 Struttura Progetto

```
work-travel-manager/
├── backend/
│   ├── server.py              # FastAPI app principale
│   ├── db_sheets.py           # Google Sheets database helper
│   ├── populate_data.py       # Script popolamento iniziale
│   ├── service_account.json   # Credenziali Google (NON committare!)
│   ├── requirements.txt       # Dipendenze Python
│   ├── .env                   # Config locale
│   └── fly.toml              # Config Fly.io deploy
├── frontend/
│   ├── src/
│   │   ├── App.js            # Componente principale
│   │   ├── components/       # Calendar, Dashboard, Login, etc.
│   │   ├── config/api.js     # Config backend URL
│   │   └── lib/axios.js      # Axios instance + interceptors
│   ├── public/
│   ├── package.json
│   └── .env                  # REACT_APP_BACKEND_URL
├── DEPLOY_GUIDE.md           # Guida deploy produzione
├── README.md                 # Questo file
└── .gitignore                # Ignora service_account.json, .env
```

---

## 🔄 Workflow Sviluppo

### Modifiche Backend

```bash
cd backend
# Modifica server.py o db_sheets.py
sudo supervisorctl restart backend
# Test: curl http://localhost:8001/api/
```

### Modifiche Frontend

```bash
cd frontend
# Modifica src/components/*
# Hot reload automatico
# Verifica browser: http://localhost:3000
```

### Commit & Deploy

```bash
git add .
git commit -m "feat: descrizione modifica"
git push origin main

# Vercel rileva push e fa auto-deploy frontend
# Fly.io: flyctl deploy (manuale)
```

---

## 🎯 Funzionalità Implementate

### A. Frontend Standalone ✅
- Configurazione API centralizzata
- Nessuna dipendenza Emergent
- Pronto per Vercel

### B. Autenticazione Robusta ✅
- Axios interceptor automatico
- Gestione 401/403
- Logout su token expired

### C. Permessi Sales ✅
- Sales può creare/modificare città
- Dashboard completo

### D. Profilo Email ✅
- Tab Profilo con edit email
- Validazione email univoca

### E. Ruoli Personalizzati ✅
- Super Admin crea ruoli custom
- Permessi configurabili

### F. CSV Import Completo ✅
- BOM handling
- Auto-detect separatore
- Validazione + logging

### G. Calendario Fix ✅
- Create/Update/Delete workdays funzionanti
- Date format DD/MM/YYYY e YYYY-MM-DD
- Città personalizzate supportate

### H. Google Sheets Database ✅
- CRUD operations complete
- Zero costi infrastrutturali
- Backup automatico Google Drive

---

## 📊 Database Schema (Google Sheets)

### Sheet: `users`
| id | username | email | password_hash | role | blocked | created_at |
|----|----------|-------|---------------|------|---------|------------|

### Sheet: `cities`
| id | name | travel_minutes | created_at |
|----|------|----------------|------------|

### Sheet: `workdays`
| id | user_id | date | city | is_custom_city | custom_city_name | custom_distance_km | custom_travel_minutes | ... | status | created_at |
|----|---------|------|------|----------------|------------------|--------------------|-----------------------|-----|--------|------------|

### Sheet: `roles`
| id | name | permissions | custom | created_at |
|----|------|-------------|--------|------------|

---

## 🔐 Note Sicurezza Produzione

⚠️ **IMPORTANTE:**

1. **JWT_SECRET** - Usa stringa random forte (32+ caratteri)
2. **Service Account JSON** - MAI committare su Git (aggiungi a `.gitignore`)
3. **Google Sheets** - Condividi SOLO con Service Account email
4. **CORS_ORIGINS** - Specifica esattamente dominio Vercel
5. **HTTPS only** - Fly.io e Vercel forniscono HTTPS automatico
6. **Backup** - Google Sheets ha versioning automatico

---

## 📞 Supporto

- **Documentazione Google Sheets API:** https://developers.google.com/sheets/api
- **Fly.io Docs:** https://fly.io/docs/
- **Vercel Docs:** https://vercel.com/docs

---

## 📄 Licenza

MIT License - Usa liberamente per progetti personali e commerciali.

---

## 🎉 Changelog

### v2.0.0 (Dicembre 2025)
- ✅ Migrazione MongoDB → Google Sheets
- ✅ Deploy ready per Fly.io + Vercel
- ✅ Fix calendario (delete/update workdays)
- ✅ Zero costi infrastrutturali
- ✅ Backup automatico Google Drive

### v1.0.0 (Iniziale)
- ✅ App completa con MongoDB
- ✅ Tutte le funzionalità A-F implementate
- ✅ Testing completo

---

**🚀 Pronto per il deploy? Leggi [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)!**
