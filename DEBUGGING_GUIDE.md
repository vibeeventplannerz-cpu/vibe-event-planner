# Debugging Guide for Add/Update Events Issues

## Summary of Issues

### Issue 1: Admin Panel - Add Event Shows Success But Not Saved to Sheet
- Success message appears
- Event NOT saved to Google Sheet
- Need to check if authorization is the issue

### Issue 2: Events Page - Update Event Deletes All Event Details
- Picture is saved to Drive (working)
- Event details deleted from Google Sheet (not working)
- Only showing success message but data lost

---

## Debugging Steps

### Step 1: Check Browser Console Logs
1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Try to:
   - **Add an event** in Admin panel → Look for logs starting with "Admin saveEvent"
   - **Edit an event** in Events page → Look for logs starting with "Events saveEvent"

### Step 2: Check Google Apps Script Logs
1. Open your Google Apps Script project
2. Go to **Executions** tab
3. Look for recent execution logs
4. Check for logs with:
   - `=== addEvent called ===` (should show eventData)
   - `=== updateEvent called ===` (should show eventData)
   - Authorization logs (email checks)

### Step 3: What to Look For

#### For Add Event Issue:
```
Expected logs:
1. "addEvent action: checking admin status..."
2. "isAdminUser check: email=..., isAdmin=..."
3. "=== addEvent called ===" (with eventData logged)
4. "Sheet lastRow: X"
5. "Writing row X: [eventName, events, date, ...]"
6. "✅ Wrote to sheet, lastRow is now: X"

If you see:
- "❌ addEvent denied - user not admin" → User not in Admins sheet
- "Unauthorized" → Authorization check failed
- "Error" messages → Check the error details
```

#### For Update Event Issue:
```
Expected logs:
1. "updateEvent action: checking admin status..."
2. "=== updateEvent called ===" (with eventData logged)
3. "Auth: sessionEmail=..., isSessionAdmin=..., callerEmail=..., isCallerAdmin=..."
4. "Found event at row: X"
5. "Writing row X: [eventName, events, date, ...]"
6. "✅ Event updated at row: X"

If you see:
- "❌ updateEvent denied - user not admin" → User not in Admins sheet
- "Event not found" → Event ID not matching
- Empty or missing data → eventData not being passed correctly
```

---

## Console Log Output Examples

### Admin Add Event Flow
```javascript
// Browser Console:
Admin saveEvent: {eventId: "", eventData: {...}}
Using postToScript fallback path
postToScript result: {success: true, message: "Event added successfully!"}

// Apps Script Logs:
addEvent action: checking admin status...
isAdminUser check: email=hn6160324@gmail.com, isAdmin=true
✅ addEvent authorized - calling addEvent
=== addEvent called ===
eventData: {"eventName":"Test","events":"Test Event","date":"2025-12-25",...}
Sheet lastRow: 5
Writing row 6: ["Test","Test Event","2025-12-25","10:00 AM",...]
✅ Wrote to sheet, lastRow is now: 6
```

### Events Update Event Flow
```javascript
// Browser Console:
Events saveEvent: {eventId: "123", event: {...}}
No image upload needed, saving directly
updateEventWithData: {eventId: "123", originalEvent: {...}, pictureUrl: ""}
Sending eventData: {eventName: "Test", events: "Updated", date: "2025-12-25",...}
Using postToScript for updateEvent
postToScript result: {success: true, message: "Event updated successfully!"}

// Apps Script Logs:
updateEvent action: checking admin status...
=== updateEvent called ===
eventId: 123, callerEmail: hn6160324@gmail.com
eventData: {"eventName":"Test","events":"Updated",...}
Auth: sessionEmail=, isSessionAdmin=false, callerEmail=hn6160324@gmail.com, isCallerAdmin=true
Found event at row: 3
Writing row 3: ["Test","Updated","2025-12-25","10:00 AM",...]
✅ Event updated at row: 3
```

---

## Common Issues and Solutions

### Issue: "isAdminUser check: isAdmin=false"
**Problem:** User email not in Admins sheet
**Solution:** 
1. Open Google Sheet
2. Check "Admins" sheet
3. Add the user's email (hn6160324@gmail.com or samplemail333555@gmail.com)
4. Save and try again

### Issue: "Event not found" in updateEvent
**Problem:** Event ID not matching in sheet
**Solution:**
1. Check if event exists in the sheet
2. Verify event row has correct ID
3. Try refreshing the page

### Issue: eventData shows empty or missing fields
**Problem:** Form fields not being read correctly
**Solution:**
1. Check if form fields have correct IDs
2. Verify input values are not empty
3. Check browser console for any form errors

### Issue: Success message but no data saved
**Problem:** Authorization passed but database write failed
**Solution:**
1. Check Apps Script logs for write errors
2. Check if sheet is locked or has permissions issues
3. Verify column structure matches expected 9 columns

---

## What to Report

When reporting issues, please provide:
1. **Browser console logs** (right-click → Inspect → Console tab, copy all relevant logs)
2. **Apps Script execution logs** (from Apps Script dashboard)
3. **Screenshots** of the form before submission
4. **Expected vs Actual** - What should happen vs what actually happened
5. **Email used** - Which email account you're testing with

---

## Reset Instructions

If you need to clear and reset:
1. Delete all rows (except header) in the Events sheet
2. Make sure Admins sheet has your email
3. Refresh browser
4. Try adding/updating again

This will help isolate if the issue is with existing data or a new problem.
