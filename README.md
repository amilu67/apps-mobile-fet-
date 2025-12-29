# Apps Mobile FET

Progressive Web Apps (PWA) per la visualizzazione e gestione degli orari scolastici generati con [FET - Free Timetabling Software](https://lalescu.ro/liviu/fet/).

## 📱 Applicazioni Incluse

### 1. **Student App** - App per Studenti
App mobile per consultare orari delle classi, sostituzioni e assenze.

**Funzionalità:**
- Visualizzazione orario classi
- Consultazione sostituzioni docenti in tempo reale
- Notifica classi assenti (gite, eventi)
- Ricerca docenti per ora e giorno
- Interfaccia ottimizzata per mobile

### 2. **Staff App** - App per Personale Scolastico
App gestionale per il personale amministrativo e docenti.

**Funzionalità:**
- Tutte le funzionalità dell'app studenti
- **Gestione sostituzioni docenti**
- **Ricerca docenti disponibili per ora**
- **Gestione classi assenti**
- Pubblicazione sostituzioni via WhatsApp/Telegram
- Sincronizzazione in tempo reale con Firebase

### 3. **Converter App** - Convertitore FET
Tool per convertire i file FET in formato JSON e caricarli su Firebase.

**Funzionalità:**
- Importazione file FET (.fet)
- Importazione soluzione oraria (XML)
- Configurazione nome istituto e anno scolastico
- Configurazione materie per ore a disposizione
- Upload automatico su Firebase Realtime Database
- Statistiche complete sull'orario generato

## 🚀 Installazione

### Prerequisiti
- Node.js (v14 o superiore)
- Account Firebase (gratuito)
- Firebase CLI: `npm install -g firebase-tools`

### Setup Firebase

1. **Crea un progetto Firebase:**
   - Vai su [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuovo progetto
   - Abilita **Realtime Database**
   - Imposta le regole del database (vedi `FIREBASE_SETUP.html`)

2. **Crea 3 siti Hosting Firebase:**
   ```bash
   firebase hosting:sites:create YOUR-STUDENT-SITE
   firebase hosting:sites:create YOUR-STAFF-SITE
   firebase hosting:sites:create YOUR-CONVERTER-SITE
   ```

3. **Configura le credenziali:**

   Per ogni app (student-app, staff-app, converter-app):
   
   a. Copia il file template:
   ```bash
   cp firebase-config.js.template firebase-config.js
   cp .firebaserc.template .firebaserc
   ```
   
   b. Modifica `firebase-config.js` con le tue credenziali Firebase
   
   c. Modifica `.firebaserc` con il nome del tuo progetto e siti hosting

### Deploy

Deploy di ogni singola app:

```bash
# Student App
cd student-app
firebase deploy --only hosting

# Staff App
cd staff-app
firebase deploy --only hosting

# Converter App
cd converter-app
firebase deploy --only hosting
```

## 📖 Utilizzo

### 1. Converti l'orario FET
1. Apri la **Converter App**
2. Carica i file:
   - File FET (.fet)
   - Soluzione XML (da FET: "File > Export > Simple XML...")
3. Configura:
   - Nome istituzione
   - Anno scolastico
   - Materie per disponibilità (es: "D", "Disp")
4. Clicca "Converti e Carica su Firebase"

### 2. Accedi alle App
- **Studenti**: possono consultare orari e sostituzioni
- **Staff**: possono gestire sostituzioni e classi assenti

### 3. Installazione su Smartphone
Le app sono PWA installabili:
- **Android/iOS**: Apri l'app nel browser > Menu > "Aggiungi a schermata Home"

## 🔒 Sicurezza

### Regole Firebase Database
Imposta queste regole nel Realtime Database:

```json
{
  "rules": {
    "orario": {
      ".read": true,
      ".write": false
    },
    "sostituzioni": {
      ".read": true,
      ".write": true
    },
    "classi_assenti": {
      ".read": true,
      ".write": true
    }
  }
}
```

### Best Practices
- Non committare mai `firebase-config.js` o `.firebaserc` con credenziali reali
- Usa file `.template` per il versioning
- Considera l'aggiunta di autenticazione Firebase per l'app staff
- Limita le operazioni di scrittura solo agli utenti autorizzati

## 📁 Struttura Progetto

```
apps-mobile-fet/
├── student-app/          # App studenti
│   ├── index.html
│   ├── app_ricerca_classi.html
│   ├── app_sostituzioni_studenti.html
│   ├── firebase-config.js.template
│   └── .firebaserc.template
├── staff-app/            # App staff
│   ├── index.html
│   ├── app_ricerca_classi.html
│   ├── app_sostituzioni_v3.html
│   ├── gestione_classi_assenti.html
│   ├── firebase-config.js.template
│   └── .firebaserc.template
├── converter-app/        # Convertitore FET
│   ├── index.html
│   ├── converter.js
│   ├── fet-parser.js
│   ├── firebase-config.js.template
│   └── .firebaserc.template
├── README.md             # Questo file
├── MANUALE.html          # Manuale utente completo
└── FIREBASE_SETUP.html   # Guida setup Firebase
```

## 🛠️ Tecnologie Utilizzate

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Firebase Realtime Database
- **Hosting**: Firebase Hosting
- **PWA**: Service Workers, Manifest, Offline Support
- **UI**: Font Awesome Icons, Responsive Design

## 📝 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file LICENSE per i dettagli.

## 🤝 Contributi

I contributi sono benvenuti! Per favore:
1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📧 Supporto

Per problemi, domande o suggerimenti, apri una issue su GitHub.

## 🙏 Credits

- Sviluppato per l'integrazione con [FET - Free Timetabling Software](https://lalescu.ro/liviu/fet/)
- Icone: [Font Awesome](https://fontawesome.com/)
- Backend: [Firebase](https://firebase.google.com/)
