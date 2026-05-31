// Boilerplate Google Apps Script Backend for handling Expiry checking API and Cloud Sync.

const DB_FILENAME = "NumPal_Remote_Profiles.json";

function getDbFile() {
  const files = DriveApp.getFilesByName(DB_FILENAME);
  if (files.hasNext()) {
    return files.next();
  } else {
    // Create new JSON file in the root of the owner's Google Drive if it doesn't exist
    return DriveApp.createFile(DB_FILENAME, JSON.stringify({}), MimeType.PLAIN_TEXT);
  }
}

function readDb() {
  const file = getDbFile();
  const text = file.getBlob().getDataAsString();
  try {
    return JSON.parse(text || '{}');
  } catch(e) {
    return {};
  }
}

function writeDb(db) {
  const file = getDbFile();
  file.setContent(JSON.stringify(db));
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleSaveProfile(data) {
  const db = readDb();
  if (db[data.profileName]) {
    return respond({ success: false, error: "NAME_CONFLICT" });
  }
  
  db[data.profileName] = [
    {
      version: 1,
      description: data.description || "Initial setup",
      timestamp: new Date().getTime(),
      styles: data.styles
    }
  ];
  
  writeDb(db);
  return respond({ success: true, message: "Profile created in Drive." });
}

function handleAddVersion(data) {
  const db = readDb();
  if (!db[data.profileName]) {
    return respond({ success: false, error: "NOT_FOUND" });
  }
  
  const history = db[data.profileName];
  const lastVersion = history.length > 0 ? history[history.length - 1].version : 0;
  
  history.push({
    version: lastVersion + 1,
    description: data.description || "Updated layout",
    timestamp: new Date().getTime(),
    styles: data.styles
  });
  
  // Keep only the latest 10 versions
  if (history.length > 10) {
    history.shift(); 
  }
  
  db[data.profileName] = history;
  writeDb(db);
  return respond({ success: true, message: "New version saved to Drive." });
}

function handleGetProfiles() {
  return respond({ success: true, db: readDb() });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Cloud Sync Routes
    if (data.action === 'saveProfile') return handleSaveProfile(data);
    if (data.action === 'addVersion') return handleAddVersion(data);
    if (data.action === 'getProfiles') return handleGetProfiles();

    // Default Expiry Checking Logic
    const base64Image = data.image;
    
    // Process the base64 Image via Google Cloud Vision or your preferred AI engine here.
    return ContentService.createTextOutput(JSON.stringify({
      foundDate: true,
      isExpired: false, 
      rawText: "Sample OCR Data"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handling pre-flight OPTIONS request for CORS
function doOptions(e) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}