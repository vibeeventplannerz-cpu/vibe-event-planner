/**
 * Firebase Configuration (ACTUAL CONFIG)
 * 
 * This is your actual Firebase project configuration
 * DO NOT commit this file to public repositories with real credentials
 */

const firebaseConfig = {
    apiKey: "AIzaSyDuo26ov7werWnk9bV27QVHJteFjmrCgLo",
    authDomain: "vibeeventplannez-cpu.firebaseapp.com",
    databaseURL: "https://vibeeventplannez-cpu-default-rtdb.firebaseio.com",
    projectId: "vibeeventplannez-cpu",
    storageBucket: "vibeeventplannez-cpu.firebasestorage.app",
    messagingSenderId: "272910114304",
    appId: "1:272910114304:web:e65e65414c65edb023c2e5",
    measurementId: "G-PT0NSZN5RF"
};

// Initialize Firebase (only once!)
if (!window.firebaseInitialized) {
  try {
    if (typeof firebase !== 'undefined' && firebase.apps) {
      if (firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
      }
      window.firebaseDB = firebase.database();
      window.firebaseAnalytics = firebase.analytics();
      window.firebaseInitialized = true;
      
      console.log('✓ Firebase initialized successfully');
      console.log('📡 Connected to project:', firebaseConfig.projectId);
      console.log('📊 Analytics enabled');
    } else {
      console.error('❌ Firebase SDK not available. Check script loading order.');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
  }
}
