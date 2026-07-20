function injectButton() {
  // Run on /projects/*/task/* paths OR any page with ?task= / &task= in the query string
  const hasTaskInPath = /\/projects\/[^/]+\/task\//.test(location.pathname);
  const hasTaskInQuery = /[?&]task=/.test(location.search);
  if (!hasTaskInPath && !hasTaskInQuery) return;

  const heading = document.querySelector("h2.text-lg.font-semibold.leading-tight.flex-1");
  if (!heading || heading.dataset.excelBtnAdded) return;

  heading.dataset.excelBtnAdded = "true";

  // Inject keyframe animation once
  if (!document.getElementById("kte-styles")) {
    const style = document.createElement("style");
    style.id = "kte-styles";
    style.textContent = `
      @keyframes kte-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); transform: scale(1); }
        50%  { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);  transform: scale(1.04); }
        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);    transform: scale(1); }
      }
      #kte-btn {
        animation: kte-pulse 1.8s ease-in-out infinite;
      }
      #kte-btn:hover {
        animation: none;
        transform: scale(1.08);
        box-shadow: 0 4px 14px rgba(34,197,94,0.55);
      }
      #kte-btn:disabled {
        animation: none;
        opacity: 0.7;
        cursor: not-allowed;
      }
      @keyframes ktb-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); transform: scale(1); }
        50%  { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);  transform: scale(1.04); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);    transform: scale(1); }
      }
      #ktb-btn {
        animation: ktb-pulse 1.8s ease-in-out infinite;
      }
      #ktb-btn:hover {
        animation: none;
        transform: scale(1.08);
        box-shadow: 0 4px 14px rgba(59,130,246,0.55);
      }
      #ktb-btn:disabled {
        animation: none;
        opacity: 0.7;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  const btn = document.createElement("button");
  btn.id = "kte-btn";
  btn.textContent = "📊 Add to Excel";
  btn.title = "Add this task to the tracking sheet";
  btn.style.cssText = `
    margin-left: 12px;
    padding: 5px 13px;
    background: linear-gradient(135deg, #16a34a, #22c55e);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.3px;
    transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
  `;

  btn.addEventListener("click", () => {
    btn.textContent = "Adding…";
    btn.disabled = true;

    const taskTitle = heading.textContent.trim();
    const taskUrl = location.href;

    // Extract task ID from path (/task/RP-123) or query (?task=RP-123)
    const pathMatch = location.pathname.match(/\/task\/([^/?]+)/);
    const queryMatch = location.search.match(/[?&]task=([^&]+)/);
    const taskId = (pathMatch?.[1] || queryMatch?.[1] || "").trim();

    // "Apr 2026"
    const now = new Date();
    const monthYear = now.toLocaleString("default", { month: "short" }) + " " + now.getFullYear();

    chrome.runtime.sendMessage({ action: "addToSheet", monthYear, taskId, taskUrl, taskTitle }, (response) => {
      if (response?.ok) {
        btn.textContent = "✅ Added!";
        btn.style.background = "#15803d";
      } else {
        btn.textContent = "❌ Failed";
        btn.style.background = "#dc2626";
        console.error("[Add to Excel] Error:", response?.error);
      }
      setTimeout(() => {
        btn.textContent = "📊 Add to Excel";
        btn.style.background = "linear-gradient(135deg, #16a34a, #22c55e)";
        btn.disabled = false;
      }, 2500);
    });
  });

  heading.insertAdjacentElement("afterend", btn);

  // --- Create Branch button ---
  if (document.getElementById("ktb-btn")) return;

  const branchBtn = document.createElement("button");
  branchBtn.id = "ktb-btn";
  branchBtn.textContent = "🌿 Create Branch";
  branchBtn.title = "Create a Bitbucket branch for this task";
  branchBtn.style.cssText = `
    margin-left: 8px;
    padding: 5px 13px;
    background: linear-gradient(135deg, #1d4ed8, #3b82f6);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.3px;
    transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
  `;

  branchBtn.addEventListener("click", () => {
    branchBtn.textContent = "Opening…";
    branchBtn.disabled = true;

    const taskTitle = heading.textContent.trim();

    chrome.runtime.sendMessage({ action: "createBranch", taskTitle }, (response) => {
      if (response?.ok) {
        branchBtn.textContent = "✅ Branch created!";
        branchBtn.style.background = "#1e40af";
      } else {
        branchBtn.textContent = "❌ Failed";
        branchBtn.style.background = "#dc2626";
        console.error("[Create Branch] Error:", response?.error);
      }
      setTimeout(() => {
        branchBtn.textContent = "🌿 Create Branch";
        branchBtn.style.background = "linear-gradient(135deg, #1d4ed8, #3b82f6)";
        branchBtn.disabled = false;
      }, 3000);
    });
  });

  btn.insertAdjacentElement("afterend", branchBtn);
}

// Run once on load
injectButton();

// Re-run when the SPA navigates or DOM changes (kapture uses React/Vue)
const observer = new MutationObserver(() => {
  injectButton();
});

observer.observe(document.body, { childList: true, subtree: true });
