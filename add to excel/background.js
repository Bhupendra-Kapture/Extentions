// Paste your Apps Script deployment URL here (see setup instructions)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8UZVQ1fvxql9tj9BktLPQxhDWc4MjAOQpzonDgCXm5_JXsnJC-ZiYKkT4XpDLlKY4dw/exec";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/163R4OUxCdnhz7CQ9_0cSECY33dMZOEyWZlbXwnAMCWg/edit?gid=0#gid=0";

const BITBUCKET_BRANCHES_URL = "https://bitbucket.org/adjetter/kapturecrm-ui/branches/";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // --- Create Branch ---
  if (message.action === "createBranch") {
    const taskTitle = message.taskTitle;

    chrome.tabs.create({ url: BITBUCKET_BRANCHES_URL }, (tab) => {
      const tabId = tab.id;

      function onUpdated(updatedTabId, changeInfo) {
        if (updatedTabId !== tabId || changeInfo.status !== "complete") return;
        chrome.tabs.onUpdated.removeListener(onUpdated);

        // Give the React app a moment to fully render
        setTimeout(() => {
          chrome.scripting.executeScript({
            target: { tabId },
            func: automateCreateBranch,
            args: [taskTitle],
          }).then(() => {
            sendResponse({ ok: true });
          }).catch((err) => {
            sendResponse({ ok: false, error: err.message });
          });
        }, 1500);
      }

      chrome.tabs.onUpdated.addListener(onUpdated);
    });

    return true; // keep channel open for async
  }

  if (message.action !== "addToSheet") return;

  const params = new URLSearchParams({
    monthYear: message.monthYear,
    taskId: message.taskId,
    taskUrl: message.taskUrl,
    taskTitle: message.taskTitle,
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

  return true; // keep channel open for async
});

// Injected into the Bitbucket tab to automate branch creation
function automateCreateBranch(taskTitle) {
  function waitFor(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timed out waiting for: ${selector}`));
      }, timeout);
    });
  }

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function setReactInputValue(input, value) {
    input.focus();
    input.select();

    // execCommand is the most reliable way to trigger React's synthetic onChange
    const inserted = document.execCommand("insertText", false, value);
    if (!inserted) {
      // Fallback: native setter + InputEvent
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(input, value);
      input.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: value,
      }));
    }
  }

  (async () => {
    // Step 1: Click "Create branch" button to open the modal
    const openBtn = await waitFor("#open-create-branch-modal");
    openBtn.click();

    // Step 2: Wait for the input to appear in the modal
    const input = await waitFor("input[name='branchName']");

    // Step 3: Wait for any API auto-fill to settle, then overwrite
    // Poll until the input stops changing (API response complete) or max 4s
    let previousValue = null;
    for (let i = 0; i < 20; i++) {
      await delay(200);
      if (input.value === previousValue) break; // value stabilised
      previousValue = input.value;
    }

    setReactInputValue(input, taskTitle);

    // Step 4: Poll until submit button is enabled, then click it
    const submitBtn = await waitFor("#create-branch-button");
    for (let i = 0; i < 30; i++) {
      if (!submitBtn.disabled) break;
      await delay(300);
    }
    submitBtn.click();
  })().catch((err) => console.error("[Create Branch] Automation error:", err));
}
