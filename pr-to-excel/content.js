function injectButton() {
  // Only run on PR pages: /kapture-cx/*/pull/123
  if (!/\/pull\/\d+/.test(location.pathname)) return;

  // Avoid injecting twice
  if (document.getElementById("kpr-excel-btn")) return;

  // Find the PR title element
  const titleEl = document.querySelector(".markdown-title");
  if (!titleEl) return;

  // Walk up to the h1 (or use the span's parent as fallback)
  const titleContainer = titleEl.closest("h1") || titleEl.parentElement;
  if (!titleContainer) return;

  // Inject animation styles once
  if (!document.getElementById("kpr-styles")) {
    const style = document.createElement("style");
    style.id = "kpr-styles";
    style.textContent = `
      @keyframes kpr-pulse {
        0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); transform: scale(1); }
        50%  { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);  transform: scale(1.04); }
        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);    transform: scale(1); }
      }
      #kpr-excel-btn {
        animation: kpr-pulse 1.8s ease-in-out infinite;
      }
      #kpr-excel-btn:hover {
        animation: none;
        transform: scale(1.08);
        box-shadow: 0 4px 14px rgba(34,197,94,0.55);
      }
      #kpr-excel-btn:disabled {
        animation: none;
        opacity: 0.7;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  const btn = document.createElement("button");
  btn.id = "kpr-excel-btn";
  btn.textContent = "📊 Add to Excel";
  btn.title = "Log this PR to the tracking sheet";
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
    vertical-align: middle;
    transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
  `;

  btn.addEventListener("click", () => {
    btn.textContent = "Adding…";
    btn.disabled = true;

    // --- Extract PR data from the page ---

    // Task Name: PR title text
    const taskName = document.querySelector(".markdown-title")?.textContent.trim() || "";

    // PR URL: current page
    const pr = location.href;

    // Branch pills: GitHub renders base branch FIRST, head branch SECOND
    // Layout on page: "[base] ← [head]" (i.e. "into [base] from [head]")
    const branchEls = document.querySelectorAll("[data-component='BranchName']");
    const mergeTo = branchEls[0]?.textContent.trim() || "";
    const branch  = branchEls[1]?.href || "";

    // Status: newly raised PR = Not Merged
    const status = "Not Merged";

    chrome.runtime.sendMessage(
      { action: "addToSheet", taskName, branch, pr, mergeTo, status },
      (response) => {
        if (response?.ok) {
          btn.textContent = "✅ Added!";
          btn.style.background = "#15803d";
        } else {
          btn.textContent = "❌ Failed";
          btn.style.background = "#dc2626";
          console.error("[PR to Excel] Error:", response?.error);
        }
        setTimeout(() => {
          btn.textContent = "📊 Add to Excel";
          btn.style.background = "linear-gradient(135deg, #16a34a, #22c55e)";
          btn.disabled = false;
        }, 2500);
      }
    );
  });

  // Insert button right after the h1 title container
  titleContainer.insertAdjacentElement("afterend", btn);
}

// Run once on load
injectButton();

// Re-run on GitHub Turbo/SPA navigation and dynamic renders
const observer = new MutationObserver(() => {
  injectButton();
});

observer.observe(document.body, { childList: true, subtree: true });
