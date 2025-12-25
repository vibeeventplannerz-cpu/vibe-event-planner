// ==================== FILE 3: sw-register.js ====================
// Location: public/sw-register.js

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered successfully:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// PWA Install Prompt Handler
let deferredPrompt;
let installBtnListenerAdded = false;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA Install prompt available');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show custom install button
  const installBtn = document.getElementById('installBtn');
  if (installBtn && !installBtnListenerAdded) {
    installBtn.style.display = 'block';
    installBtnListenerAdded = true;
    
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
        installBtn.style.display = 'none';
      }
    });
  }
});

// Check if app is installed
window.addEventListener('appinstalled', () => {
  console.log('PWA installed successfully');
  deferredPrompt = null;
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
});

// Check if running as PWA
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

if (isPWA()) {
  console.log('Running as PWA');
  document.body.classList.add('pwa-mode');
}