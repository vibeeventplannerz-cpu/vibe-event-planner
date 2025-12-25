# Complete Debugging & Testing Guide

## What Was Changed

### Backend (code.js)
1. **Enhanced Logging in addEvent()**
   - Added session user email check for google.script.run calls
   - Logs all data being written to sheet
   - Logs row numbers and confirmation of writes

2. **Enhanced Logging in updateEvent()**
   - Added session user email check
   - Better authorization logging
   - Shows exactly what row is being updated and with what data

3. **Enhanced Logging in doPost()**
   - Logs when addEvent/updateEvent authorization checks happen
   - Shows if user is admin or not
   - Logs exact success/failure of authorization

### Frontend (admin.html)
1. **Improved saveEvent() function**
   - Separates google.script.run path from postToScript fallback
   - Better console logging for debugging
   - Shows which path is being used (Apps Script vs REST API)

### Frontend (events.html)
1. **Improved saveEvent() and updateEventWithData()**
   - Console logging shows eventId, originalEvent, picture URL
   - Shows which update method is being used
   - Logs success/failure responses

---

## How to Test & Debug

### Test Case 1: Admin Add Event

**Steps:**
1. Open Admin Panel
2. Click "Add Event"
3. Fill in all fields:
   - Event Name: "Test Event"
   - Events: "This is a test"
   - Date: Pick any date
   - Time: Pick any time
   - Location: "Test Location"
   - Description: "Test description"
   - Attendees: "Test Person"
4. Click "Save Event"

**What to Check:**

✅ **Step 1: Browser Console (F12)**
```javascript
Admin saveEvent: {eventId: "", eventData: {...}}
Using google.script.run path
// OR
Using postToScript fallback path
```

✅ **Step 2: Google Apps Script Logs**
- Go to Apps Script → Executions
- Look for logs containing:
  ```
  addEvent action: checking admin status...
  isAdminUser check: email=hn6160324@gmail.com, isAdmin=true
  ✅ addEvent authorized - calling addEvent
  === addEvent called ===
  Sheet lastRow: 5
  Writing row 6: ["Test Event","This is a test",...,...]
  ✅ Wrote to sheet, lastRow is now: 6
  ```

✅ **Step 3: Check Google Sheet**
- Open the spreadsheet
- Look at Sheet1
- Should see new row with all event details

**If Add Event Fails:**
- Check "isAdmin=false" in logs → User not in Admins sheet, add email
- Check "Unauthorized" in logs → Authorization check failed
- Check "Error" messages → Report the specific error

---

### Test Case 2: Events Page - Edit Event

**Steps:**
1. Go to Events Gallery page
2. Find an existing event
3. Click "Edit" button
4. Change the description or events content
5. (Optional) Upload a new picture
6. Click "Save Changes"

**What to Check:**

✅ **Step 1: Browser Console (F12)**
```javascript
Events saveEvent: {eventId: "123", event: {...}}
updateEventWithData: {eventId: "123", originalEvent: {...}, pictureUrl: ""}
Sending eventData: {eventName: "Test", events: "Updated",...}
Using postToScript for updateEvent
postToScript result: {success: true, message: "Event updated successfully!"}
```

✅ **Step 2: Google Apps Script Logs**
```
updateEvent action: checking admin status...
=== updateEvent called ===
eventId: 123, callerEmail: hn6160324@gmail.com
eventData: {"eventName":"Test","events":"Updated",...}
Auth: sessionEmail=, isSessionAdmin=false, callerEmail=hn6160324@gmail.com, isCallerAdmin=true
Found event at row: 3
Writing row 3: ["Test","Updated","2025-12-25",...,...]
✅ Event updated at row: 3
```

✅ **Step 3: Check Google Sheet**
- The row should be updated with new description
- All other fields should remain the same
- Picture URL might be updated if you uploaded a new picture

