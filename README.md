# Syncly — Guida completa al deploy

Stack: React (frontend) · Node.js + Express (backend) · PostgreSQL (database)
Hosting: Netlify (frontend gratuito) · Railway (backend gratuito) · Supabase (database gratuito)

---

## 1. Prerequisiti da installare

Apri il terminale e verifica di avere:

```bash
node --version    # deve essere >= 18
npm --version     # deve essere >= 9
git --version
```

Se Node non è installato: https://nodejs.org (scarica la versione LTS)

---

## 2. Metti il progetto su GitHub

1. Vai su https://github.com e crea un account (gratis)
2. Clicca "New repository" → chiama il repo `syncly` → crea
3. Nel terminale, entra nella cartella del progetto:

```bash
cd syncly
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/TUO_USERNAME/syncly.git
git push -u origin main
```

---

## 3. Crea il database su Supabase (gratis)

1. Vai su https://supabase.com → "Start your project" → crea account con GitHub
2. "New project" → dai un nome (es. `syncly-db`) → scegli una password → regione `EU West`
3. Aspetta 1-2 minuti che il progetto si avvii
4. Vai su **Settings → Database** e copia la stringa `Connection string (URI)`
   - Sarà tipo: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`
   - Sostituisci `[YOUR-PASSWORD]` con la password che hai scelto

Tieni questa stringa, serve nel prossimo step.

---

## 4. Deploy del backend su Railway (gratis)

1. Vai su https://railway.app → "Login with GitHub"
2. "New Project" → "Deploy from GitHub repo" → seleziona `syncly`
3. Clicca sulla cartella che Railway ha rilevato → **Root Directory**: imposta `backend`
4. Vai su **Variables** e aggiungi queste variabili d'ambiente:

```
DATABASE_URL     = (la stringa Supabase del passo 3)
JWT_SECRET       = (una stringa casuale lunga, es: metti-qui-30-caratteri-random-sicuri)
FRONTEND_URL     = https://syncly.netlify.app
PORT             = 4000
```

5. Vai su **Settings → Networking → Generate Domain**
   Railway ti darà un URL tipo `syncly-production.up.railway.app` — copialo!

6. Il backend si deploya automaticamente. Aspetta 2-3 minuti poi apri:
   `https://syncly-production.up.railway.app/health`
   Devi vedere: `{"status":"ok"}`

Il backend al primo avvio crea tutte le tabelle in automatico nel database.

---

## 5. Deploy del frontend su Netlify (gratis)

1. Vai su https://netlify.com → "Sign up with GitHub"
2. "Add new site" → "Import an existing project" → GitHub → seleziona `syncly`
3. Configura il deploy:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
4. Prima di cliccare Deploy, vai su **Environment variables** e aggiungi:

```
REACT_APP_API_URL     = https://syncly-production.up.railway.app
REACT_APP_SOCKET_URL  = https://syncly-production.up.railway.app
```

(Sostituisci con il tuo URL Railway reale)

5. Clicca "Deploy site" — Netlify ti darà un URL tipo `https://amazing-name-123.netlify.app`

---

## 6. Aggiorna FRONTEND_URL nel backend

Ora che sai l'URL di Netlify, torna su Railway:
- Vai su **Variables**
- Aggiorna `FRONTEND_URL` con il tuo URL Netlify reale (es. `https://amazing-name-123.netlify.app`)
- Railway rideploya automaticamente

---

## 7. Testa tutto

Apri il tuo URL Netlify nel browser:
1. Clicca "Registrati" → crea il tuo account
2. Crea il primo progetto
3. Aggiungi idee, task, invita colleghi

Per invitare colleghi: mandagli l'URL Netlify, si registrano e tu li aggiungi al progetto dalla dashboard API (prossima versione avrà il form nella UI).

---

## Sviluppo in locale (opzionale)

Se vuoi modificare il codice in locale prima di pushare:

```bash
# Backend
cd backend
cp .env.example .env
# modifica .env con le tue credenziali
npm install
npm run dev   # parte su localhost:4000

# Frontend (in un altro terminale)
cd frontend
cp .env.example .env
# .env già punta a localhost:4000
npm install
npm start     # apre il browser su localhost:3000
```

---

## Struttura del progetto

```
syncly/
├── backend/
│   ├── server.js          ← punto di ingresso, Express + Socket.io
│   ├── db/schema.js       ← connessione PostgreSQL + creazione tabelle
│   ├── middleware/auth.js  ← verifica JWT
│   └── routes/
│       ├── auth.js         ← POST /register, POST /login, GET /me
│       ├── ideas.js        ← CRUD idee + voti
│       ├── tasks.js        ← CRUD task + cambio status
│       └── projects.js     ← CRUD progetti + membri + epic
└── frontend/
    ├── src/
    │   ├── App.js           ← routing principale
    │   ├── api.js           ← client HTTP centralizzato
    │   ├── contexts/
    │   │   ├── AuthContext.js    ← login/register/logout globale
    │   │   └── SocketContext.js  ← connessione Socket.io globale
    │   └── pages/
    │       ├── AuthPage.js       ← pagina login/registrazione
    │       └── Dashboard.js      ← app principale (4 viste)
    └── public/index.html
```

---

## Costi

Tutto gratis per un piccolo team:
- Supabase Free: 500MB database, illimitati utenti
- Railway Free: 500 ore/mese (sufficiente per uso normale)
- Netlify Free: illimitati deploy, dominio gratuito

Quando il team cresce oltre 10 persone o hai bisogno di più storage, i piani a pagamento partono da ~5€/mese per servizio.
