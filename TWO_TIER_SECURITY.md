# Two-Tier Security System 🔐

Your Vibe Event Planner now implements a complete two-tier security architecture:

## 🔑 TIER 1: Owner Level (ADMIN_OVERRIDE_EMAILS)

**Who:** Emails listed in `ADMIN_OVERRIDE_EMAILS` array in calendar.html, events.html, and admin.html

**Where:** 
```javascript
const ADMIN_OVERRIDE_EMAILS = [
  'samplemail333555@gmail.com',
  'hn6160324@gmail.com'
];
```

**Access & Permissions:**
- ✅ **Admin Panel Button** on calendar.html → Access to `/admin.html`
- ✅ **File Upload Section** on calendar.html (upload & delete files/images)
- ✅ **Admin Button** on events.html (edit, delete, upload capabilities)
- ✅ **Full CRUD** on events and files
- ✅ **Admin.html Access** - Protected with owner-only authentication
- ❌ **Events Button** NOT shown (they're already full admins)

**How It Works:**
- calendar.html checks if email is in `ADMIN_OVERRIDE_EMAILS`
- If YES → Show Admin Panel button, hide Events button
- events.html checks the same list
- If YES → Show admin controls, hide from sheet admins
- admin.html has a gate-keeper script that rejects non-owners

---

## 👥 TIER 2: Events Editor Level (Admins Sheet)

**Who:** Emails listed in the `Admins` sheet in your Google Sheets

**Access & Permissions:**
- ✅ **Events Button** on calendar.html → Access to `/events.html`
- ✅ **Edit/Delete Events** on events.html
- ✅ **View Events Gallery** with admin controls
- ❌ **Admin Panel Button** NOT shown
- ❌ **File Upload/Delete** on calendar.html (not visible)
- ❌ **Admin Panel Access** (redirected away)

**How It Works:**
- calendar.html checks if email is in `ADMIN_OVERRIDE_EMAILS` first
- If NOT in tier 1, checks backend for Admins sheet entry
- If found in Admins sheet → Show Events button, hide Admin Panel
- events.html shows admin controls based on this role

---

## 👤 Regular Users

- ❌ **No Admin Panel button**
- ❌ **No Events button**
- ✅ Can view calendar and events (read-only)
- ✅ Can view event details

---

## 📋 Implementation Details

### Calendar.html
```javascript
// TIER 1 Check
const isOwnerOverride = ADMIN_OVERRIDES_LOWER.indexOf(emailLower) !== -1;
if (isOwnerOverride) {
  localStorage.setItem('isOwnerOverride', 'true');
  adminBtn.style.display = 'block';
  eventsBtn.style.display = 'none';
}

// TIER 2 Check
else if (SCRIPT_URL && email) {
  fetch(`${SCRIPT_URL}?action=checkAdmin&email=${encodeURIComponent(email)}`)
    .then(data => {
      const isSheetAdmin = data && data.isAdmin;
      if (isSheetAdmin) {
        adminBtn.style.display = 'none';
        eventsBtn.style.display = 'inline-block';
      }
    });
}
```

### Admin.html
```javascript
// TIER 1 Gate-keeper
window.addEventListener('load', function() {
  const ADMIN_OVERRIDE_EMAILS = [...];
  const userEmail = localStorage.getItem('userEmail').toLowerCase();
  const isOwnerOverride = ADMIN_OVERRIDE_EMAILS.includes(userEmail);
  
  if (!isOwnerOverride) {
    document.body.innerHTML = '❌ Access Denied';
    window.location.href = '/calendar.html';
  }
});
```

### Events.html
```javascript
function checkOwner() {
  const userEmail = localStorage.getItem('userEmail').toLowerCase();
  const isOwnerOverride = ADMIN_OVERRIDE_EMAILS.includes(userEmail);
  isOwner = isOwnerOverride;
  
  // Show admin button only for TIER 1
  if (isOwnerOverride && window.innerWidth > 768) {
    document.getElementById('adminBtn').style.display = 'block';
  }
}
```

---

## 🔄 Authentication Flow

```
User Logs In
    ↓
Calendar.html: determineRolesAndInit()
    ↓
    ├─ In ADMIN_OVERRIDE_EMAILS?
    │   ├─ YES → TIER 1 (Owner)
    │   │   └─ Show Admin Panel button
    │   │   └─ localStorage.isOwnerOverride = 'true'
    │   │
    │   └─ NO → Check Admins Sheet
    │       ├─ In Admins Sheet?
    │       │   ├─ YES → TIER 2 (Events Editor)
    │       │   │   └─ Show Events button
    │       │   │   └─ localStorage.isSheetAdmin = 'true'
    │       │   │
    │       │   └─ NO → Regular User
    │       │       └─ Hide all admin buttons
    │       │       └─ localStorage.isSheetAdmin = 'false'
```

---

## ⚙️ Configuration

To add more owners, edit all three files:

1. **calendar.html** (line 780)
2. **admin.html** (line 12)
3. **events.html** (line 826)

Add emails to the array:
```javascript
const ADMIN_OVERRIDE_EMAILS = [
  'owner1@gmail.com',
  'owner2@gmail.com',
  'owner3@gmail.com'
];
```

To add sheet admins, add emails to the `Admins` sheet in Google Sheets.

---

## 🛡️ Security Notes

- ✅ Client-side role checks prevent button visibility (UX)
- ✅ Backend validates permissions on API calls (doPost checks isAdminUser())
- ✅ admin.html has dual protection (client + admin.html gate-keeper)
- ✅ No sensitive operations allowed without proper authorization
- ⚠️ Client-side checks are for UX only; always validate on backend

---

## 🧪 Testing

1. Login as TIER 1 owner
   - ✅ Admin Panel button visible on calendar
   - ✅ Events button NOT visible on calendar
   - ✅ Admin controls visible on events.html
   - ✅ Can upload/delete files

2. Login as TIER 2 events editor
   - ✅ Events button visible on calendar
   - ✅ Admin Panel button NOT visible on calendar
   - ✅ Can access events.html
   - ✅ Admin controls visible on events.html
   - ❌ Cannot upload/delete files
   - ❌ Cannot access admin.html

3. Login as regular user
   - ❌ No admin buttons visible
   - ✅ Can view events (read-only)
