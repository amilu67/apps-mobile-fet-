// Firebase Configuration
// Replace these values with your own Firebase project credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.YOUR_REGION.firebasedatabase.app",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Realtime Database
const db = firebase.database();

// Database Manager per Studenti (solo lettura)
window.FirebaseManager = {
  // Carica tutte le sostituzioni
  async loadSostituzioni() {
    try {
      const snapshot = await db.ref('sostituzioni')
        .orderByChild('timestamp')
        .once('value');
      
      const sostituzioni = [];
      snapshot.forEach(childSnapshot => {
        sostituzioni.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      // Ordina per timestamp decrescente (più recenti prima)
      return sostituzioni.reverse();
    } catch (error) {
      console.error('Errore caricamento sostituzioni:', error);
      return [];
    }
  },

  // Carica classi assenti per una data
  async loadClassiAssenti(date) {
    try {
      const snapshot = await db.ref(`classi_assenti/${date}`).once('value');
      if (snapshot.exists()) {
        return snapshot.val().classi || [];
      }
      return [];
    } catch (error) {
      console.error('Errore caricamento classi assenti:', error);
      return [];
    }
  },

  // Listener in tempo reale per sostituzioni
  onSostituzioniChange(callback) {
    const ref = db.ref('sostituzioni').orderByChild('timestamp');
    ref.on('value', snapshot => {
      const sostituzioni = [];
      snapshot.forEach(childSnapshot => {
        sostituzioni.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      // Ordina per timestamp decrescente
      callback(sostituzioni.reverse());
    }, error => {
      console.error('Errore listener sostituzioni:', error);
    });
    // Restituisci funzione per disattivare il listener
    return () => ref.off('value');
  },

  // Listener in tempo reale per classi assenti (singola data)
  onClassiAssentiChange(date, callback) {
    const ref = db.ref(`classi_assenti/${date}`);
    ref.on('value', snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.val().classi || []);
      } else {
        callback([]);
      }
    }, error => {
      console.error('Errore listener classi assenti:', error);
    });
    // Restituisci funzione per disattivare il listener
    return () => ref.off('value');
  },

  // Listener in tempo reale per TUTTE le classi assenti
  onAllClassiAssentiChange(callback) {
    const ref = db.ref('classi_assenti');
    ref.on('value', snapshot => {
      const classiAssentiPerData = [];
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const date = childSnapshot.key;
          const data = childSnapshot.val();
          if (data && data.classi) {
            classiAssentiPerData.push({
              date: date,
              classi: data.classi,
              timestamp: data.timestamp
            });
          }
        });
      }
      callback(classiAssentiPerData);
    }, error => {
      console.error('Errore listener tutte classi assenti:', error);
    });
    return () => ref.off('value');
  },

  // Carica orario.json da Firebase (con fallback a file locale)
  async loadOrario() {
    try {
      console.log('📥 Caricamento orario da Firebase...');
      const snapshot = await db.ref('orario').once('value');
      
      if (snapshot.exists()) {
        const orarioData = snapshot.val();
        // Rimuovi metadati interni
        delete orarioData._uploaded;
        console.log('✅ Orario caricato da Firebase');
        return orarioData;
      } else {
        console.log('⚠️ Nessun orario su Firebase, carico file locale...');
        return await this.loadOrarioFromLocal();
      }
    } catch (error) {
      console.error('❌ Errore caricamento Firebase, fallback a file locale:', error);
      return await this.loadOrarioFromLocal();
    }
  },

  // Fallback: carica da file locale
  async loadOrarioFromLocal() {
    try {
      const response = await fetch('./orario.json');
      if (!response.ok) throw new Error('File non trovato');
      const data = await response.json();
      console.log('✅ Orario caricato da file locale');
      return data;
    } catch (error) {
      console.error('❌ Errore caricamento file locale:', error);
      throw new Error('Impossibile caricare orario.json (né da Firebase né da file locale)');
    }
  }
};
