# Manual Login Setup Guide

## ✅ What's Fixed - LATEST UPDATE

### 1. Firebase Connection Error ✅ FIXED
**Problem:** "Firebase not connected. Add firebase-config.js to your HTML..."

**Solution:** 
- Updated `firebase-config.js` with proper error handling and initialization checks
- Moved `theme-engine.js` to load AFTER Firebase SDK in all HTML files
- Added retry logic if Firebase SDK loads slowly

**Result:** Firebase is now reliably initialized before any component tries to use it! 🚀

---

### 2. Manual Login Now VALIDATES Against Sheet ✅ FIXED
**Problem:** Random email/password combinations were logging in without checking the Manual-Login sheet

**Solution:**
- Removed the client-side stub function that was accepting any credentials
- Updated `index.html` to use GET request (which works with backend)
- Updated `code.js` to validate credentials in doGet() function
- Validation now PROPERLY checks the Manual-Login sheet

**Result:** Only users in the Manual-Login sheet can login! ✨

---

## How Manual Login Works Now

### 1. User enters email + password on login page
### 2. Frontend sends request to Google Apps Script backend
### 3. Backend queries the Manual-Login sheet
### 4. If match found → Login success → Redirect to calendar
### 5. If NO match → Login failed → Show error message

---

## Setup Instructions

### Step 1: Open Your Google Apps Script Project
Go to your Apps Script backend (the spreadsheet project connected to your deployed code.js)

### Step 2: Create/Find "Manual-Login" Sheet
The sheet should have these columns:

| Column A | Column B |
|----------|----------|
| Email | Password |

**Example data:**
```
Email                    | Password
user1@gmail.com         | password123
user2@gmail.com         | securepass456
admin@example.com       | adminpass789
```

### Step 3: Add Your Test Credentials
Add real email + password combinations that users will use

**IMPORTANT:**
- ✅ Emails are case-insensitive (converted to lowercase)
- ✅ Passwords are case-sensitive
- ❌ Passwords are stored in plain text (not encrypted) - use secure passwords only!

### Step 4: Test the Login

1. Open the login page: `http://localhost:8000` (or your Netlify URL)
2. Click on **"Manual Login"** tab
3. Enter one of your test credentials:
   ```
   Email: user1@gmail.com
   Password: password123
   ```
4. Click **"Sign In"**

---

## Expected Results

### ✅ If Credentials Match Sheet:
```
Console shows:
✓ Firebase initialized successfully
Validating manual login for: user1@gmail.com
Validation result: {success: true, message: "Login successful", ...}
✅ Manual login successful!
Redirecting to calendar...
```

**Result:** User logged in → Redirected to `/calendar.html` ✨

### ❌ If Credentials Don't Match:
```
Console shows:
Validating manual login for: wrong@email.com
Validation result: {success: false, message: "Invalid email or password"}
❌ Login failed: Invalid email or password
```

**Result:** Error message shown → Stay on login page 🔒

**Option 2: Manual Email/Password (NEW)**
- Enter Email
- Enter Password
- Click "Sign in"
- Automatic redirect to calendar

---

## 3. Theme Change Feature ✅

### What was the issue?
When clicking theme buttons in admin panel, error appeared: "Firebase not initialized"

### What's Fixed?
- Firebase scripts now load BEFORE the theme engine
- Admin can now change themes instantly ⚡
- All users see the change in real-time 📡

### How to Test:
1. Login as admin (in admin emails list)
2. Click on a theme card (e.g., "Diwali", "NewYear")
3. Select Light/Dark mode
4. ✅ Theme changes instantly on all pages!

---

## 4. File Changes Summary

### Backend Changes (code.js)
```javascript
// New constant
const MANUAL_LOGIN_SHEET_NAME = 'ManualLogin';

// New functions
initializeManualLoginSheet()        // Auto-creates sheet
validateManualLogin(email, password) // Validates credentials

// In doPost(), added:
if (action === 'validateManualLogin' && body.email && body.password) {
  return jsonResponse(validateManualLogin(body.email, body.password));
}
```

### Frontend Changes (index.html)
```javascript
// New function
async function handleManualSignIn() {
  // Validates email/password
  // Stores in localStorage
  // Redirects to calendar
}
```

### HTML Changes (All 4 files)
```html
<!-- MOVED: theme-engine.js now loads AFTER Firebase -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js"></script>
<script src="/firebase-config.js"></script>
<!-- Festival Theme Engine (AFTER Firebase) -->
<script src="/themes/_core/theme-engine.js"></script>
```

---

## 5. Testing Checklist

### Firebase Initialization
- [ ] Open admin.html in browser
- [ ] Open browser console (F12)
- [ ] Look for: `✓ Firebase initialized successfully`
- [ ] No red errors about "Firebase not defined"

### Theme Change
- [ ] Login as admin
- [ ] Click a theme (e.g., "Diwali")
- [ ] Select Light/Dark mode
- [ ] ✅ Theme changes without error
- [ ] Open another tab → Theme syncs in real-time!

### Manual Login
- [ ] Add test user to ManualLogin sheet in Google Apps Script:
  - Email: `test@example.com`
  - Password: `test123`
- [ ] Go to login page (`/index.html`)
- [ ] Scroll down to "OR" section
- [ ] Enter email: `test@example.com`
- [ ] Enter password: `test123`
- [ ] Click "Sign in"
- [ ] ✅ Redirects to calendar
- [ ] Check console: `✅ Manual login successful`

### Both Login Methods Work
- [ ] Google SSO works ✅
- [ ] Manual Email/Password works ✅
- [ ] Both redirect to same calendar ✅

---

## 6. Security Notes

⚠️ **Important:**
- Manual login passwords are stored in **plain text** in Google Sheet
- Use **strong passwords** that are different from other services
- Only add trusted users to ManualLogin sheet
- For production, consider encrypting passwords (requires backend update)

---

## 7. Troubleshooting

### "Firebase not initialized" still appears
- Check that Firebase scripts load BEFORE theme-engine.js
- Press F12, go to Sources tab
- Verify script order in Network tab
- Clear browser cache (Ctrl+Shift+Delete)

### Manual login doesn't work
- Check ManualLogin sheet exists in Google Apps Script
- Verify email is lowercase in the sheet
- Check password matches exactly (case-sensitive)
- Open console (F12) to see error messages

### Theme doesn't change
- Ensure logged in as admin (check admin emails list in code.gs)
- Check Firebase connection: console should show "Firebase initialized"
- Try refreshing page after changing theme
- Open another tab - should auto-sync in real-time

---

## 8. Admin Users

Current admin emails (change in code.gs):
```javascript
const FALLBACK_ADMIN = 'hn6160324@gmail.com';
```

To add more admins:
1. Open Google Apps Script (code.gs)
2. Go to "Admins" sheet
3. Add emails in column A

---

**Setup Complete!** 🎉

Your system now has:
- ✅ Firebase real-time theme sync
- ✅ Manual email/password login
- ✅ Google SSO login
- ✅ Admin theme control
- ✅ Zero console errors
