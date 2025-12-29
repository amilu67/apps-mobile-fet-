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

// Firebase Manager per il converter
window.FirebaseUploader = {
  async uploadOrarioJson(orarioData) {
    try {
      // Carica l'intero orario.json su Firebase
      await db.ref('orario').set({
        ...orarioData,
        _uploaded: firebase.database.ServerValue.TIMESTAMP
      });
      console.log('✅ Orario caricato su Firebase');
      return { success: true };
    } catch (error) {
      console.error('❌ Errore caricamento orario:', error);
      throw error;
    }
  },

  async testConnection() {
    try {
      await db.ref('.info/connected').once('value');
      return true;
    } catch (error) {
      return false;
    }
  }
};
