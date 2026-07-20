const REPO = 'kapture-cx/kapture-vitos-ui';
const TARGET_BRANCHES = ['main_develop', 'qk', 'feature/qk-1'];

// ============================================================
// Part 1: Inject "Raise PR" button on /tree/* pages
// ============================================================

function getCurrentBranch() {
  // From URL: /tree/{branch} or /blob/{branch}/file
  const urlMatch = location.pathname.match(/\/kapture-cx\/kapture-vitos-ui\/(?:tree|blob)\/(.+?)(?:\/|$)/);
  if (urlMatch) return decodeURIComponent(urlMatch[1]);

  // Fallback: read the branch selector button (has octicon-git-branch SVG)
  const branchBtn = [...document.querySelectorAll('button')].find(btn =>
    btn.querySelector('svg.octicon-git-branch')
  );
  if (branchBtn) {
    const label = branchBtn.querySelector('[data-component="text"], .prc-Button-Label-FWkx3, .css-truncate-target');
    if (label) return label.textContent.trim();
  }

  return null;
}

function injectRaisePRButton() {
  if (!location.pathname.includes(`/${REPO}`)) return;
  if (document.getElementById('kpr-raise-btn')) return;

  // Target: ul.pagehead-actions — Watch/Fork/Star row (stable, present in initial HTML)
  const actionsList = document.querySelector('ul.pagehead-actions');
  if (!actionsList) return;

  const branch = getCurrentBranch();
  if (!branch) return;

  // Inject styles once
  if (!document.getElementById('kpr-styles')) {
    const style = document.createElement('style');
    style.id = 'kpr-styles';
    style.textContent = `
      #kpr-raise-btn {
        margin-left: 8px;
        padding: 5px 14px;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        vertical-align: middle;
        transition: transform 0.15s, box-shadow 0.15s;
        white-space: nowrap;
      }
      #kpr-raise-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 14px rgba(168, 85, 247, 0.5);
      }
      #kpr-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #kpr-modal {
        background: #ffffff;
        border-radius: 10px;
        padding: 24px 28px;
        min-width: 340px;
        box-shadow: 0 10px 36px rgba(0, 0, 0, 0.28);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #1a1a1a;
      }
      #kpr-modal h3 {
        margin: 0 0 18px;
        font-size: 16px;
        font-weight: 700;
        color: #1a1a2e;
      }
      .kpr-field {
        margin-bottom: 16px;
      }
      .kpr-label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #666;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }
      .kpr-from-input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        font-size: 13px;
        background: #f6f8fa;
        color: #444;
        box-sizing: border-box;
        font-family: 'SFMono-Regular', Consolas, monospace;
      }
      .kpr-checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .kpr-checkbox-label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;
        text-transform: none;
        letter-spacing: 0;
        cursor: pointer;
        padding: 8px 10px;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        transition: background 0.15s, border-color 0.15s;
      }
      .kpr-checkbox-label:hover {
        background: #f6f0ff;
        border-color: #a855f7;
      }
      .kpr-checkbox-label input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #7c3aed;
        flex-shrink: 0;
      }
      .kpr-branch-name {
        font-family: 'SFMono-Regular', Consolas, monospace;
        font-size: 13px;
      }
      .kpr-search-input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        font-size: 13px;
        background: #fff;
        color: #1a1a1a;
        box-sizing: border-box;
        margin-top: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        outline: none;
      }
      .kpr-search-input:focus {
        border-color: #a855f7;
        box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
      }
      .kpr-branch-results {
        margin-top: 4px;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        max-height: 180px;
        overflow-y: auto;
        background: #fff;
        display: none;
      }
      .kpr-branch-results:not(:empty) {
        display: block;
      }
      .kpr-result-item {
        padding: 8px 10px;
        cursor: pointer;
        font-size: 13px;
        font-family: 'SFMono-Regular', Consolas, monospace;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.1s;
      }
      .kpr-result-item:last-child { border-bottom: none; }
      .kpr-result-item:hover { background: #f6f0ff; }
      .kpr-result-msg {
        padding: 10px;
        font-size: 13px;
        color: #888;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #kpr-submit {
        width: 100%;
        padding: 10px;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        margin-top: 4px;
        transition: opacity 0.2s;
      }
      #kpr-submit:hover { opacity: 0.9; }
      #kpr-cancel {
        width: 100%;
        padding: 8px;
        background: transparent;
        color: #666;
        border: 1px solid #d0d7de;
        border-radius: 6px;
        font-size: 13px;
        cursor: pointer;
        margin-top: 8px;
      }
      #kpr-cancel:hover { background: #f6f8fa; }
    `;
    document.head.appendChild(style);
  }

  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.id = 'kpr-raise-btn';
  btn.textContent = '⚡ Raise PR';
  btn.title = 'Create Pull Requests for this branch';
  btn.addEventListener('click', () => showModal(branch));
  li.appendChild(btn);
  actionsList.insertBefore(li, actionsList.firstChild);
}

