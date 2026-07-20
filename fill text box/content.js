const FILL_TEXT = "Testing Some Api in Live Client";
const STORAGE_KEY = "adjetter_autofill_ts";
const COOLDOWN_MS = 15000; // 15 seconds — covers the redirect/reload after submit

function alreadySubmittedRecently() {
  const ts = localStorage.getItem(STORAGE_KEY);
  return ts && (Date.now() - parseInt(ts)) < COOLDOWN_MS;
}

function fillAndSubmit() {
  if (alreadySubmittedRecently()) return;
  const textarea = document.getElementById("remarks");
  if (!textarea || textarea.value !== "") return;

  // Mark as submitted BEFORE clicking so any reload sees the flag immediately
  localStorage.setItem(STORAGE_KEY, Date.now().toString());

  textarea.value = FILL_TEXT;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));

  const submitBtn = document.querySelector('input[type="submit"][onclick="setHidenParameter();"]');
  if (submitBtn) {
    setTimeout(() => submitBtn.click(), 300);
  }
}

fillAndSubmit();

const observer = new MutationObserver(() => {
  if (alreadySubmittedRecently()) { observer.disconnect(); return; }
  fillAndSubmit();
});
observer.observe(document.body, { childList: true, subtree: true });
