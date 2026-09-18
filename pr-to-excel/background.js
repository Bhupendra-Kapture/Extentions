// ─── CONFIGURE THESE TWO VALUES ──────────────────────────────────────────────
// 1. Paste your Google Apps Script Web App URL here (see setup guide)
const APPS_SCRIPT_URL = "https://script.google.com/a/macros/kapturecrm.com/s/AKfycbx9va7iEQDmnPI9Bw5UHhUnoI_Yn2doSd9KFb5dVoaOKIVNuywlEVSp1WoH3cD7c_dQ_w/exec";

// 2. Paste your Google Sheet URL here (opened after a successful add)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/13IWqqg0vGvhanv1bFGJPCjGT7joLlPeJPMabVZirHps/edit?gid=0#gid=0";
// ─────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== "addToSheet") return;

  const params = new URLSearchParams({
    taskName: message.taskName,
    branch: message.branch,
    pr: message.pr,
    mergeTo: message.mergeTo,
    status: message.status,
  });

  fetch(`${APPS_SCRIPT_URL}?${params}`, { redirect: "follow" })
    .then((res) => res.json())
    .then(() => {
      chrome.tabs.create({ url: SHEET_URL });
      sendResponse({ ok: true });
    })
    .catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });

  return true; // keep message channel open for async response
});