**If Update Event Fails:**
- "Event not found" → Event doesn't exist, try refreshing
- "isAdmin=false" → User not in Admins sheet
- Empty eventData → Form fields not being read, check form IDs
- "Sheet write failed" → Permission issue with sheet

---

## Critical Data Flow

### Add Event Flow
```
Admin Panel Form
    ↓
saveEvent() function
    ↓
Check if using google.script.run or postToScript
    ↓
Google.script.run.addEvent() → Direct function call
OR
postToScript(action='addEvent') → doPost() → isAdminUser check → addEvent()
    ↓
addEvent() function
    ↓
Check session user is admin
    ↓
Get last row from sheet
    ↓
Write new row with all 9 columns
    ↓
Return success
```

### Update Event Flow
```
Events Gallery → Edit button
    ↓
editEvent() function
    ↓
Store original event in window.currentEditingEvent
    ↓
Open edit modal with form fields
    ↓
User edits fields
    ↓
saveEvent() function
    ↓
Check if picture needs upload
    ↓
uploadImageToDrive() OR skip
    ↓
updateEventWithData() function
    ↓
Use stored original event to preserve non-editable fields
    ↓
Build eventData with preserved fields
    ↓
google.script.run.updateEvent() → Direct function call
OR
postToScript(action='updateEvent') → doPost() → isAdminUser check → updateEvent()
    ↓
updateEvent() function
    ↓
Check session user is admin
    ↓
Find event row by ID
    ↓
Preserve file IDs column
    ↓
Write all 9 columns back to row
    ↓
Return success
```

---

## Expected Behavior

### Adding Event
- ✅ Success message appears
- ✅ Modal closes
- ✅ New event appears in Events list
- ✅ Google Sheet shows new row
- ❌ If authorization fails: "Unauthorized" message

### Editing Event
- ✅ Success message appears
- ✅ Modal closes
- ✅ Events list refreshes
- ✅ Google Sheet row updated with new values
- ✅ Event ID, Name, Date, Time, Location, Attendees remain unchanged
- ✅ Only Events, Description, Picture URL can change
- ❌ If user not admin: "Only owner can save events" message
- ❌ If event not found: "Event not found" message

### Picture Upload
- ✅ Picture uploaded to Google Drive
- ✅ Gets Drive URL
- ✅ URL saved in Picture URL column
- ✅ Can see thumbnail in events gallery
- ❌ If upload fails: "Image upload failed" message

---

## Common Issues & Solutions

### Issue: Success message but data not in sheet

**Possible Causes:**
1. User not in Admins sheet
   - Solution: Add user email to Admins sheet

2. Authorization check passing but write failing
   - Check sheet permissions
   - Check if sheet is locked
   - Check if all 9 columns exist in sheet header

3. Sheet not being initialized correctly
   - Check Sheet1 exists in spreadsheet
   - Check header row has all 9 columns

### Issue: Picture uploaded but details not saved

**Possible Causes:**
1. Picture upload succeeds but updateEventWithData fails
   - Check Apps Script logs for updateEvent errors
   - Check authorization logs

2. eventData not being built correctly
   - Check if window.currentEditingEvent is set
   - Check if form fields have values

### Issue: Event details deleted (empty row)

**Possible Causes:**
1. eventData contains empty strings for non-editable fields
   - Solution: Ensure window.currentEditingEvent is preserved
   - Check that originalEvent is being used

2. Form validation failing silently
   - Check browser console for form errors

---

## What Information to Collect When Reporting Issues

1. **Browser Console Output**
   - F12 → Console tab → Copy all relevant logs

2. **Apps Script Execution Logs**
   - Apps Script editor → Executions tab → Click on execution → View logs

3. **Screenshots**
   - Form before submission
   - Success/error messages
   - Google Sheet after operation

4. **Email Used**
   - Which account you tested with

5. **Exact Steps to Reproduce**
   - Step-by-step instructions

This will help identify exactly where the process is failing.
