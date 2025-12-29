# FET to orario.json Converter

App web per convertire i file FET (Free Timetabling Software) nel formato `orario.json` utilizzato dalle app `pwa_orario_completa` e `pwa_orario_completa_staff`.

## 🎯 Funzionalità

- **Import file FET**: Carica il file `.fet` con le attività didattiche
- **Import XML soluzione**: Carica il file `activities.xml` con l'orario definitivo
- **Conversione automatica**: Genera automaticamente il file `orario.json` compatibile
- **Download**: Scarica il file generato pronto per l'uso
- **Upload Firebase**: Carica automaticamente i dati su Firebase Realtime Database

## 📋 Requisiti

- File `.fet` (generato da FET Timetabling)
- File `activities.xml` (soluzione finale generata da FET)

## 🚀 Come usare

1. Apri `index.html` nel browser
2. Carica il file `.fet` 
3. Carica il file `activities.xml` (soluzione)
4. Clicca su "Converti"
5. Scarica il file `orario.json` generato

## 📁 Struttura file generato

Il file `orario.json` contiene:

```json
{
  "istituto": "Nome Istituto",
  "anno_scolastico": "2024-2025",
  "orario": {
    "giorni": ["Lunedì", "Martedì", ...],
    "inizio": "08:00",
    "fine": "15:00",
    "fasce_orarie": ["08:00-09:00", ...]
  },
  "laboratori": [
    {
      "nome": "Nome Laboratorio",
      "lezioni": [
        {
          "giorno": "Lunedì",
          "ora_inizio": "08:00",
          "ora_fine": "09:00",
          "durata_minuti": 60,
          "classe": "1A",
          "materia": "Matematica",
          "docenti": ["Rossi"],
          "aula": "Lab01"
        }
      ]
    }
  ]
}
```

## 🔧 Utilizzo con le app complete

### Opzione 1: Upload automatico su Firebase (⭐ Consigliato)

1. Dopo la conversione, clicca **"Carica su Firebase"**
2. I dati vengono caricati automaticamente su Firebase Realtime Database
3. Path: `/orario`
4. Le app pwa_orario_completa e pwa_orario_completa_staff leggeranno i dati da Firebase

**Vantaggi:**
- ✅ Aggiornamento in tempo reale
- ✅ Nessun bisogno di copiare file manualmente
- ✅ Le app si sincronizzano automaticamente
- ✅ Accessibile da qualsiasi dispositivo

### Opzione 2: Download manuale

Dopo aver generato `orario.json`:

1. Clicca **"Scarica orario.json"**
2. Copia il file nelle cartelle:
   - `pwa_orario_completa/orario.json`
   - `pwa_orario_completa_staff/orario.json`
3. Le app caricheranno automaticamente i dati

## 📦 File inclusi

- `index.html` - Interfaccia web
- `converter.js` - Logica di conversione
- `fet-parser.js` - Parser file FET (da pwa_base)
- `timetable-parser.js` - Parser XML soluzione (da pwa_base)
- `utils.js` - Utility functions (da pwa_base)

## 🛠 Deploy

### Hosting locale
Serve un server HTTP per i moduli ES6:

```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx http-server
```

Poi apri: `http://localhost:8000`

### Firebase Hosting

Per deployare su Firebase:

1. Installa Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Inizializza Firebase:
```bash
firebase init hosting
```

3. Deploy:
```bash
firebase deploy --only hosting
```

## 📝 Note

- L'app funziona completamente lato client (nessun server richiesto)
- I file FET non vengono inviati a nessun server
- La conversione avviene nel browser dell'utente
- Compatibile con tutti i browser moderni

## 🐛 Troubleshooting

**Errore "XML non valido"**
- Verifica che il file .fet sia un XML valido
- Controlla che il file activities.xml sia quello corretto

**Errore "Nessun laboratorio generato"**
- Verifica che nel FET le aule siano assegnate alle attività
- Controlla che la soluzione XML contenga i placement

## 📄 Licenza

Stesso repository delle app pwa_base e pwa_staff.