function showModal(branch) {
  if (document.getElementById('kpr-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'kpr-overlay';

  overlay.innerHTML = `
    <div id="kpr-modal">
      <h3>⚡ Raise Pull Request</h3>
      <div class="kpr-field">
        <span class="kpr-label">From (source branch)</span>
        <input class="kpr-from-input" type="text" value="${branch}" readonly />
      </div>
      <div class="kpr-field">
        <span class="kpr-label">To (target branches)</span>
        <div class="kpr-checkbox-group" id="kpr-checkbox-group">
          ${TARGET_BRANCHES.map(b => `
            <label class="kpr-checkbox-label">
              <input type="checkbox" value="${b}" checked />
              <span class="kpr-branch-name">${b}</span>
            </label>
          `).join('')}
        </div>
        <input class="kpr-search-input" id="kpr-branch-search" type="text" placeholder="Search branches..." autocomplete="off" />
        <div class="kpr-branch-results" id="kpr-branch-results"></div>
      </div>
      <button id="kpr-submit">Create PRs</button>
      <button id="kpr-cancel">Cancel</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Branch search
  const searchInput = overlay.querySelector('#kpr-branch-search');
  const resultsDiv  = overlay.querySelector('#kpr-branch-results');
  const checkboxGroup = overlay.querySelector('#kpr-checkbox-group');
  let searchTimer = null;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const query = searchInput.value.trim();
    if (!query) { resultsDiv.innerHTML = ''; return; }
    resultsDiv.innerHTML = '<div class="kpr-result-msg">Searching…</div>';
    searchTimer = setTimeout(() => fetchBranches(query), 300);
  });

  searchInput.addEventListener('blur', () => {
    setTimeout(() => { resultsDiv.innerHTML = ''; }, 200);
  });

  async function fetchBranches(query) {
    try {
      const res = await fetch(
        `https://github.com/${REPO}/branches/all?query=${encodeURIComponent(query)}`,
        { headers: { 'accept': 'application/json', 'x-react-router': 'json', 'x-requested-with': 'XMLHttpRequest' } }
      );
      const data = await res.json();
      const branches = data?.payload?.branches || [];
      renderResults(branches);
    } catch {
      resultsDiv.innerHTML = '<div class="kpr-result-msg">Failed to fetch branches</div>';
    }
  }

  function renderResults(branches) {
    if (!branches.length) {
      resultsDiv.innerHTML = '<div class="kpr-result-msg">No branches found</div>';
      return;
    }
    resultsDiv.innerHTML = branches
      .map(b => `<div class="kpr-result-item" data-name="${b.name.replace(/"/g, '&quot;')}">${b.name}</div>`)
      .join('');

    resultsDiv.querySelectorAll('.kpr-result-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent blur from hiding results before click fires
        const name = item.dataset.name;
        // If already in the list, just check it
        const existing = [...checkboxGroup.querySelectorAll('input[type="checkbox"]')]
          .find(cb => cb.value === name);
        if (existing) {
          existing.checked = true;
        } else {
          const label = document.createElement('label');
          label.className = 'kpr-checkbox-label';
          label.innerHTML = `
            <input type="checkbox" value="${name.replace(/"/g, '&quot;')}" checked />
            <span class="kpr-branch-name">${name}</span>
          `;
          checkboxGroup.appendChild(label);
        }
        searchInput.value = '';
        resultsDiv.innerHTML = '';
      });
    });
  }

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.getElementById('kpr-cancel').addEventListener('click', () => overlay.remove());

  document.getElementById('kpr-submit').addEventListener('click', () => {
    const selected = [...overlay.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
    if (selected.length === 0) {
      alert('Please select at least one target branch.');
      return;
    }
    selected.forEach(target => {
      window.open(
        `https://github.com/${REPO}/compare/${target}...${branch}`,
        '_blank'
      );
    });
    overlay.remove();
  });
}

// ============================================================
// Init & SPA navigation support (GitHub uses Turbo navigation)
// ============================================================

let lastUrl = location.href;

function init() {
  injectRaisePRButton();
}

init();

const navObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    init();
  } else if (!document.getElementById('kpr-raise-btn')) {
    // Re-inject if GitHub re-rendered the toolbar (e.g., lazy load)
    injectRaisePRButton();
  }
});

navObserver.observe(document.body, { childList: true, subtree: true });
