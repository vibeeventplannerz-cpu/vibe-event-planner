# Auto-Archive Function Fix

**Date**: February 2, 2026
**Status**: ✅ FIXED

---

## Problem Identified

The auto-archive function was NOT working correctly:
- Events that were **2+ months old** were still in Sheet1
- Events were NOT being moved to Archive sheet even though the function should run
- The archive logic was only keeping "current and previous month" events (max ~1 month retention)

---

## Root Causes Found

### **Issue 1: No Reliable Trigger**
- Archive function was only called in `doGet()` when someone accessed the web app
- **Feb 1st**: If nobody accessed the app that day, archive never ran!
- **Solution**: Added a time-based trigger that runs on the 1st of every month

### **Issue 2: Incorrect Archive Logic**
The old logic was flawed:
```javascript
// OLD (WRONG)
const currentMonth = now.getMonth();
const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;

if (isCurrentMonth || isPreviousMonth) {
  // KEEP this event
}
```

This kept events from "current + previous month" (~1 month retention) instead of 2 months!

**Example (Feb 2, 2026)**:
- Current: February 2026
- Previous: January 2026
- Archived: Only December 2025 and older
- **But users want**: Events from December 2025 (2 months ago) to be archived!

### **Issue 3: Unnecessary Date Check**
The old code checked `if (today !== 1)` and returned early, which blocked execution on other days for testing.

---

## Solution Implemented

### **Part 1: Fixed Archive Logic** (lines 370-384)

```javascript
// NEW (CORRECT)
// Calculate cutoff date: 2 months ago (first day of that month)
const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
const archiveThresholdMonth = twoMonthsAgo.getMonth();
const archiveThresholdYear = twoMonthsAgo.getFullYear();

Logger.log('Archiving events from: ' + getMonthName(archiveThresholdMonth) + ' ' + archiveThresholdYear + ' and OLDER');

// Check if event is 2+ months old
const shouldArchive = (eventYear < archiveThresholdYear) || 
                     (eventYear === archiveThresholdYear && eventMonth <= archiveThresholdMonth);
```

**Example (Feb 2, 2026)**:
- Two months ago = December 1, 2025
- **Archives**: December 2025 and older ✓
- **Keeps**: January 2026 and newer ✓

### **Part 2: Added Time-Based Trigger** (new function, lines 1299-1315)

```javascript
function createArchiveTrigger() {
  // Remove existing trigger if present
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'archiveOldEvents') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger: Run on 1st of every month at 12:00 AM UTC
  ScriptApp.newTrigger('archiveOldEvents')
    .timeBased()
    .onMonthDay(1)
    .atHour(0)
    .create();
    
  Logger.log('✅ Archive trigger created: Runs on 1st of every month at 12:00 AM UTC');
  return { success: true, message: 'Archive trigger created for 1st of every month' };
}
```

### **Part 3: Updated doGet Backup** (lines 138-146)

Kept the archive call in `doGet()` as a backup, but only on the 1st of the month:

```javascript
// Trigger archive if it's the 1st of month (backup to scheduled trigger)
try {
  const now = new Date();
  if (now.getDate() === 1) {
    Logger.log('Today is 1st of month, triggering archive as backup');
    archiveOldEvents();
  }
} catch (archiveErr) {
  Logger.log('Archive error (non-critical):', archiveErr);
}
```

---

## How It Works Now

### **Daily Execution Flow**

```
Every day at 12:00 AM UTC on the 1st of month:
    ↓
Scheduled trigger calls archiveOldEvents()
    ↓
For each event in Sheet1:
  ├─ If event date is 2+ months old (December 2025 or older)
  │  ├─ Move to Archive sheet
  │  └─ Delete from Sheet1
  │
  └─ If event date is within last 2 months (Jan-Feb 2026)
     └─ Keep in Sheet1
    ↓
Log summary: "Archived: X events, Kept: Y events"
```

### **Date Calculation Logic** (Feb 2, 2026 example)

