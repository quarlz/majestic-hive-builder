function navigationHtml(basePath) {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  return window.WikiPages.map(page => `<a href="${basePath}${page.href}"${current === page.href ? ' aria-current="page"' : ''}>${page.title}</a>`).join('');
}

const PRIDE_MODE_STORAGE_KEY = "majestic-pride-mode";

function readPrideMode() {
  try {
    return window.localStorage.getItem(PRIDE_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writePrideMode(enabled) {
  try {
    window.localStorage.setItem(PRIDE_MODE_STORAGE_KEY, enabled ? "1" : "0");
  } catch {}
}

function bindLootLuckWhenReady(root) {
  window.MajesticLootLuck.bind(root);
}

function isJune() {
  return new Date().getMonth() === 5;
}

function updatePrideToggleButtons(enabled) {
  const june = isJune();
  const label = enabled ? "Pride Mode: On" : "Pride Mode: Off";

  document.querySelectorAll("[data-pride-toggle]").forEach((button) => {
    button.style.display = june ? "" : "none";
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.textContent = label;
  });
}

function applyPrideMode(enabled, persist = true) {
  if (!isJune() && enabled) {
    document.documentElement.classList.remove("pride-mode");
    document.documentElement.dataset.prideMode = "off";
    updatePrideToggleButtons(false);
    if (persist) writePrideMode(false);
    return;
  }

  document.documentElement.classList.toggle("pride-mode", enabled);
  document.documentElement.dataset.prideMode = enabled ? "on" : "off";
  updatePrideToggleButtons(enabled);

  if (persist) writePrideMode(enabled);
}

function togglePrideMode() {
  applyPrideMode(!document.documentElement.classList.contains("pride-mode"));
}

applyPrideMode(readPrideMode(), false);

function getBasePath() {
  const { pathname } = window.location;

  if (pathname.endsWith("/")) {
    return pathname;
  }

  const lastSegment = pathname.split("/").pop();

  if (lastSegment.endsWith(".html") || lastSegment.endsWith(".htm")) {
    return pathname.slice(0, pathname.lastIndexOf("/") + 1);
  }

  return `${pathname}/`;
}

function lootLuckControlHtml(idSuffix) {
  return `
    <div class="ll-widget" data-pagefind-ignore>
      <div class="ll-widget-head">
        <span class="ll-widget-title"><span class="ll-widget-star">✦</span>Loot Luck</span>
        <button
          type="button"
          class="ll-widget-reset"
          data-loot-luck-reset
          title="Reset to 0%"
          aria-label="Reset Loot Luck"
        >
          ↺
        </button>
      </div>
      <div class="ll-widget-controls">
        <input
          type="number"
          id="loot-luck-input-${idSuffix}"
          class="ll-widget-input"
          data-loot-luck-input
          min="0"
          step="1"
          inputmode="numeric"
          aria-label="Loot Luck value in percent"
        />
        <span class="ll-widget-suffix">%</span>
      </div>
      <div class="ll-widget-note">Increases the chance of drops with a base chance < 5%.</div>
    </div>
  `;
}

function loadSidebar() {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  const basePath = getBasePath();

  const sidebarHTML = `
    <div class="sidebar" data-pagefind-ignore>
      <a class="sidebar-logo" href="${basePath}hive-builder.html">
        <img src="${basePath}images/ui/site-logo.png" alt="" decoding="async" />
      </a>
      ${lootLuckControlHtml("desktop")}
${navigationHtml(basePath)}
      <button type="button" class="sidebar-theme-button" data-pride-toggle aria-pressed="false">
        Pride Mode: Off
      </button>
    </div>
  `;

  container.innerHTML = sidebarHTML;
  bindPrideToggleButtons(container);
  bindLootLuckWhenReady(container);
  createMobileSheet && createMobileSheet(basePath);
  updatePrideToggleButtons(readPrideMode());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSidebar);
} else {
  loadSidebar();
}

function createMobileSheet(basePath) {
  if (document.getElementById("mobile-bottom-sheet")) return;

  const linksHtml = `
    <div class="mobile-sheet-inner">
      <a class="sidebar-logo" href="${basePath}hive-builder.html">
        <img src="${basePath}images/ui/site-logo.png" alt="" decoding="async" />
      </a>
      ${lootLuckControlHtml("mobile")}
${navigationHtml(basePath)}
      <button type="button" class="sidebar-theme-button sidebar-theme-button--mobile" data-pride-toggle aria-pressed="false">
        Pride Mode: Off
      </button>
    </div>
  `;

  const button = document.createElement("button");
  button.id = "mobile-sidebar-button";
  button.className = "mobile-sidebar-button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", "Open menu");
  button.innerHTML = "&#9776;";
  document.body.appendChild(button);

  const backdrop = document.createElement("div");
  backdrop.id = "mobile-sheet-backdrop";
  backdrop.className = "mobile-sheet-backdrop";
  document.body.appendChild(backdrop);

  const sheet = document.createElement("div");
  sheet.id = "mobile-bottom-sheet";
  sheet.className = "mobile-bottom-sheet";
  sheet.innerHTML =
    '<div class="mobile-sheet-handle" aria-hidden="true"></div>' + linksHtml;
  document.body.appendChild(sheet);

  function openSheet() {
    sheet.classList.add("open");
    backdrop.classList.add("show");
    button.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
  }

  function closeSheet() {
    sheet.classList.remove("open");
    backdrop.classList.remove("show");
    button.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
  }

  button.addEventListener("click", function () {
    if (sheet.classList.contains("open")) closeSheet();
    else openSheet();
  });

  backdrop.addEventListener("click", closeSheet);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSheet();
  });

  sheet.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  bindPrideToggleButtons(sheet);
  bindLootLuckWhenReady(sheet);
}

function bindPrideToggleButtons(root) {
  root.querySelectorAll("[data-pride-toggle]").forEach((button) => {
    button.addEventListener("click", togglePrideMode);
  });
}
