# Backend Configuration Checklist

## Critical Checks Before Testing

### 1. Google Apps Script Project Setup

**Check Sheet Structure:**
- [ ] Spreadsheet has "Sheet1" (Events table)
- [ ] Sheet1 has header row with all 9 columns:
  1. Event Name
  2. Events
  3. Date
  4. Time
  5. Location
  6. Description
  7. Attendee List
  8. Picture URL
  9. File IDs

- [ ] Spreadsheet has "Admins" sheet
- [ ] Admins sheet has header: "Admin Email" in cell A1
- [ ] Your email is in Admins sheet (A2 onwards)

**Your Admin Emails:**
- samplemail333555@gmail.com
- hn6160324@gmail.com

### 2. Google Apps Script Deployment

- [ ] Apps Script is deployed as web app
- [ ] Deployment URL is set in admin.html's SCRIPT_URL
- [ ] Execute as your account (owner account)
- [ ] Allow access to anyone

**Check in admin.html:**
```html
<script>
  const SCRIPT_URL = 'YOUR_DEPLOYMENT_URL_HERE';
</script>
```

Should look like:
```
https://script.google.com/macros/s/AKfycbyG7xK6...../exec
```

### 3. Google OAuth Configuration

- [ ] Gmail/Google account properly logged in
- [ ] Google Sign-In configured on index.html
- [ ] ID token being saved to localStorage

**Check in localStorage:**
```javascript
localStorage.getItem('userEmail')      // Should be your email
localStorage.getItem('googleToken')    // Should have a token
localStorage.getItem('isAuthenticated') // Should be "true"
localStorage.getItem('isAdmin')         // Should be "true" for admins
```

### 4. Spreadsheet Permissions

- [ ] Spreadsheet is accessible to your account
- [ ] Apps Script has permission to read/write to sheet
- [ ] Sheet is not read-only or locked

**Test:**
- Try to manually edit a cell in the sheet
- If can't edit → Fix permissions
- If can edit → Permissions are OK

### 5. Apps Script Logging

- [ ] Enabled in Apps Script dashboard
- [ ] Can view execution logs

**How to check:**
1. Open Apps Script editor
2. Click "Executions" on left sidebar
3. You should see recent executions with logs

---

## Verification Steps

### Step 1: Verify Admins Sheet

**Expected:**
```
Row 1: Admin Email
Row 2: samplemail333555@gmail.com
Row 3: hn6160324@gmail.com
```

**Command to check (Apps Script console):**
```javascript
function testGetAdminEmails() {
  const admins = getAdminEmails();
  Logger.log('Admins list: ' + JSON.stringify(admins));
}
```

Run this, check logs. Should show both emails.

### Step 2: Verify Sheet Structure

**Expected Sheet1:**
```
Col 1: Event Name
Col 2: Events
Col 3: Date
Col 4: Time
Col 5: Location
Col 6: Description
Col 7: Attendee List
Col 8: Picture URL
Col 9: File IDs
```

**Command to check (Apps Script console):**
```javascript
function testSheetStructure() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const header = sheet.getRange(1, 1, 1, 9).getValues();
  Logger.log('Sheet header: ' + JSON.stringify(header));
  Logger.log('Last row: ' + sheet.getLastRow());
}
```

### Step 3: Test Authorization Flow

**Command to test (Apps Script console):**
```javascript
function testAuthorization() {
  // Test 1: Get logged in user email
  try {
    const userEmail = Session.getActiveUser().getEmail();
    Logger.log('Current user: ' + userEmail);
  } catch (e) {
    Logger.log('No session user (expected for web app)');
  }
  
  // Test 2: Check if user is admin
  const admins = getAdminEmails();
  const testEmail = 'hn6160324@gmail.com';
  const isAdmin = admins.indexOf(testEmail.toLowerCase()) !== -1;
  Logger.log('Is ' + testEmail + ' admin? ' + isAdmin);
}
```

---

## Common Configuration Issues

### Issue: "Sheet1 not found"
**Solution:**
1. Open spreadsheet
2. Check if sheet is named exactly "Sheet1"
3. If not, rename it or update SHEET_NAME in code.js

### Issue: "Admins sheet not found"
**Solution:**
1. Create new sheet named "Admins"
2. In cell A1 type: "Admin Email"
3. In A2 type: your email address
4. In A3 type: secondary admin email (if needed)

### Issue: "Column count mismatch"
**Solution:**
1. Check Sheet1 header row
2. Should have exactly 9 columns
3. Add missing columns or remove extras

### Issue: "Access denied / Unauthorized"
**Solution:**
1. Check your email is in Admins sheet
2. Check email is lowercase
3. Check no extra spaces in email
4. Refresh browser and try again

---

## Testing After Configuration

### Test 1: Can you view events?
- [ ] Go to /events.html
- [ ] See list of events
- [ ] Events load successfully
- [ ] No "Failed to load events" error

### Test 2: Can you access admin panel?
- [ ] Login as admin email
- [ ] Go to /admin.html
- [ ] See event management table
- [ ] No "Access Denied" message

### Test 3: Can you add event?
- [ ] Click "Add Event"
- [ ] Fill form
- [ ] Click "Save Event"
- [ ] Check browser console → should see success message
- [ ] Check Apps Script logs → should show write operation
- [ ] Check Google Sheet → new row added

### Test 4: Can you edit event?
- [ ] Go to Events Gallery
- [ ] Click "Edit" on an event
- [ ] Change description
- [ ] Click "Save Changes"
- [ ] Check browser console → should see success message
- [ ] Check Google Sheet → row updated
- [ ] Check all fields preserved (date, time, location, etc)

### Test 5: Can you upload picture?
- [ ] Edit an event
- [ ] Upload new picture
- [ ] Click "Save Changes"
- [ ] Check browser console → should see upload success
- [ ] Check Google Drive → image file created
- [ ] Check Google Sheet → Picture URL column updated

---

## Debug Commands

### Command: Force refresh admin list
```javascript
function refreshAdminCache() {
  const cache = CacheService.getScriptCache();
  cache.remove('adminEmails');
  Logger.log('Cache cleared. Admin list will be refreshed next call.');
}
```

### Command: Log all events in sheet
```javascript
function logAllEvents() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const data = sheet.getDataRange().getValues();
  Logger.log('All events: ' + JSON.stringify(data));
}
```

### Command: Reset event sheet (CAUTION)
```javascript
function resetEventSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const lastRow = sheet.getLastRow();
  
  // Keep header, delete data
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
    Logger.log('Reset complete. Sheet now has only header.');
  }
}
```

---

## Files to Check

| File | Purpose | Key Config |
|------|---------|-----------|
| code.js | Backend logic | SHEET_NAME, ADMIN_SHEET_NAME |
| admin.html | Admin panel | SCRIPT_URL, ADMIN_OVERRIDE_EMAILS |
| events.html | Events gallery | ADMIN_OVERRIDE_EMAILS |
| calendar.html | Calendar view | ADMIN_OVERRIDE_EMAILS |
| Google Sheet | Data storage | Must have Sheet1 and Admins |

---

## Next Steps

1. **Check all items in "Critical Checks"** ✓
2. **Run verification steps** ✓
3. **Fix any configuration issues** ✓
4. **Run testing procedures** ✓
5. **Check logs if tests fail** ✓
6. **Report findings with logs** ✓

This checklist ensures everything is properly configured before debugging.
