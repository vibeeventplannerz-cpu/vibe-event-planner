# Quick Reference - Testing & Debugging

## Fast Debugging Path

### Problem: Event not saving to sheet
1. Open Developer Tools (F12)
2. Go to Console tab
3. Perform the action (add/edit event)
4. Copy all console logs
5. Go to Apps Script → Executions
6. Find the matching execution
7. Copy the execution logs
8. Compare results:
   - If you see ✅ in logs but sheet not updated → Sheet permission issue
   - If you see ❌ in logs → See error details below
   - If no logs appear → Code not running

### Problem: "Access denied" or "Unauthorized"
- **Check:** Is your email in the Admins sheet?
  - Open spreadsheet → Admins sheet
  - Should see your email (hn6160324@gmail.com or samplemail333555@gmail.com)
- **If not there:** Add it in cell A2 or next empty cell
- **If there:** Check for extra spaces or wrong case
- **Then:** Refresh page and try again

### Problem: Event uploaded to Drive but not saved to sheet
- Picture upload working (✅)
- Event update not working (❌)
- **Check:** Browser console → postToScript result
- **If error:** Check what error message says
- **Then:** Check Apps Script logs for updateEvent failure reason

---

## Console Output Guide

### Success Pattern
```
Admin saveEvent: {eventId: "", eventData: {...}}
Using postToScript fallback path
postToScript result: {success: true, message: "Event added successfully!"}
```

### Failure Pattern
```
Admin saveEvent: {eventId: "", eventData: {...}}
postToScript result: {success: false, error: "Unauthorized"}
```

### Apps Script Success Pattern
```
addEvent action: checking admin status...
isAdminUser check: email=hn6160324@gmail.com, isAdmin=true
✅ addEvent authorized - calling addEvent
=== addEvent called ===
eventData: {...}
Writing row 6: [...]
✅ Wrote to sheet, lastRow is now: 6
```

### Apps Script Failure Pattern
```
addEvent action: checking admin status...
isAdminUser check: email=test@gmail.com, isAdmin=false
❌ addEvent denied - user not admin
```

---

## Key Emails

**Admin Users (can add/edit/delete events):**
- hn6160324@gmail.com
- samplemail333555@gmail.com

**Check if email is admin:**
1. Open spreadsheet
2. Go to "Admins" sheet
3. Look in column A (starting from row 2)
4. Should see your email

---

## Sheet Structure Check

**Sheet1 (Events)** should have columns:
1. Event Name
2. Events
3. Date (YYYY-MM-DD format)
4. Time (HH:MM AM/PM)
5. Location
6. Description
7. Attendee List
8. Picture URL
9. File IDs

**Admins sheet** should have:
- Column A header: "Admin Email"
- Row 2 onwards: Email addresses

---

## Browser Console Locations

| Browser | How to Open |
|---------|------------|
| Chrome | F12 or Ctrl+Shift+J |
| Firefox | F12 or Ctrl+Shift+K |
| Safari | Cmd+Option+I |
| Edge | F12 |

**To filter logs:**
1. Type in Filter box at top of console
2. "Admin" → Shows only admin logs
3. "Events" → Shows only events logs
4. "error" → Shows only errors

---

## Apps Script Log Viewer

1. Open Apps Script editor
2. Click "Executions" (left sidebar)
3. Find your execution time
4. Click the execution ID
5. See full execution log
6. Copy relevant lines for debugging

---

## Fastest Debugging Steps

1. **Is user admin?**
   - Admins sheet → Check email is there
   
2. **Does form have data?**
   - Fill form completely
   - Check all required fields have values
   
3. **Does request reach backend?**
   - F12 → Console → Check first log appears
   - Apps Script → Executions → Check execution listed
   
4. **Does authorization pass?**
   - Apps Script logs → Look for "isAdmin=true" or "isAdmin=false"
   - If false → Add email to Admins sheet
   
5. **Does sheet write happen?**
   - Apps Script logs → Look for "Writing row X"
   - If not present → Authorization failed
   
6. **Did sheet actually update?**
   - Open spreadsheet
   - Refresh page
   - Look for new row or updated values

---

## One-Line Solutions

| Problem | Solution |
|---------|----------|
| "Unauthorized" error | Add email to Admins sheet, refresh |
| Success but no data | Check Sheet1 permissions, check column count |
| No console logs | Check correct browser tab, check SCRIPT_URL set |
| Picture saved, data not | updateEvent authorization failed, check Admins sheet |
| Deleted data instead of updating | Refresh page after adding email to Admins |

---

## Report Template

When reporting an issue, include:

**What happened:**
- [Describe the issue]

**Expected:**
- [What should have happened]

**Browser Console Output:**
```
[Paste console logs here]
```

**Apps Script Logs:**
```
[Paste execution logs here]
```

**Gmail Used:**
- [Your email address]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. etc

This helps identify the exact point of failure quickly.
