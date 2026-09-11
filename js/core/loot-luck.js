const LOOT_LUCK_STORAGE_KEY = "majestic-loot-luck";
const LOOT_LUCK_DEFAULT = 0;
const LOOT_LUCK_EVENT = "majestic-loot-luck-change";

function readLootLuck() {
  try {
    const n = parseFloat(window.localStorage.getItem(LOOT_LUCK_STORAGE_KEY));
    return isNaN(n) || n < 0 ? LOOT_LUCK_DEFAULT : n;
  } catch {
    return LOOT_LUCK_DEFAULT;
  }
}

function writeLootLuck(value) {
  try {
    window.localStorage.setItem(LOOT_LUCK_STORAGE_KEY, String(value));
  } catch {}
}

let currentLootLuck = readLootLuck();

function getLootLuck() {
  return currentLootLuck;
}

function updateLootLuckInputs(value) {
  document.querySelectorAll("[data-loot-luck-input]").forEach((el) => {
    if (document.activeElement !== el) el.value = value;
  });
}

function setLootLuck(value) {
  const n = Math.max(0, Number(value) || 0);
  currentLootLuck = n;
  writeLootLuck(n);
  updateLootLuckInputs(n);
  document.dispatchEvent(
    new CustomEvent(LOOT_LUCK_EVENT, { detail: { value: n } }),
  );
}

function lootLuckBadge(boosted) {
  return boosted
    ? '<span class="ll-star" title="Eligible for Loot Luck boost">✦</span>'
    : "";
}

function bindLootLuckControls(root) {
  root.querySelectorAll("[data-loot-luck-input]").forEach((input) => {
    input.value = currentLootLuck;
    input.addEventListener("input", () => setLootLuck(input.value));
    input.addEventListener("change", () => setLootLuck(input.value));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
    });
  });
  root.querySelectorAll("[data-loot-luck-reset]").forEach((btn) => {
    btn.addEventListener("click", () => setLootLuck(LOOT_LUCK_DEFAULT));
  });
}

window.MajesticLootLuck = {
  get: getLootLuck,
  set: setLootLuck,
  badge: lootLuckBadge,
  bind: bindLootLuckControls,
  EVENT: LOOT_LUCK_EVENT,
};
