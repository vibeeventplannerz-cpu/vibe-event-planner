/**
 * Firebase Configuration
 * 
 * ⚠️ IMPORTANT: Replace these values with your Firebase project config!
 * 
 * Get your config from:
 * 1. Go to https://console.firebase.google.com
 * 2. Select your project
 * 3. Click gear icon → Project Settings
 * 4. Scroll to "Your apps"
 * 5. Find the Web app section
 * 6. Copy the firebaseConfig object
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
window.firebaseDB = firebase.database();

console.log('✓ Firebase initialized successfully');
console.log('📡 Connected to project:', firebaseConfig.projectId);