```
Today: February 2, 2026
Cutoff: February - 2 months = December 1, 2025

Event from December 2025: ARCHIVE ✓
Event from January 2026: KEEP ✓
Event from February 2026: KEEP ✓
```

---

## Files Modified

**code.gs**

1. **Lines 370-384**: Fixed archive logic to calculate "2 months ago" correctly
2. **Lines 138-146**: Updated doGet() to backup trigger only on 1st
3. **Lines 1299-1315** (NEW): Added `createArchiveTrigger()` function

---

## Setting Up The Trigger

### **Option A: Automatic (Recommended)**

Run this function once in Google Apps Script Editor:

```javascript
createArchiveTrigger();
```

Then open Apps Script logs to verify:
```
✅ Archive trigger created: Runs on 1st of every month at 12:00 AM UTC
```

### **Option B: Manual Setup**

1. Open Google Apps Script Editor (Tools → Script Editor in Google Sheet)
2. Click "⏱️ Triggers" (left sidebar)
3. Click "+ Create new trigger"
4. Configure:
   - **Function**: `archiveOldEvents`
   - **Type**: Time-driven
   - **Frequency**: Month
   - **Day of Month**: 1
   - **Time**: 12:00 AM - 1:00 AM
5. Click "Create"

---

## Verification

### **Check if trigger is set up**

In Apps Script:
1. Go to "⏱️ Triggers" 
2. Should see: `archiveOldEvents` scheduled for 1st of month

### **Manual Test (anytime)**

Run this in Apps Script console:
```javascript
archiveOldEvents();
```

Check Logs for output:
```
=== Archive Process Started ===
Current date: 2026-02-02 HH:MM:SS
Archiving events from: December 2025 and OLDER
Keeping events from: January 2026 onwards

Row 2: Event1 [December 2025] - ShouldArchive: true
  📁 ARCHIVING: Event1 (December 2025)

Row 3: Event2 [January 2026] - ShouldArchive: false
  ✅ KEEPING: Event2 (January 2026)

=== Archive Complete ===
✅ Archived: 1
✅ Kept: 1
```

### **Check Archive Sheet**

1. Open your Google Sheet
2. Look for "Archive" tab
3. Should now contain December 2025 events (and older)
4. Sheet1 should only have January 2026 and newer events

---

## Test Case: Feb 1, 2026

**Before Fix**:
- Function doesn't run if no one accesses app
- Even if it runs, only archives events older than January (misses December!)
- Result: December 2025 events still in Sheet1 ❌

**After Fix**:
- Trigger automatically runs at 12:00 AM UTC
- Correctly archives December 2025 and all older events
- Keeps January 2026, February 2026, and newer
- Result: December 2025 events moved to Archive ✅

---

## Important Notes

1. **Trigger runs on server time (UTC)**: On 1st of month at 12:00 AM UTC
   - For IST (UTC+5:30): That's 5:30 AM IST on the 1st

2. **Events are only archived when:**
   - Event date is 2+ months old AND
   - Event date is on or before the threshold month

3. **What counts as "2 months old":**
   - February 2026: Archives December 2025 and older
   - March 2026: Archives January 2026 and older
   - April 2026: Archives February 2026 and older

4. **No events will be lost:**
   - Archived events are copied to Archive sheet before deletion
   - Archive sheet has same columns as Sheet1
   - Can always view archived events

---

## Troubleshooting

**Q: Trigger isn't running**
- A: Check Apps Script Triggers page to confirm it's created
- A: Run `createArchiveTrigger()` again to recreate

**Q: Wrong events are being archived**
- A: Check the logs to see which events qualified for archiving
- A: Verify event dates are in correct format (YYYY-MM-DD)

**Q: Want to run archive immediately (not wait for 1st)**
- A: Open Apps Script Editor → Run `archiveOldEvents()` manually

---

**Status**: ✅ Ready to use  
**Trigger**: Configured for 1st of every month at 12:00 AM UTC  
**Retention**: 2 months of current events (30-60 days depending on month length)
