// ==================== CONFIGURATION ====================
const SHEET_NAME = 'Sheet1';
const ADMIN_SHEET_NAME = 'Admins';
const FALLBACK_ADMIN = 'hn6160324@gmail.com';

// ==================== CORS CONFIGURATION ====================
function doGet(e) {
  const page = e.parameter.page || 'calendar';
  const action = e.parameter.action;
  const email = e.parameter.email;

  Logger.log('doGet called with params:', JSON.stringify(e.parameter));

  // Handle API requests from Netlify
  if (action === 'checkAdmin' && email) {
    return handleAdminCheck(email);
  }

  if (action === 'getEvents') {
    return handleGetEventsAPI(email);
  }

  // Regular page routing...
  const adminEmails = getAdminEmails();
  const isAdmin = email ? adminEmails.includes(email.toLowerCase().trim()) : false;

  if (page === 'events') {
    return HtmlService.createHtmlOutputFromFile('EventsGallery')
      .setTitle('Events Gallery')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  if (page === 'admin') {
    if (isAdmin) {
      return HtmlService.createHtmlOutputFromFile('Admin')
        .setTitle('Admin Panel')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } else {
      return HtmlService.createHtmlOutput(
        '<div style="text-align: center; padding: 50px; font-family: Arial;">' +
        '<h1 style="color: #dc3545;">🚫 Access Denied</h1>' +
        '<p style="font-size: 1.2em;">Only authorized users can access admin panel.</p>' +
        '<p style="color: #666;">Logged in as: <strong>' + email + '</strong></p>' +
        '<p><a href="?page=calendar">Go to Calendar</a></p>' +
        '</div>'
      ).setTitle('Access Denied');
    }
  }

  return HtmlService.createHtmlOutputFromFile('Calendar')
    .setTitle('Event Calendar')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ==================== NEW API HANDLER ====================
function handleGetEventsAPI(email) {
  try {
    Logger.log('handleGetEventsAPI called with email:', email);
    
    const adminEmails = getAdminEmails();
    const isAdmin = email ? adminEmails.includes(email.toLowerCase().trim()) : false;
    
    const events = getEvents();
    Logger.log('Events fetched:', events.length);
    
    const response = {
      success: true,
      events: events,
      isAdmin: isAdmin,
      timestamp: new Date().toISOString()
    };

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error in handleGetEventsAPI:', error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        events: []
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==================== GET ADMIN EMAILS FROM SHEET ====================
function getAdminEmails() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let adminSheet = spreadsheet.getSheetByName(ADMIN_SHEET_NAME);
   
    Logger.log('=== Admin Emails Debug ===');
    Logger.log('Looking for sheet: ' + ADMIN_SHEET_NAME);
    Logger.log('Sheet found: ' + (adminSheet ? 'YES' : 'NO'));
   
    if (!adminSheet) {
      adminSheet = spreadsheet.insertSheet(ADMIN_SHEET_NAME);
      adminSheet.getRange(1, 1).setValue('Admin Email');
      adminSheet.getRange(2, 1).setValue(FALLBACK_ADMIN);
      adminSheet.getRange(1, 1)
        .setFontWeight('bold')
        .setBackground('#667eea')
        .setFontColor('#ffffff');
      Logger.log('Created Admins sheet with default admin');
    }
   
    const lastRow = adminSheet.getLastRow();
    Logger.log('Last row in Admins sheet: ' + lastRow);
   
    if (lastRow <= 1) {
      Logger.log('No admins in sheet, using fallback');
      return [FALLBACK_ADMIN];
    }
   
    const emails = adminSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    Logger.log('Raw emails from sheet: ' + JSON.stringify(emails));
   
    const adminList = emails
      .map(row => row[0])
      .filter(email => email && email.toString().trim() !== '')
      .map(email => email.toString().toLowerCase().trim());
   
    Logger.log('Admin emails (processed): ' + adminList.join(', '));
   
    return adminList.length > 0 ? adminList : [FALLBACK_ADMIN];
  } catch (error) {
    Logger.log('Error getting admin emails: ' + error);
    return [FALLBACK_ADMIN];
  }
}

// ==================== CHECK ADMIN STATUS (CALLED FROM CLIENT) ====================
function checkAdminByEmail(email) {
  try {
    const adminEmails = getAdminEmails();
    return adminEmails.includes(email.toLowerCase().trim());
  } catch (error) {
    Logger.log('Error checking admin status: ' + error);
    return false;
  }
}

// API wrapper for client-side fetch ?action=checkAdmin&email=...
function handleAdminCheck(email) {
  try {
    const isAdmin = checkAdminByEmail(email);
    return ContentService.createTextOutput(JSON.stringify({ success: true, isAdmin: isAdmin }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Server-side owner check used by client via google.script.run.isOwner()
function isOwner() {
  try {
    const email = Session.getActiveUser && Session.getActiveUser().getEmail ? Session.getActiveUser().getEmail() : '';
    if (!email) return false;
    const admins = getAdminEmails();
    return admins.includes(email.toLowerCase().trim());
  } catch (e) {
    Logger.log('isOwner error: ' + e);
    return false;
  }
}

// ==================== GET WEB APP URL ====================
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

// ==================== SHEET INITIALIZATION ====================
function initializeSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  
  const firstRow = sheet.getRange(1, 1, 1, 9).getValues()[0];
  if (!firstRow[0] || firstRow[0] !== 'Event Name') {
    sheet.getRange(1, 1, 1, 9).setValues([[
      'Event Name', 'Events', 'Date', 'Time', 'Location', 'Description', 'Attendee List', 'Picture URL', 'File IDs'
    ]]);
    sheet.getRange(1, 1, 1, 9)
      .setFontWeight('bold')
      .setBackground('#667eea')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}


// ==================== GET ALL EVENTS ====================
function getEvents() {
  try {
    Logger.log('getEvents called');
    
    const sheet = initializeSheet();
    const lastRow = sheet.getLastRow();
    
    Logger.log('Sheet last row:', lastRow);
    
    if (lastRow <= 1) {
      Logger.log('No data rows found');
      return [];
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    Logger.log('Data fetched, rows:', data.length);
    
    const events = [];
    
    for (let i = 0; i < data.length; i++) {
      const eventName = data[i][0];
      
      if (!eventName || eventName.toString().trim() === '') {
        Logger.log('Skipping empty row:', i + 2);
        continue;
      }
      
      // Date formatting
      const dateValue = data[i][2];
      let formattedDate = '';
      
      if (dateValue instanceof Date) {
        formattedDate = Utilities.formatDate(dateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else if (typeof dateValue === 'string' && dateValue.trim() !== '') {
        try {
          const parsedDate = new Date(dateValue);
          if (!isNaN(parsedDate.getTime())) {
            formattedDate = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          } else {
            formattedDate = dateValue;
          }
        } catch (e) {
          formattedDate = dateValue;
        }
      }
      
      // Time formatting
      let cleanTime = '';
      const timeValue = data[i][3];
      if (timeValue) {
        const timeStr = timeValue.toString().trim();
        cleanTime = timeStr.replace(/\s*(GMT|UTC).*$/i, '').trim();
        if (!/AM|PM/i.test(cleanTime) && /^\d{1,2}:\d{2}/.test(cleanTime)) {
          const [hours, minutes] = cleanTime.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          cleanTime = `${displayHour}:${minutes} ${ampm}`;
        }
      }
      
      const uniqueId = `${eventName.toString().trim()}_${formattedDate}`;
      
      const event = {
        id: uniqueId,
        eventName: eventName.toString(),
        events: data[i][1] ? data[i][1].toString() : '',
        date: formattedDate,
        time: cleanTime,
        location: data[i][4] ? data[i][4].toString() : '',
        description: data[i][5] ? data[i][5].toString() : '',
        attendeeList: data[i][6] ? data[i][6].toString() : '',
        pictureUrl: data[i][7] ? data[i][7].toString() : '',
        fileIds: data[i][8] ? data[i][8].toString() : ''
      };
      
      events.push(event);
      Logger.log('Event added:', event.eventName);
    }
    
    // Sort by date
    events.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });
    
    Logger.log('Total events returned:', events.length);
    return events;
    
  } catch (error) {
    Logger.log('Error in getEvents:', error.toString());
    throw new Error('Failed to load events: ' + error.message);
  }
}

// ==================== TEST FUNCTION ====================
// இந்த function run பண்ணி test பண்ணுங்க
function testGetEvents() {
  try {
    const events = getEvents();
    Logger.log('Test Result - Total Events:', events.length);
    
    if (events.length > 0) {
      Logger.log('First Event:', JSON.stringify(events[0]));
      Logger.log('✅ SUCCESS - Events loaded successfully!');
    } else {
      Logger.log('⚠️ WARNING - No events found. Check your sheet data.');
    }
    
    return events;
  } catch (error) {
    Logger.log('❌ ERROR:', error.toString());
    return null;
  }
}

// ==================== DEBUG FUNCTION ====================
function debugSheetData() {
  const sheet = initializeSheet();
  const lastRow = sheet.getLastRow();
  
  Logger.log('=== SHEET DEBUG INFO ===');
  Logger.log('Sheet Name:', sheet.getName());
  Logger.log('Last Row:', lastRow);
  Logger.log('Last Column:', sheet.getLastColumn());
  
  if (lastRow > 1) {
    const headers = sheet.getRange(1, 1, 1, 9).getValues()[0];
    Logger.log('Headers:', headers);
    
    const firstDataRow = sheet.getRange(2, 1, 1, 9).getValues()[0];
    Logger.log('First Data Row:', firstDataRow);
  } else {
    Logger.log('⚠️ No data found in sheet!');
  }
}

// ==================== FIND EVENT ROW BY NAME + DATE ====================
function findEventRow(eventId) {
  try {
    const sheet = initializeSheet();
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return null;
    }
    
    // Parse event ID (format: "EventName_yyyy-MM-dd")
    const parts = eventId.split('_');
    if (parts.length < 2) {
      Logger.log('Invalid event ID format: ' + eventId);
      return null;
    }
    
    const targetDate = parts[parts.length - 1]; // Last part is date
    const targetName = parts.slice(0, -1).join('_'); // Rest is name
    
    const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues(); // Name, Events, Date columns
    
    for (let i = 0; i < data.length; i++) {
      const rowName = data[i][0] ? data[i][0].toString().trim() : '';
      const rowDateValue = data[i][2];
      
      let rowDate = '';
      if (rowDateValue instanceof Date) {
        rowDate = Utilities.formatDate(rowDateValue, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else if (typeof rowDateValue === 'string') {
        try {
          const parsed = new Date(rowDateValue);
          if (!isNaN(parsed.getTime())) {
            rowDate = Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
          }
        } catch (e) {
          rowDate = rowDateValue;
        }
      }
      
      // Match by name AND date
      if (rowName === targetName && rowDate === targetDate) {
        Logger.log('Found event at row: ' + (i + 2) + ' | Name: ' + rowName + ' | Date: ' + rowDate);
        return i + 2; // Return row number
      }
    }
    
    Logger.log('Event not found - ID: ' + eventId);
    return null;
  } catch (error) {
    Logger.log('Error in findEventRow: ' + error.toString());
    return null;
  }
}

// ==================== ADD EVENT ====================
function addEvent(eventData) {
  // Note: Authorization is checked in doPost() before calling this function
  // But when called via google.script.run directly, we need to check here too
  
  try {
    // Try to get current user email from session (for google.script.run calls)
    let sessionEmail = '';
    try {
      sessionEmail = Session.getActiveUser && Session.getActiveUser().getEmail ? Session.getActiveUser().getEmail().toLowerCase() : '';
    } catch (e) {
      sessionEmail = '';
    }
    
    // If we have a session email, verify it's an admin
    if (sessionEmail) {
      const admins = getAdminEmails();
      const isAdmin = admins.indexOf(sessionEmail) !== -1;
      Logger.log('addEvent session check: email=' + sessionEmail + ', isAdmin=' + isAdmin);
      if (!isAdmin) {
        throw new Error('Access denied: Only admins can add events');
      }
    }
    
    Logger.log('=== addEvent called ===');
    Logger.log('eventData: ' + JSON.stringify(eventData));
    
    const sheet = initializeSheet();
    const lastRow = sheet.getLastRow();
    Logger.log('Sheet lastRow: ' + lastRow);
    
    let dateToSave = eventData.date;
    if (eventData.date) {
      try {
        const parsedDate = new Date(eventData.date);
        if (!isNaN(parsedDate.getTime())) {
          dateToSave = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
      } catch (e) {
        Logger.log('Date parsing error: ' + e);
      }
    }
    
    // Ensure we write all 9 columns (including File IDs column)
    const newRow = lastRow + 1;
    const values = [[
      eventData.eventName || '',
      eventData.events || '',
      dateToSave || '',
      eventData.time || '',
      eventData.location || '',
      eventData.description || '',
      eventData.attendeeList || '',
      eventData.pictureUrl || '',
      '' // fileIds
    ]];
    
    Logger.log('Writing row ' + newRow + ': ' + JSON.stringify(values[0]));
    sheet.getRange(newRow, 1, 1, 9).setValues(values);
    Logger.log('✅ Wrote to sheet, lastRow is now: ' + sheet.getLastRow());
    
    return { success: true, message: 'Event added successfully!' };
  } catch (error) {
    Logger.log('❌ Error adding event: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// ==================== UPDATE EVENT ====================
// Updated to allow sheet-admins (validated via doPost) to update events.
// `callerEmail` is optionally passed from the REST path (doPost) and contains
// the resolved email (from ID token or client-side fallback). When the function
// is invoked directly via HtmlService (google.script.run), Session.getActiveUser()
// will be used for authorization.
function updateEvent(eventId, eventData, callerEmail) {
  try {
    Logger.log('=== updateEvent called ===');
    Logger.log('eventId: ' + eventId + ', callerEmail: ' + callerEmail);
    Logger.log('eventData: ' + JSON.stringify(eventData));
    
    // Determine if caller is authorized: either the Apps Script session user
    // is in Admins sheet, or the provided callerEmail (from doPost) is in Admins.
    let sessionEmail = '';
    try {
      sessionEmail = Session.getActiveUser && Session.getActiveUser().getEmail ? Session.getActiveUser().getEmail().toLowerCase() : '';
    } catch (e) {
      sessionEmail = '';
    }

    const admins = getAdminEmails();
    const isSessionAdmin = sessionEmail ? admins.indexOf(sessionEmail) !== -1 : false;
    const callerEmailLower = callerEmail ? callerEmail.toString().toLowerCase() : '';
    const isCallerAdmin = callerEmailLower ? admins.indexOf(callerEmailLower) !== -1 : false;

    Logger.log('Auth: sessionEmail=' + sessionEmail + ', isSessionAdmin=' + isSessionAdmin + ', callerEmail=' + callerEmailLower + ', isCallerAdmin=' + isCallerAdmin);
    
    if (!isSessionAdmin && !isCallerAdmin) {
      throw new Error('Access denied: Only admins can update events');
    }

    const row = findEventRow(eventId);
    Logger.log('Found event at row: ' + row);
    
    if (!row) {
      throw new Error('Event not found. Please refresh and try again.');
    }
    
    const sheet = initializeSheet();
    
    let dateToSave = eventData.date;
    if (eventData.date) {
      try {
        const parsedDate = new Date(eventData.date);
        if (!isNaN(parsedDate.getTime())) {
          dateToSave = Utilities.formatDate(parsedDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
      } catch (e) {
        Logger.log('Date parsing error: ' + e);
      }
    }
    
    // Preserve existing file IDs (column 9) when updating
    const existingFileIds = sheet.getRange(row, 9).getValue() || '';
    const values = [[
      eventData.eventName || '',
      eventData.events || '',
      dateToSave || '',
      eventData.time || '',
      eventData.location || '',
      eventData.description || '',
      eventData.attendeeList || '',
      eventData.pictureUrl || '',
      existingFileIds
    ]];
    
    Logger.log('Writing row ' + row + ': ' + JSON.stringify(values[0]));
    sheet.getRange(row, 1, 1, 9).setValues(values);
    Logger.log('✅ Event updated at row: ' + row);
    return { success: true, message: 'Event updated successfully!' };
  } catch (error) {
    Logger.log('❌ Error updating event: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

// ==================== DELETE EVENT ====================
// Updated to allow sheet-admins (validated via doPost) to delete events.
// `callerEmail` is passed from REST path (doPost) and contains the resolved email.
function deleteEvent(eventId, callerEmail) {
  try {
    // Determine if caller is authorized: either the Apps Script session user
    // is in Admins sheet, or the provided callerEmail (from doPost) is in Admins.
    let sessionEmail = '';
    try {
      sessionEmail = Session.getActiveUser && Session.getActiveUser().getEmail ? Session.getActiveUser().getEmail().toLowerCase() : '';
    } catch (e) {
      sessionEmail = '';
    }

    const admins = getAdminEmails();
    const isSessionAdmin = sessionEmail ? admins.indexOf(sessionEmail) !== -1 : false;
    const callerEmailLower = callerEmail ? callerEmail.toString().toLowerCase() : '';
    const isCallerAdmin = callerEmailLower ? admins.indexOf(callerEmailLower) !== -1 : false;

    if (!isSessionAdmin && !isCallerAdmin) {
      throw new Error('Access denied: Only owner or sheet-admins can delete events');
    }
  
    const row = findEventRow(eventId);
    
    if (!row) {
      throw new Error('Event not found. It may have been already deleted.');
    }
    
    const sheet = initializeSheet();
    
    // Delete associated files first
    const fileIds = sheet.getRange(row, 9).getValue();
    if (fileIds && fileIds.toString().trim() !== '') {
      const ids = fileIds.toString().split(',');
      ids.forEach(id => {
        try {
          const trimmedId = id.trim();
          if (trimmedId) {
            const file = DriveApp.getFileById(trimmedId);
            file.setTrashed(true);
          }
        } catch (e) {
          Logger.log('Error deleting file: ' + e);
        }
      });
    }
    
    // Delete picture from Drive if it exists
    const pictureUrl = sheet.getRange(row, 8).getValue();
    if (pictureUrl && pictureUrl.toString().trim() !== '') {
      try {
        deleteImageFromDrive(pictureUrl.toString());
        Logger.log('Picture deleted from Drive');
      } catch (e) {
        Logger.log('Warning: Could not delete picture from Drive: ' + e);
      }
    }
    
    sheet.deleteRow(row);
    Logger.log('✅ Event deleted from row: ' + row);
    return { success: true, message: 'Event deleted successfully!' };
  } catch (error) {
    Logger.log('❌ Error deleting event: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}


// ==================== FILE UPLOAD (CALENDAR PAGE) ====================
function uploadFile(fileData, fileName, mimeType, eventId) {
  try {
    // Find event first
    const row = findEventRow(eventId);
    if (!row) {
      throw new Error('Event not found');
    }
    
    const sheet = initializeSheet();
    const eventDate = sheet.getRange(row, 3).getValue(); // Get date from row
    
    // Format date as ddMMyyyy
    let formattedDate = 'unknown';
    try {
      let dateObj;
      if (eventDate instanceof Date) {
        dateObj = eventDate;
      } else {
        dateObj = new Date(eventDate);
      }
      
      if (!isNaN(dateObj.getTime())) {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        formattedDate = day + month + year; // ddMMyyyy
      }
    } catch (e) {
      Logger.log('Date format error: ' + e);
    }
    
    // Get file extension
    const fileExt = fileName.split('.').pop().toLowerCase();
    
    // Create new filename with date
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const newFileName = `${nameWithoutExt}_${formattedDate}.${fileExt}`;
    
    // Compress if image and over 5MB
    let finalData = fileData;
    let finalMimeType = mimeType;
    
    if (mimeType.startsWith('image/') && fileData.length > 5 * 1024 * 1024) {
      // Image is over 5MB - need to compress on client side first
      Logger.log('Image too large, should be compressed on client side');
    }
    
    const blob = Utilities.newBlob(
      Utilities.base64Decode(finalData),
      finalMimeType,
      newFileName
    );
    
    // Get or create folder
    const folders = DriveApp.getFoldersByName('Event Management Files');
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder('Event Management Files');
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    file.setDescription(`Event ID: ${eventId}, Upload Date: ${new Date().toISOString()}`);
    
    // Save file ID to sheet
    const currentFileIds = sheet.getRange(row, 9).getValue();
    const newFileIds = currentFileIds ? currentFileIds + ',' + file.getId() : file.getId();
    sheet.getRange(row, 9).setValue(newFileIds);
    
    Logger.log('File uploaded: ' + newFileName);
    
    return {
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileName: newFileName
    };
  } catch (error) {
    Logger.log('Error uploading file: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ==================== DELETE FILE ====================
function deleteFile(fileId, eventId) {
  try {
    Logger.log('Deleting file - File ID: ' + fileId + ' | Event ID: ' + eventId);
    
    // Find event row by ID
    const row = findEventRow(eventId);
    
    if (!row) {
      Logger.log('Event not found for ID: ' + eventId);
      throw new Error('Event not found');
    }
    
    Logger.log('Found event at row: ' + row);
    
    // Delete from Drive first
    try {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      Logger.log('File trashed in Drive: ' + fileId);
    } catch (e) {
      Logger.log('Error trashing file from Drive: ' + e);
      // Continue even if Drive delete fails - maybe file already deleted
    }
    
    // Remove file ID from sheet
    const sheet = initializeSheet();
    const currentFileIds = sheet.getRange(row, 9).getValue();
    
    Logger.log('Current file IDs in sheet: ' + currentFileIds);
    
    if (currentFileIds) {
      const ids = currentFileIds.toString().split(',').map(id => id.trim());
      const updatedIds = ids.filter(id => id !== fileId.trim()).join(',');
      
      Logger.log('Updated file IDs: ' + updatedIds);
      
      sheet.getRange(row, 9).setValue(updatedIds);
      Logger.log('Sheet updated successfully');
    } else {
      Logger.log('No file IDs found in sheet');
    }
    
    return {
      success: true,
      message: 'File deleted successfully'
    };
  } catch (error) {
    Logger.log('Error deleting file: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

// ==================== UPLOAD IMAGE TO DRIVE ====================
function uploadImageToDrive(imageData, fileName, eventId) {
  try {
    const base64Data = imageData.split(',')[1] || imageData;
    
    // Find event row
    const row = findEventRow(eventId);
    if (!row) {
      throw new Error('Event not found');
    }
    
    const sheet = initializeSheet();
    const eventName = sheet.getRange(row, 1).getValue(); // Get event name
    const eventDate = sheet.getRange(row, 3).getValue(); // Get date
    
    // Format date as ddMMyyyy
    let formattedDate = 'unknown';
    try {
      let dateObj;
      if (eventDate instanceof Date) {
        dateObj = eventDate;
      } else {
        dateObj = new Date(eventDate);
      }
      
      if (!isNaN(dateObj.getTime())) {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        formattedDate = day + month + year;
      }
    } catch (e) {
      Logger.log('Date format error: ' + e);
    }
    
    // Clean event name (remove special characters)
    const cleanEventName = eventName.toString().trim()
      .replace(/[^a-zA-Z0-9]/g, '_')  // Replace special chars with underscore
      .substring(0, 30);  // Limit to 30 chars
    
    // FIX: Unique filename = eventName_date_timestamp
    const timestamp = Date.now();
    const newFileName = `${cleanEventName}_${formattedDate}_${timestamp}.jpg`;
    
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/jpeg',
      newFileName
    );
    
    const folders = DriveApp.getFoldersByName('Event Images');
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder('Event Images');
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    file.setDescription(`Event: ${eventName}, Date: ${eventDate}, Upload: ${new Date().toISOString()}`);

    const fileId = file.getId();
    // Use a Drive-friendly public URL that works in <img src=>
    const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    Logger.log('Image uploaded - Name: ' + newFileName + ' | File ID: ' + fileId);

    return {
      success: true,
      imageUrl: imageUrl,
      fileId: fileId,
      fileName: newFileName,
      fileUrl: file.getUrl()
    };
  } catch (error) {
    Logger.log('Error uploading image: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

// ------------------ Improved deleteImageFromDrive (override) ------------------
// This implementation is appended to be sure it overrides any previous one
function deleteImageFromDrive(imageUrl) {
  try {
    // Attempt to extract file ID from common Drive URL patterns
    let fileId = null;
    const patterns = [/\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/, /\/file\/d\/([a-zA-Z0-9_-]+)/];
    for (let i = 0; i < patterns.length; i++) {
      const m = imageUrl.match(patterns[i]);
      if (m && m[1]) {
        fileId = m[1];
        break;
      }
    }

    if (fileId) {
      try {
        const file = DriveApp.getFileById(fileId);
        file.setTrashed(true);
        Logger.log('Image deleted from Drive - File ID: ' + fileId);
        return { success: true, message: 'Image deleted from Drive' };
      } catch (e) {
        Logger.log('Error trashing file from Drive: ' + e);
        return { success: false, error: e.toString() };
      }
    }

    Logger.log('Not a Drive image (no fileId found), skipping deletion');
    return { success: true, message: 'External URL, not deleted' };
  } catch (error) {
    Logger.log('Error deleting image (override): ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ==================== DELETE IMAGE FROM DRIVE ====================
function deleteImageFromDrive(imageUrl) {
  try {
    // Extract file ID from URL
    let fileId = null;
    
    // Check different URL formats
    if (imageUrl.includes('googleusercontent.com/d/')) {
      fileId = imageUrl.split('/d/')[1].split('/')[0];
    } else if (imageUrl.includes('drive.google.com')) {
      const match = imageUrl.match(/id=([^&]+)/);
      if (match) fileId = match[1];
    }
    
    if (fileId) {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      Logger.log('Image deleted from Drive - File ID: ' + fileId);
      return { success: true, message: 'Image deleted from Drive' };
    } else {
      Logger.log('Not a Drive image, skipping deletion');
      return { success: true, message: 'External URL, not deleted' };
    }
  } catch (error) {
    Logger.log('Error deleting image: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}


// ==================== AUTO CLEANUP ====================
function cleanupOldFiles() {
  try {
    const sheet = initializeSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;
    
    const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    for (let i = 0; i < data.length; i++) {
      const dateValue = data[i][2];
      let eventDate;
      
      if (dateValue instanceof Date) {
        eventDate = dateValue;
      } else if (typeof dateValue === 'string') {
        eventDate = new Date(dateValue);
      }
      
      const fileIds = data[i][8];
      if (eventDate && !isNaN(eventDate.getTime()) && eventDate < twoDaysAgo && fileIds) {
        const ids = fileIds.toString().split(',');
        ids.forEach(id => {
          try {
            const trimmedId = id.trim();
            if (trimmedId) {
              const file = DriveApp.getFileById(trimmedId);
              file.setTrashed(true);
            }
          } catch (error) {
            Logger.log(`Error deleting file ${id}: ${error}`);
          }
        });
        sheet.getRange(i + 2, 9).setValue('');
        Logger.log(`Cleaned up files for event: ${data[i][0]}`);
      }
    }
  } catch (error) {
    Logger.log('Error in cleanup: ' + error.toString());
  }
}

// ==================== CREATE CLEANUP TRIGGER ====================
function createCleanupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'cleanupOldFiles') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  ScriptApp.newTrigger('cleanupOldFiles')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
    
  Logger.log('Cleanup trigger created successfully');
}

// ==================== VERIFY ID TOKEN (Google) ====================
function verifyIdToken(idToken) {
  try {
    if (!idToken) return null;
    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) {
      Logger.log('Token verify failed: ' + resp.getContentText());
      return null;
    }
    const data = JSON.parse(resp.getContentText());
    // data contains email, aud, iss, exp, etc.
    return data;
  } catch (e) {
    Logger.log('verifyIdToken error: ' + e);
    return null;
  }
}

// ==================== REST POST HANDLER ====================
function doPost(e) {
  try {
    // Handle preflight if needed
    if (e === undefined) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No payload' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const body = e.postData && e.postData.type === 'application/json' ? JSON.parse(e.postData.contents) : (e.parameter || {});
    const action = body.action || e.parameter.action;
    const idToken = body.id_token || e.parameter.id_token;
    const userEmailFromClient = body.userEmail || e.parameter.userEmail; // Allow client-side email for static hosting
    
    // Parse eventData if it's a JSON string (from form-encoded POST)
    let eventData = body.eventData;
    if (eventData && typeof eventData === 'string') {
      try {
        eventData = JSON.parse(eventData);
      } catch (e) {
        Logger.log('Could not parse eventData as JSON: ' + e);
      }
    }

    // Verify token and get email
    let userEmail = null;
    let verified = null;
    if (idToken) {
      verified = verifyIdToken(idToken);
      if (verified && verified.email) userEmail = verified.email.toLowerCase();
    }
    
    // If no token-based email, use client-provided email (for static hosting)
    if (!userEmail && userEmailFromClient) {
      userEmail = userEmailFromClient.toLowerCase();
      Logger.log('Using client-provided email:', userEmail);
    }

    // Helper to check admin
    const isAdminUser = function() {
      if (!userEmail) {
        Logger.log('isAdminUser: no userEmail available');
        return false;
      }
      const admins = getAdminEmails();
      const result = admins.indexOf(userEmail) !== -1;
      Logger.log('isAdminUser check: email=' + userEmail + ', isAdmin=' + result);
      return result;
    };

    // Route actions
    switch (action) {
      case 'addEvent':
        Logger.log('addEvent action: checking admin status...');
        if (!isAdminUser()) {
          Logger.log('❌ addEvent denied - user not admin');
          return jsonResponse({ success: false, error: 'Unauthorized' });
        }
        Logger.log('✅ addEvent authorized - calling addEvent with eventData: ' + JSON.stringify(eventData));
        return jsonResponse(addEvent(eventData));

      case 'updateEvent':
        Logger.log('updateEvent action: checking admin status...');
        if (!isAdminUser()) {
          Logger.log('❌ updateEvent denied - user not admin');
          return jsonResponse({ success: false, error: 'Unauthorized' });
        }
        Logger.log('✅ updateEvent authorized - calling updateEvent with userEmail: ' + userEmail);
        // Pass the resolved userEmail to updateEvent so sheet-admins (validated above)
        // can be authorized inside the function when Session user is not available.
        return jsonResponse(updateEvent(body.eventId, eventData, userEmail));

      case 'deleteEvent':
        if (!isAdminUser()) return jsonResponse({ success: false, error: 'Unauthorized' });
        return jsonResponse(deleteEvent(body.eventId, userEmail));

      case 'uploadFile':
        if (!isAdminUser()) return jsonResponse({ success: false, error: 'Unauthorized' });
        return jsonResponse(uploadFile(body.fileData, body.fileName, body.mimeType, body.eventId));

      case 'uploadImageToDrive':
        if (!isAdminUser()) return jsonResponse({ success: false, error: 'Unauthorized' });
        return jsonResponse(uploadImageToDrive(body.imageData, body.fileName, body.eventId));

      case 'deleteFile':
        if (!isAdminUser()) return jsonResponse({ success: false, error: 'Unauthorized' });
        return jsonResponse(deleteFile(body.fileId, body.eventId));

      case 'deleteImageFromDrive':
        if (!isAdminUser()) return jsonResponse({ success: false, error: 'Unauthorized' });
        return jsonResponse(deleteImageFromDrive(body.imageUrl));

      case 'checkAdmin':
        // Allow checking admin by email parameter (no token required)
        const emailToCheck = body.email || e.parameter.email || userEmail;
        const isAdmin = emailToCheck ? getAdminEmails().indexOf(emailToCheck.toLowerCase()) !== -1 : false;
        return jsonResponse({ success: true, isAdmin: isAdmin });

      case 'getEvents':
        // Return events (no auth required for read)
        const events = getEvents();
        return jsonResponse({ success: true, events: events, isAdmin: isAdminUser(), timestamp: new Date().toISOString() });

      default:
        return jsonResponse({ success: false, error: 'Unknown action' });
    }
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}