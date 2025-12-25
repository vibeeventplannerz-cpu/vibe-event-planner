# Backend Configuration Guide

## Issue: "Loading..." or "No events" showing on pages

All HTML pages (calendar, events, admin) were checking if `SCRIPT_URL !== placeholder`, which blocked all API calls. This is now **FIXED**.

## How to Set Your Backend URL

### Option 1: Google Apps Script (Recommended)
1. Deploy your Apps Script as a web app
2. Copy the deployment URL (looks like: `https://script.google.com/macros/s/ABC123.../exec`)
3. **Update all files** OR set it globally:

```html
<!-- Add this to index.html <head> before other scripts -->
<script>
  window.BACKEND_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
</script>
```

### Option 2: REST API Backend
If using a custom backend (Python Flask, Node.js, etc.):
1. Ensure your backend has these endpoints:
   - `GET /?action=getEvents&email=USER_EMAIL` → returns events JSON array
   - `POST /` → handles add/edit/delete/upload actions
2. Set `window.BACKEND_URL` in index.html

### Option 3: Netlify or Static Hosting
If using Netlify:
1. Create a `netlify.toml` with redirect rules for your API
2. Set `window.BACKEND_URL = '/api'` to point to your backend

## Current Files Status

✅ **Fixed in all HTML files:**
- `public/index.html` 
- `public/calendar.html`
- `public/events.html` 
- `public/admin.html`

All placeholder URL checks have been removed. Now pages will:
1. Try Google Apps Script API first (`google.script.run`)
2. Fall back to REST API at `SCRIPT_URL` (no placeholder check)
3. Show proper error messages in DevTools Console

## Test Your Configuration

Open your browser's **DevTools Console** (F12) and look for:

```
Calendar: Using SCRIPT_URL = https://script.google.com/macros/s/.../exec
Loading events from: https://script.google.com/macros/s/.../exec
Events data received: [...]
```

If you see these logs, your backend is connected!

## Troubleshooting

### 1. "No events" but no error logs
- Check if `SCRIPT_URL` is correct
- Verify backend is running/deployed
- Check CORS headers in your backend

### 2. CORS errors in console
- Your backend needs to allow requests from your frontend domain
- In Google Apps Script, add:
```javascript
function doPost(e) {
  return ContentService.createTextOutput(JSON.stringify({...}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 3. 404 errors
- Verify the web app URL is correct and publicly accessible
- Test it in browser: `https://yoururl/exec?action=getEvents&email=test@example.com`

## Quick Start (Local Testing)

For testing locally without a real backend:

```bash
cd public
python -m http.server 8000
# Visit http://localhost:8000
```

The app will show "No events" in demo mode, which is expected. Data loading requires a functioning backend.
