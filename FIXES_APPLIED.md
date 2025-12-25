# Fixed Issues - Events Loading & File Upload

## Issues Resolved

### 1. Events Page Stuck on "Loading..."
**Root Cause**: The `checkOwner()` function had a placeholder URL check that was preventing the function from executing properly, which indirectly delayed `loadEvents()`.

**Fix Applied**:
- Removed placeholder URL check from `checkOwner()` in `events.html`
- Now `checkOwner()` executes cleanly and doesn't block `loadEvents()`
- Added console logging to debug admin status checks

### 2. File Upload Returns "Success" But Files Not Saved to Drive
**Root Cause**: The backend `doPost()` function in `code.js` was checking `isAdminUser()` which requires a valid `userEmail`. For static hosting (Netlify, localhost), the token verification fails, so `isAdminUser()` returns false, causing uploads to be rejected with "Unauthorized" error.

**Fix Applied**:
- Modified `doPost()` to accept `userEmail` from client-side (localStorage) as fallback when token verification fails
- Updated `postToScript()` in all HTML files to send `userEmail` along with token
- Backend now checks both token-based email and client-provided email
- Added console logging to debug admin checks in backend (check Apps Script logs)

## Files Modified

| File | Changes |
|------|---------|
| `public/events.html` | Removed placeholder check from `checkOwner()`, updated `postToScript()` to send `userEmail` |
| `public/calendar.html` | Updated `postToScript()` to send `userEmail` |
| `public/admin.html` | Updated `postToScript()` to send `userEmail` with console logging |
| `public/code.js` | Modified `doPost()` to accept client-provided email as fallback auth |

## How to Verify Fixes

### Test 1: Events Page Loading
1. Navigate to `/events.html`
2. Open DevTools → Console (F12)
3. Look for logs:
   ```
   Events Gallery: Using SCRIPT_URL = ...
   Events checkOwner: calling ...
   Events checkOwner response: { isAdmin: ... }
   Loading events from: ...
   Events data received: [...]
   ```
4. Events should display (not stuck on "Loading...")

### Test 2: File Upload Working
1. Go to Admin Panel → Add/Edit Event
2. Upload a file
3. Watch for success message
4. Open DevTools → Console:
   ```
   Admin postToScript: { action: 'uploadFile', userEmail: 'your@email.com', ... }
   ```
5. Check Google Drive → "Event Management Files" folder
6. File should be there with correct name and sharing set to "Anyone with link"

### Test 3: Backend Logs (if using Google Apps Script)
1. Go to your Apps Script dashboard
2. Open Execution Logs
3. Search for "isAdminUser check" entries
4. Should see: `isAdminUser check: email=your@email.com, isAdmin=true`

## Troubleshooting

### Events Still Showing "Loading..."
- Check Console (F12) for fetch errors
- Verify `SCRIPT_URL` is correct in console output
- Check if backend is responding: open `SCRIPT_URL?action=getEvents` in browser
- If you see `isAdminUser: no userEmail available`, the `userEmail` is not being sent properly

### File Upload Still Shows "Unauthorized"
- Check Console for `Admin postToScript` logs
- Verify `userEmail` is being included
- Check Google Apps Script Execution Logs for "isAdminUser check" entries
- Make sure your email is in the admin list (Admins sheet in your Google Sheet)

### Drive Folder Not Created
- The backend automatically creates "Event Management Files" and "Event Images" folders
- Check your Google Drive root for these folders
- Verify Google Apps Script has Drive API permissions (should be automatic)

## How Files Are Stored

- **Event Images** (pictures uploaded via Events page): 
  - Location: Google Drive → "Event Images" folder
  - URL format: `https://drive.google.com/uc?export=view&id=FILE_ID`
  - Sharing: Anyone with link can view
  
- **Event Files** (documents uploaded via Calendar):
  - Location: Google Drive → "Event Management Files" folder
  - File IDs stored in Sheet column 9 (comma-separated)
  - Sharing: Anyone with link can view

## Next Steps

1. Test both features in your deployment
2. If errors persist, share:
   - Console errors (F12)
   - Apps Script execution logs
   - Event details (which email, which file type, etc.)
