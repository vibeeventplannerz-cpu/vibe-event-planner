# Events Page & Admin Access Fixes

## Issues Resolved

### 1. ❌ Events Getting Deleted on Save
**Problem:** When editing an event on the events page and saving changes, the entire event was being deleted instead of updated.

**Root Cause:** The edit modal form only captured 3 fields (`events`, `description`, `pictureUrl`) but the database has 8+ fields. When saving, other critical fields like `eventName`, `date`, `time`, `location`, and `attendeeList` were not included, causing incomplete/corrupt data.

**Fix:** 
- Modified `editEvent()` to store the full original event object in `window.currentEditingEvent`
- Updated `updateEventWithData()` to use the stored original event object when building the update payload
- Now only `events`, `description`, and `pictureUrl` are editable, while all other fields are preserved from the original event

**Files Modified:** `public/events.html` (lines 1154, 1360)

---

### 2. ❌ No Delete Button for Events
**Problem:** Events page had no way to delete individual events. Users could only delete via image picture deletion button in the edit modal.

**Fix:**
- Added delete buttons to both mobile and desktop event card actions
- Added CSS styling for the new delete button (`.btn-delete`)
- Implemented `confirmDeleteEvent()` function with confirmation dialog
- Implemented `deleteEvent()` function that calls the backend to delete the event
- Delete buttons only show for users with edit permissions

**Files Modified:** `public/events.html` (lines 303, 1101, 1435)

---

### 3. ❌ Admin Panel Access Denied: "Only owner can add events"
**Problem:** When the owner logs in to the admin page and tries to add a new event, they get error: `"Error: Access denied: Only owner can add events"`

**Root Cause:** The `addEvent()` function in code.js was checking `isOwner()` using `Session.getActiveUser()`, which only works in Apps Script environment. When called via REST API (static hosting), there's no session context. However, `doPost()` already validates the user is an admin before calling `addEvent()`, so the internal check was redundant and failing.

**Fix:**
- Removed the `isOwner()` check from inside `addEvent()` function
- Kept the authorization check in `doPost()` which validates the user via ID token or client email
- Now `addEvent()` only handles the actual event insertion, authorization is handled before it's called

**Files Modified:** `public/code.js` (lines 399-436)

---

## How to Test

### Test 1: Saving Event Changes
1. Go to Events Gallery page
2. Click "Edit" on any event
3. Change the event description or events details
4. Upload a new picture (optional)
5. Click "Save Changes"
✅ Event should be updated with new values while keeping original date, time, location, attendees

### Test 2: Deleting Event
1. Go to Events Gallery page
2. Click "Delete" button on an event card
3. Confirm the delete action
4. Event should disappear from the gallery
✅ Event deleted successfully

### Test 3: Admin Adding Event
1. Owner logs into the app
2. Go to Admin Panel
3. Click "Add Event"
4. Fill in event details
5. Click "Save Event"
✅ Event should be created without "Access denied" error

---

## Additional Notes

- Delete functionality respects the same permissions as edit (users with `canEditEvents` flag)
- Only owners and sheet admins can delete events
- All changes to events preserve the original event ID and metadata
- Mobile and desktop views both show delete buttons with appropriate styling
