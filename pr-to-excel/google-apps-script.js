// ─── PR to Excel – Google Apps Script ────────────────────────────────────────
//
// HOW TO DEPLOY:
// 1. Open your Google Sheet
// 2. Click Extensions → Apps Script
// 3. Delete any existing code and paste this entire file
// 4. Replace SPREADSHEET_ID below with your sheet's ID
//    (from the URL: docs.google.com/spreadsheets/d/THIS_PART_HERE/edit)
// 5. Click Save (Ctrl+S)
// 6. Click Deploy → New deployment
//    - Type: Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 7. Click Deploy → Authorize → Allow
// 8. Copy the Web App URL
// 9. Paste it into background.js as APPS_SCRIPT_URL
// ─────────────────────────────────────────────────────────────────────────────

const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
const SHEET_NAME     = "Sheet1"; // Change if your sheet tab has a different name

function doGet(e) {
  try {
    const taskName = e.parameter.taskName || "";
    const branch   = e.parameter.branch   || "";
    const pr       = e.parameter.pr       || "";
    const mergeTo  = e.parameter.mergeTo  || "";
    const status   = e.parameter.status   || "Not Merged";

    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    // Add header row if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Task Name", "Branch", "PR", "Merge To", "Status"]);

      // Style the header row
      const headerRange = sheet.getRange(1, 1, 1, 5);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4a86e8");
      headerRange.setFontColor("#ffffff");
    }

    // Append the PR data row
    sheet.appendRow([taskName, branch, pr, mergeTo, status]);

    // Auto-resize all columns for readability
    sheet.autoResizeColumns(1, 5);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
