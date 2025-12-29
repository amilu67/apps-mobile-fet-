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

// Authentication Manager
window.AuthManager = {
  // Login
  async login(email, password) {
    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      console.log('✅ Login riuscito:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Login fallito:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Logout
  async logout() {
    try {
      await firebase.auth().signOut();
      console.log('✅ Logout riuscito');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout fallito:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Check if user is logged in
  isLoggedIn() {
    return firebase.auth().currentUser !== null;
  },

  // Get current user
  getCurrentUser() {
    return firebase.auth().currentUser;
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return firebase.auth().onAuthStateChanged(callback);
  }
};

// Database Manager per Staff (lettura e scrittura)
window.FirebaseManager = {
  // Salva sostituzioni su Firebase
  async saveSostituzione(sostituzione) {
    try {
      const ref = db.ref('sostituzioni').push();
      await ref.set({
        ...sostituzione,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      console.log('Sostituzione salvata su Firebase:', ref.key);
      return ref.key;
    } catch (error) {
      console.error('Errore salvataggio sostituzione:', error);
      throw error;
    }
  },

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

  // Elimina sostituzione
  async deleteSostituzione(id) {
    try {
      await db.ref(`sostituzioni/${id}`).remove();
      console.log('Sostituzione eliminata:', id);
    } catch (error) {
      console.error('Errore eliminazione sostituzione:', error);
      throw error;
    }
  },

  // Salva classi assenti per una data
  async saveClassiAssenti(date, classi) {
    try {
      if (classi.length === 0) {
        // Se l'array è vuoto, elimina il nodo
        await db.ref(`classi_assenti/${date}`).remove();
        console.log('Classi assenti rimosse per', date);
      } else {
        await db.ref(`classi_assenti/${date}`).set({
          classi: classi,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        console.log('Classi assenti salvate per', date);
      }
    } catch (error) {
      console.error('Errore salvataggio classi assenti:', error);
      throw error;
    }
  },

  // Elimina classi assenti per una data
  async deleteClassiAssenti(date) {
    try {
      await db.ref(`classi_assenti/${date}`).remove();
      console.log('Classi assenti eliminate per', date);
    } catch (error) {
      console.error('Errore eliminazione classi assenti:', error);
      throw error;
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
      console.log('🔔 Listener Firebase attivato');
      console.log('📊 Snapshot exists:', snapshot.exists());
      console.log('📊 Numero di child:', snapshot.numChildren());
      
      const sostituzioni = [];
      snapshot.forEach(childSnapshot => {
        console.log('  ➡️ Child key:', childSnapshot.key);
        sostituzioni.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      console.log('📋 Sostituzioni caricate dal listener:', sostituzioni.length);
      // Ordina per timestamp decrescente
      callback(sostituzioni.reverse());
    }, error => {
      console.error('Errore listener sostituzioni:', error);
    });
    // Restituisci funzione per disattivare il listener
    return () => ref.off('value');
  },

  // Listener in tempo reale per classi assenti
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
