const HB_COLUMNS = [11, 11, 11, 11, 11];
const HB_TOTAL_SLOTS = HB_COLUMNS.reduce((a, b) => a + b, 0);

const HB_STICKER_GROUPS = {
  top: 3,
  bottom: 3,
  left: 7,
  right: 7,
};
const HB_STICKER_SLOTS =
  HB_STICKER_GROUPS.top +
  HB_STICKER_GROUPS.bottom +
  HB_STICKER_GROUPS.left +
  HB_STICKER_GROUPS.right;

const HB_RARITY_VAR = {
  basic: "--r-basic",
  rare: "--r-rare",
  epic: "--r-epic",
  legendary: "--r-legendary",
  mythic: "--r-mythic",
  special: "--r-special",
  limited: "--r-limited",
  exclusive: "--r-exclusive",
};

const HB_RARITY_RGB = {
  basic: [168, 121, 79],
  rare: [196, 200, 212],
  epic: [232, 192, 64],
  legendary: [100, 181, 246],
  mythic: [206, 147, 216],
  special: [122, 184, 96],
  limited: [
    [80, 140, 245],
    [170, 90, 230],
  ],
  exclusive: [41, 217, 140],
};

function hbIsGradientRarity(rgb) {
  return Array.isArray(rgb[0]);
}

const HB_DARK_MIX = [28, 20, 0];

let hbBees = [];
let hbStickers = [];
let hbCosmetics = [];
let hbStatDefs = [];

let hbBadges = [];
let hbBadgeTiers = {};

const HB_AMULET_SLOT_COUNT = 5;
let hbAmulets = [];
let hbAmuletSlots = Array.from({ length: HB_AMULET_SLOT_COUNT }, () => ({
  key: null,
  selections: {},
}));
let hbAmuletModalSlotIndex = null;
let hbAmuletModalStep = "pick"; // "pick" | "configure"

const HB_EQUIP_SLOT_DEFS = [
  { key: "collectors", label: "Collector" },
  { key: "bags", label: "Bag" },
  { key: "belts", label: "Belt" },
  { key: "helmets", label: "Helmet" },
  { key: "leftGuards", label: "Left Guard" },
  { key: "rightGuards", label: "Right Guard" },
  { key: "gloves", label: "Gloves" },
  { key: "boots", label: "Boots" },
  { key: "hydrants", label: "Hydrant" },
];
const HB_EQUIP_SLOT_COUNT = HB_EQUIP_SLOT_DEFS.length;
let hbEquipment = {};
let hbEquipSlots = Array.from({ length: HB_EQUIP_SLOT_COUNT }, () => ({
  item: null,
}));
let hbEquipModalSlotIndex = null;
let hbEquipModalStep = "pick"; // "pick" | "configure"
let hbSlots = Array.from({ length: HB_TOTAL_SLOTS }, () => ({
  bee: null,
  shiny: false,
}));
let hbStickerSlots = Array.from({ length: HB_STICKER_SLOTS }, () => ({
  sticker: null,
}));
let hbSelectedBee = null;
let hbSelectedSticker = null;

function hbEsc(str) {
  if (typeof escHtml === "function") return escHtml(str);
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function hbFaceIcon(bee) {
  const raw = bee.icon || bee.image || "";
  const base = raw.split("/").pop();
  return base ? `images/bee-faces/${base}` : "images/ui/site-logo.png";
}

function hbGetBee(name) {
  return hbBees.find((b) => b.name === name) || null;
}

function hbGetSticker(name) {
  return hbStickers.find((s) => s.name === name) || null;
}

async function hbLoadData() {
  const [beesRes, stickersRes, cosmeticsRes, badgesRes, amuletsRes, equipmentsRes, statsRes] = await Promise.all([
    WikiData.response("data/bees.json"),
    WikiData.response("data/stickers.json"),
    WikiData.response("data/cosmetics.json"),
    WikiData.response("data/badges.json"),
    WikiData.response("data/amulets.json"),
    WikiData.response("data/equipments.json"),
    WikiData.response("data/stats.json"),
  ]);
  const beesData = await beesRes.json();
  const stickersData = await stickersRes.json();
  const cosmeticsData = await cosmeticsRes.json();
  const badgesData = await badgesRes.json();
  const amuletsData = await amuletsRes.json();
  const equipmentsData = await equipmentsRes.json();
  const statsData = await statsRes.json();

  hbBees = Array.isArray(beesData) ? beesData : Object.values(beesData);
  hbStickers = Array.isArray(stickersData) ? stickersData : [];
  hbCosmetics = Array.isArray(cosmeticsData) ? cosmeticsData : [];
  hbBadges = (Array.isArray(badgesData) ? badgesData : []).slice().sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );
  hbAmulets = Array.isArray(amuletsData) ? amuletsData : [];
  hbEquipment =
    equipmentsData && typeof equipmentsData === "object" && !Array.isArray(equipmentsData)
      ? equipmentsData
      : {};
  hbStatDefs = Array.isArray(statsData) ? statsData : [];
}

function hbApplyRarityStyle(card, rarity) {
  const rarityKey = (rarity || "").toLowerCase();
  const rgb = HB_RARITY_RGB[rarityKey] || HB_RARITY_RGB.basic;

  if (hbIsGradientRarity(rgb)) {
    const c1bg = hbMixRgb(rgb[0], HB_DARK_MIX, 0.45);
    const c2bg = hbMixRgb(rgb[1], HB_DARK_MIX, 0.45);
    const c1border = hbMixRgb(rgb[0], HB_DARK_MIX, 0.7);
    const c2border = hbMixRgb(rgb[1], HB_DARK_MIX, 0.7);
    card.style.background = `linear-gradient(135deg, ${c1bg}, ${c2bg})`;
    card.style.borderColor = c2border;
    card.style.borderImage = `linear-gradient(135deg, ${c1border}, ${c2border}) 1`;
  } else {
    card.style.borderImage = "none";
    card.style.background = hbMixRgb(rgb, HB_DARK_MIX, 0.45);
    card.style.borderColor = hbMixRgb(rgb, HB_DARK_MIX, 0.7);
  }
}

function hbBuildPalettes() {
  const beeList = document.getElementById("hb-bee-list");
  beeList.innerHTML = "";
  hbBees.forEach((bee) => {
    const card = document.createElement("div");
    card.className = "hb-card";
    card.draggable = true;
    card.dataset.bee = bee.name;
    card.title = bee.name;
    hbApplyRarityStyle(card, bee.rarity);

    const img = document.createElement("img");
    img.src = bee.icon || "images/ui/site-logo.png";
    img.alt = bee.name;
    img.onerror = () => {
      img.onerror = null;
      img.src = "images/ui/site-logo.png";
    };
    const span = document.createElement("span");
    span.textContent = bee.name.replace(/\s*Bee$/, "");

    card.appendChild(img);
    card.appendChild(span);

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("application/x-bee", bee.name);
      e.dataTransfer.effectAllowed = "copy";
    });

    card.addEventListener("click", () => {
      const isSame = hbSelectedBee === bee.name;
      document
        .querySelectorAll("#hb-bee-list .hb-card")
        .forEach((c) => c.classList.remove("hb-card-selected"));
      hbSelectedBee = isSame ? null : bee.name;
      if (hbSelectedBee) card.classList.add("hb-card-selected");
    });

    beeList.appendChild(card);
  });

  const stickerList = document.getElementById("hb-sticker-list");
  stickerList.innerHTML = "";
  hbStickers.forEach((sticker) => {
    const card = document.createElement("div");
    card.className = "hb-card";
    card.draggable = true;
    card.dataset.sticker = sticker.name;
    card.title = sticker.name;
    hbApplyRarityStyle(card, sticker.rarity);

    const img = document.createElement("img");
    img.src = sticker.image || "images/ui/site-logo.png";
    img.alt = sticker.name;
    img.onerror = () => {
      img.onerror = null;
      img.src = "images/ui/site-logo.png";
    };
    const span = document.createElement("span");
    span.textContent = sticker.name.replace(/\s*Sticker$/, "");

    card.appendChild(img);
    card.appendChild(span);

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("application/x-sticker", sticker.name);
      e.dataTransfer.effectAllowed = "copy";
    });

    card.addEventListener("click", () => {
      const isSame = hbSelectedSticker === sticker.name;
      document
        .querySelectorAll("#hb-sticker-list .hb-card")
        .forEach((c) => c.classList.remove("hb-card-selected"));
      hbSelectedSticker = isSame ? null : sticker.name;
      if (hbSelectedSticker) card.classList.add("hb-card-selected");
    });

    stickerList.appendChild(card);
  });
}

const HB_HEX_POINTS = "25,0 75,0 100,50 75,100 25,100 0,50";
const SVG_NS = "http://www.w3.org/2000/svg";

function hbCreateHexSvg() {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "hb-hex-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");

  const poly = document.createElementNS(SVG_NS, "polygon");
  poly.setAttribute("class", "hb-hex-poly");
  poly.setAttribute("points", HB_HEX_POINTS);

  svg.appendChild(poly);
  return { svg, poly };
}

function hbBuildGrid() {
  const grid = document.getElementById("hb-hive-grid");
  grid.innerHTML = "";
  let index = 0;

  HB_COLUMNS.forEach((height, col) => {
    const colEl = document.createElement("div");
    colEl.className = "hb-hive-col";

    for (let row = 0; row < height; row++) {
      const slotIndex = index++;
      const hex = document.createElement("div");
      hex.className = "hb-hex hb-hex-empty";
      hex.dataset.index = String(slotIndex);
      hex.setAttribute("role", "button");
      hex.setAttribute("aria-label", `Hive slot ${slotIndex + 1}`);

      const { svg, poly } = hbCreateHexSvg();
      hex.appendChild(svg);

      poly.addEventListener("dragover", (e) => {
        e.preventDefault();
        hex.classList.add("hb-drop-hover");
      });
      poly.addEventListener("dragleave", () => {
        hex.classList.remove("hb-drop-hover");
      });
      poly.addEventListener("drop", (e) => {
        e.preventDefault();
        hex.classList.remove("hb-drop-hover");
        const beeName = e.dataTransfer.getData("application/x-bee");
        const moveFrom = e.dataTransfer.getData("application/x-hex-move");
        if (beeName) {
          hbSlots[slotIndex] = { bee: beeName, shiny: false };
          hbRenderGrid();
          hbRenderBonuses();
        } else if (moveFrom !== "") {
          const fromIndex = Number(moveFrom);
          if (fromIndex !== slotIndex) {
            const tmp = hbSlots[slotIndex];
            hbSlots[slotIndex] = hbSlots[fromIndex];
            hbSlots[fromIndex] = tmp;
            hbRenderGrid();
            hbRenderBonuses();
          }
        }
      });

      poly.addEventListener("click", () => {
        const slot = hbSlots[slotIndex];
        if (slot.bee) {
          slot.bee = null;
          slot.shiny = false;
        } else if (hbSelectedBee) {
          slot.bee = hbSelectedBee;
          slot.shiny = false;
        } else {
          return;
        }
        hbRenderGrid();
        hbRenderBonuses();
      });

      colEl.appendChild(hex);
    }
    grid.appendChild(colEl);
  });

  hbRenderGrid();
}

function hbRenderGrid() {
  const grid = document.getElementById("hb-hive-grid");
  const hexes = grid.querySelectorAll(".hb-hex");
  hexes.forEach((hex) => {
    const index = Number(hex.dataset.index);
    const slot = hbSlots[index];
    const poly = hex.querySelector(".hb-hex-poly");

    hex.classList.remove("hb-hex-shiny");
    hex.draggable = false;
    hex
      .querySelectorAll(".hb-hex-face, .hb-hex-star, .hb-hex-plus")
      .forEach((el) => el.remove());

    if (!slot.bee) {
      hex.classList.add("hb-hex-empty");
      hex.classList.remove("hb-hex-filled");
      poly.style.fill = "#2a2010";
      const plus = document.createElement("span");
      plus.className = "hb-hex-plus";
      plus.textContent = "+";
      hex.appendChild(plus);
      return;
    }

    hex.classList.remove("hb-hex-empty");
    hex.classList.add("hb-hex-filled");
    hex.draggable = true;

    hex.ondragstart = (e) => {
      e.dataTransfer.setData("application/x-hex-move", String(index));
      e.dataTransfer.effectAllowed = "move";
    };

    const bee = hbGetBee(slot.bee);
    if (!bee) return;

    const rarityKey = (bee.rarity || "").toLowerCase();
    const rgb = HB_RARITY_RGB[rarityKey] || HB_RARITY_RGB.basic;
    if (hbIsGradientRarity(rgb)) {
      const c1 = hbMixRgb(rgb[0], HB_DARK_MIX, 0.9);
      const c2 = hbMixRgb(rgb[1], HB_DARK_MIX, 0.9);
      poly.style.fill = "url(#hb-grad-" + hex.dataset.index + ")";
      hbEnsurePolyGradient(hex, index, c1, c2);
    } else {
      poly.style.fill = hbMixRgb(rgb, HB_DARK_MIX, 0.9);
    }
    const img = document.createElement("img");
    img.className = "hb-hex-face";
    img.src = hbFaceIcon(bee);
    img.alt = bee.name;
    img.onerror = () => {
      img.onerror = null;
      img.src = "images/ui/site-logo.png";
    };
    hex.appendChild(img);

    const star = document.createElement("button");
    star.type = "button";
    star.className = "hb-hex-star" + (slot.shiny ? " hb-star-active" : "");
    star.innerHTML = "★";
    star.setAttribute("aria-label", "Toggle shiny");
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      slot.shiny = !slot.shiny;
      hbRenderGrid();
      hbRenderBonuses();
    });
    hex.appendChild(star);

    if (slot.shiny) hex.classList.add("hb-hex-shiny");
  });

  hbUpdateCount();
}

function hbUpdateCount() {
  const filled = hbSlots.filter((s) => s.bee).length;
  document.getElementById("hb-count-value").textContent = String(filled);
  document.getElementById("hb-count-max").textContent = String(HB_TOTAL_SLOTS);
}

function hbStickerRanges() {
  const { top, bottom, left, right } = HB_STICKER_GROUPS;
  return {
    top: [0, top],
    bottom: [top, top + bottom],
    left: [top + bottom, top + bottom + left],
    right: [top + bottom + left, top + bottom + left + right],
  };
}

function hbBuildStickerSlot(index) {
  const el = document.createElement("div");
  el.className = "hb-sticker-slot";
  el.dataset.index = String(index);
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `Sticker slot ${index + 1}`);

  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.classList.add("hb-drop-hover");
  });
  el.addEventListener("dragleave", () => el.classList.remove("hb-drop-hover"));
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    el.classList.remove("hb-drop-hover");
    const name = e.dataTransfer.getData("application/x-sticker");
    const moveFrom = e.dataTransfer.getData("application/x-sticker-move");
    if (name) {
      hbStickerSlots[index] = { sticker: name };
      hbRenderStickerGrid();
      hbRenderBonuses();
    } else if (moveFrom !== "") {
      const fromIndex = Number(moveFrom);
      if (fromIndex !== index) {
        const tmp = hbStickerSlots[index];
        hbStickerSlots[index] = hbStickerSlots[fromIndex];
        hbStickerSlots[fromIndex] = tmp;
        hbRenderStickerGrid();
        hbRenderBonuses();
      }
    }
  });

  el.addEventListener("click", () => {
    const slot = hbStickerSlots[index];
    if (slot.sticker) {
      slot.sticker = null;
    } else if (hbSelectedSticker) {
      slot.sticker = hbSelectedSticker;
    } else {
      return;
    }
    hbRenderStickerGrid();
    hbRenderBonuses();
  });

  return el;
}

function hbBuildStickerFrame() {
  const ranges = hbStickerRanges();
  const groupEls = {
    top: document.getElementById("hb-sticker-top"),
    bottom: document.getElementById("hb-sticker-bottom"),
    left: document.getElementById("hb-sticker-left"),
    right: document.getElementById("hb-sticker-right"),
  };
  Object.keys(ranges).forEach((group) => {
    const [start, end] = ranges[group];
    groupEls[group].innerHTML = "";
    for (let i = start; i < end; i++) {
      groupEls[group].appendChild(hbBuildStickerSlot(i));
    }
  });
  document.getElementById("hb-sticker-max").textContent =
    String(HB_STICKER_SLOTS);
  hbRenderStickerGrid();
}

function hbRenderStickerGrid() {
  const slotsEls = document.querySelectorAll(".hb-sticker-slot");
  slotsEls.forEach((el) => {
    const index = Number(el.dataset.index);
    const slot = hbStickerSlots[index];
    el.innerHTML = "";
    el.draggable = false;
    el.classList.remove("hb-sticker-slot-filled");

    if (!slot.sticker) return;
    const sticker = hbGetSticker(slot.sticker);
    if (!sticker) return;

    el.classList.add("hb-sticker-slot-filled");
    el.draggable = true;
    el.ondragstart = (e) => {
      e.dataTransfer.setData("application/x-sticker-move", String(index));
      e.dataTransfer.effectAllowed = "move";
    };

    const img = document.createElement("img");
    img.src = sticker.image || "images/ui/site-logo.png";
    img.alt = sticker.name;
    img.onerror = () => {
      img.onerror = null;
      img.src = "images/ui/site-logo.png";
    };
    el.appendChild(img);
    el.title = sticker.name;
  });

  const filled = hbStickerSlots.filter((s) => s.sticker).length;
  document.getElementById("hb-sticker-count").textContent = String(filled);
}

function hbInitTrash() {
  const trash = document.getElementById("hb-trash");
  trash.addEventListener("dragover", (e) => {
    e.preventDefault();
    trash.classList.add("hb-trash-active");
  });
  trash.addEventListener("dragleave", () =>
    trash.classList.remove("hb-trash-active"),
  );
  trash.addEventListener("drop", (e) => {
    e.preventDefault();
    trash.classList.remove("hb-trash-active");
    const hexMove = e.dataTransfer.getData("application/x-hex-move");
    const stickerMove = e.dataTransfer.getData("application/x-sticker-move");
    if (hexMove !== "") {
      hbSlots[Number(hexMove)] = { bee: null, shiny: false };
      hbRenderGrid();
      hbRenderBonuses();
    } else if (stickerMove !== "") {
      hbStickerSlots[Number(stickerMove)] = { sticker: null };
      hbRenderStickerGrid();
      hbRenderBonuses();
    }
  });
}

function hbFormatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  const rounded = Math.round(num * 100) / 100;
  const isInt = Number.isInteger(rounded);
  return rounded.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: isInt ? 0 : 2,
  });
}

function hbFormatBonus(type, value) {
  const num = Math.round(Number(value));

  if (type === "Perc") return `${hbFormatNumber(num)}%`;
  return hbFormatNumber(num);
}

function hbGetGiftBonusEntries() {
  const seen = new Set();
  const entries = [];
  hbSlots.forEach((slot) => {
    if (!slot.bee || !slot.shiny) return;
    if (seen.has(slot.bee)) return;
    seen.add(slot.bee);
    const bee = hbGetBee(slot.bee);
    if (bee && bee.shinyBonus) entries.push({ ...bee.shinyBonus });
  });
  return entries;
}

function hbGetStickerBonusEntries() {
  const seen = new Set();
  const entries = [];
  hbStickerSlots.forEach((slot) => {
    if (!slot.sticker) return;
    if (seen.has(slot.sticker)) return;
    seen.add(slot.sticker);
    const sticker = hbGetSticker(slot.sticker);
    if (sticker && Array.isArray(sticker.buffs)) {
      sticker.buffs.forEach((b) => entries.push({ ...b }));
    }
  });
  return entries;
}

function hbGetDefaultStats() {
  // Baseline metric objects come from the static data/stats.json file,
  // which lists every trackable stat along with its type (Perc, Mult,
  // Add, Raw) and baseline value.
  return hbStatDefs.map((s) => ({ ...s }));
}

function hbGetStatDef(stat) {
  return hbStatDefs.find((s) => s.stat === stat) || null;
}

function hbRenderBonusTable(tbodyId, entries, emptyMsg) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!entries.length) {
    tbody.innerHTML = `<tr><td colspan="2" class="hb-bonus-empty">${hbEsc(emptyMsg)}</td></tr>`;
    return;
  }
  tbody.innerHTML = entries
    .map(
      (e) =>
        `<tr><td>${hbEsc(e.stat)}</td><td>${hbEsc(hbFormatBonus(e.type, e.value))}</td></tr>`,
    )
    .join("");
}

const HB_TIER_LABELS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function hbBadgeBuffValue(badge, tier) {
  const { type, value } = badge.buff;
  return type === "Mult" ? 1 + value * tier : value * tier;
}

function hbBadgeBuffText(badge, tier) {
  if (!tier || !badge.buff) return "—";
  const { stat, type, value } = badge.buff;
  if (type === "Mult")
    return `x${(1 + value * tier).toFixed(2).replace(/\.00$/, "")} ${stat}`;
  if (type === "Perc") return `+${hbFormatNumber(value * tier)}% ${stat}`;
  return `+${hbFormatNumber(value * tier)} ${stat}`;
}

function hbTierPipsHtml(tier) {
  return Array.from({ length: 10 }, (_, i) => i)
    .map(
      (i) =>
        `<span class="hb-tier-pip${i < tier ? " hb-tier-pip-active" : ""}"></span>`,
    )
    .join("");
}

function hbBuildBadges() {
  const list = document.getElementById("hb-badge-list");
  if (!list) return;
  list.innerHTML = hbBadges
    .map((badge) => {
      const tier = hbBadgeTiers[badge.id] || 0;
      const progress = tier / 10;
      const options = Array.from({ length: 11 }, (_, i) => i)
        .map(
          (t) =>
            `<option value="${t}"${t === tier ? " selected" : ""}>${
              t === 0 ? "None" : `Tier ${HB_TIER_LABELS[t - 1]}`
            }</option>`,
        )
        .join("");
      return `<div class="hb-badge-card${tier ? " hb-badge-card-active" : ""}" data-badge-id="${hbEsc(badge.id)}" style="--badge-progress:${progress};">
        <div class="hb-badge-card-top">
          <span class="hb-badge-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 2l2.39 4.84 5.34.78-3.87 3.77.92 5.32L12 14.27l-4.78 2.44.92-5.32-3.87-3.77 5.34-.78L12 2z"/></svg>
          </span>
          <div class="hb-badge-card-name">${hbEsc(badge.name)}</div>
        </div>
        <select class="hb-badge-select" data-badge-id="${hbEsc(badge.id)}">${options}</select>
        <div class="hb-tier-pips" aria-hidden="true">${hbTierPipsHtml(tier)}</div>
        <div class="hb-badge-bonus">${hbEsc(hbBadgeBuffText(badge, tier))}</div>
      </div>`;
    })
    .join("");
  const chip = document.getElementById("hb-badge-count-chip");
  if (chip) {
    const active = Object.keys(hbBadgeTiers).filter((id) => hbBadgeTiers[id]).length;
    chip.textContent = `${active} active`;
  }
}

function hbInitBadges() {
  const list = document.getElementById("hb-badge-list");
  if (list) {
    list.addEventListener("change", (e) => {
      const sel = e.target.closest(".hb-badge-select");
      if (!sel) return;
      const id = sel.dataset.badgeId;
      const tier = Number(sel.value) || 0;
      if (tier) hbBadgeTiers[id] = tier;
      else delete hbBadgeTiers[id];

      const badge = hbBadges.find((b) => b.id === id);
      const card = sel.closest(".hb-badge-card");
      if (card) {
        card.classList.toggle("hb-badge-card-active", !!tier);
        card.style.setProperty("--badge-progress", String(tier / 10));
        const bonusEl = card.querySelector(".hb-badge-bonus");
        if (bonusEl && badge) bonusEl.textContent = hbBadgeBuffText(badge, tier);
        const pipsEl = card.querySelector(".hb-tier-pips");
        if (pipsEl) pipsEl.innerHTML = hbTierPipsHtml(tier);
      }
      const chip = document.getElementById("hb-badge-count-chip");
      if (chip) {
        const active = Object.keys(hbBadgeTiers).filter((bid) => hbBadgeTiers[bid]).length;
        chip.textContent = `${active} active`;
      }

      hbRenderBonuses();
    });
  }

  const resetBtn = document.getElementById("hb-badge-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      hbBadgeTiers = {};
      hbBuildBadges();
      hbRenderBonuses();
    });
  }
}

function hbAmuletImage(amulet, variant) {
  return (variant && variant.image) || amulet.image;
}

function hbAmuletKey(amuletId, rarity) {
  return `${amuletId}::${rarity}`;
}

function hbFindAmuletVariant(key) {
  if (!key) return null;
  const sep = key.indexOf("::");
  if (sep === -1) return null;
  const id = key.slice(0, sep);
  const rarity = key.slice(sep + 2);
  const amulet = hbAmulets.find((a) => a.id === id);
  if (!amulet) return null;
  const variant = (amulet.variants || []).find((v) => v.rarity === rarity);
  if (!variant) return null;
  return { amulet, variant };
}

function hbUsedAmuletIds(excludeIndex) {
  const used = new Set();
  hbAmuletSlots.forEach((slot, i) => {
    if (i === excludeIndex || !slot.key) return;
    const found = hbFindAmuletVariant(slot.key);
    if (found) used.add(found.amulet.id);
  });
  return used;
}

function hbAmuletRarityRgb(rarity) {
  const key = (rarity || "").toLowerCase();
  const rgb = HB_RARITY_RGB[key] || HB_RARITY_RGB.basic;
  return hbIsGradientRarity(rgb) ? rgb[0] : rgb;
}

function hbFormatAmuletRange(type, min, max) {
  const fmt = (v) => hbFormatNumber(v);
  const same = min === max;
  if (type === "Mult") {
    return same ? `x${fmt(min)}` : `x${fmt(min)}–x${fmt(max)}`;
  }
  if (type === "Perc") {
    return same ? `+${fmt(min)}%` : `+${fmt(min)}%–+${fmt(max)}%`;
  }
  return same ? `+${fmt(min)}` : `+${fmt(min)}–+${fmt(max)}`;
}

function hbAmuletValueStep(buf) {
  if (buf.type === "Mult") return 0.01;
  return Number.isInteger(buf.min) && Number.isInteger(buf.max) ? 1 : 0.01;
}

function hbClamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function hbAmuletDetailsHtml(amulet, variant, slotIndex, selections) {
  const [r, g, b] = hbAmuletRarityRgb(variant.rarity);
  const chipStyle = `color: rgb(${r},${g},${b}); background: rgba(${r},${g},${b},0.15); border-color: rgba(${r},${g},${b},0.4);`;
  const limit = variant.buffsAmount || 0;
  const pickedCount = Object.keys(selections).length;
  const rows = (variant.buffs || [])
    .map((buf, bi) => {
      const checked = Object.prototype.hasOwnProperty.call(selections, bi);
      const atLimit = !checked && pickedCount >= limit;
      const value = checked ? selections[bi] : buf.max;
      return `<tr class="${checked ? "hb-amulet-buff-row-checked" : ""}">
        <td class="hb-amulet-pick-cell">
          <input type="checkbox" class="hb-amulet-buff-check" data-buff-index="${bi}"${checked ? " checked" : ""}${atLimit ? " disabled" : ""}>
        </td>
        <td>${hbEsc(buf.stat)}</td>
        <td>${hbEsc(hbFormatAmuletRange(buf.type, buf.min, buf.max))}</td>
        <td>${hbEsc(buf.chance)}%</td>
        <td>
          <input type="number" class="hb-amulet-buff-value" data-buff-index="${bi}"
            min="${buf.min}" max="${buf.max}" step="${hbAmuletValueStep(buf)}"
            value="${value}"${checked ? "" : " disabled"}>
        </td>
      </tr>`;
    })
    .join("");
  return `<div class="hb-amulet-details">
      <img class="hb-amulet-img" src="${hbEsc(hbAmuletImage(amulet, variant))}" alt="${hbEsc(amulet.name)}" onerror="this.src='images/ui/site-logo.png'">
      <div class="hb-amulet-info">
        <div class="hb-amulet-name-row">
          <span class="hb-amulet-name">${hbEsc(amulet.name)}</span>
          <span class="hb-amulet-rarity" style="${chipStyle}">${hbEsc(variant.rarity)}</span>
        </div>
        <p class="hb-amulet-source">${hbEsc(variant.desc || amulet.source)}</p>
      </div>
    </div>
    <table class="hb-amulet-buffs">
      <tr><th></th><th>Stat</th><th>Range</th><th>Chance</th><th>Value</th></tr>
      ${rows}
    </table>
    <p class="hb-amulet-note">Pick up to ${hbEsc(limit)} buff${limit === 1 ? "" : "s"} &middot; <span class="hb-amulet-note-count">${pickedCount}/${hbEsc(limit)} picked</span>. Set the rolled value for each, up to its max.</p>`;
}

function hbBuildAmuletSlots() {
  const wrap = document.getElementById("hb-amulet-list");
  if (!wrap) return;
  wrap.innerHTML = hbAmuletSlots
    .map((slot, i) => {
      const found = hbFindAmuletVariant(slot.key);
      if (!found) {
        return `<div class="hb-amulet-slot hb-amulet-slot-empty" data-slot-index="${i}" role="button" tabindex="0" aria-label="Amulet slot ${i + 1}, empty. Click to equip an amulet.">
          <span class="hb-amulet-slot-plus">+</span>
          <span class="hb-amulet-slot-label">Slot ${i + 1}</span>
        </div>`;
      }
      const { amulet, variant } = found;
      const [r, g, b] = hbAmuletRarityRgb(variant.rarity);
      const picked = Object.keys(slot.selections).length;
      const limit = variant.buffsAmount || 0;
      return `<div class="hb-amulet-slot hb-amulet-slot-filled" data-slot-index="${i}" role="button" tabindex="0"
          style="--slot-r:${r}; --slot-g:${g}; --slot-b:${b};"
          aria-label="Amulet slot ${i + 1}, ${hbEsc(amulet.name)}. Click to edit.">
        <img src="${hbEsc(hbAmuletImage(amulet, variant))}" alt="" onerror="this.src='images/ui/site-logo.png'">
        <span class="hb-amulet-slot-badge">${picked}/${limit}</span>
        <button type="button" class="hb-amulet-slot-remove" data-remove-index="${i}" aria-label="Remove amulet from slot ${i + 1}">&times;</button>
        <span class="hb-amulet-slot-name">${hbEsc(amulet.name)}</span>
      </div>`;
    })
    .join("");
  const chip = document.getElementById("hb-amulet-count-chip");
  if (chip) {
    const filled = hbAmuletSlots.filter((s) => hbFindAmuletVariant(s.key)).length;
    chip.textContent = `${filled}/${HB_AMULET_SLOT_COUNT} equipped`;
  }
}

function hbEnsureAmuletModal() {
  if (document.getElementById("hb-amulet-modal")) return;
  const overlay = document.createElement("div");
  overlay.className = "hb-modal-overlay";
  overlay.id = "hb-amulet-modal";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="hb-modal" role="dialog" aria-modal="true" aria-labelledby="hb-amulet-modal-title">
      <div class="hb-modal-header">
        <span class="hb-modal-title" id="hb-amulet-modal-title">Choose an Amulet</span>
        <button type="button" class="hb-modal-close" id="hb-amulet-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="hb-modal-body" id="hb-amulet-modal-body"></div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hbCloseAmuletModal();
  });
  document
    .getElementById("hb-amulet-modal-close")
    .addEventListener("click", hbCloseAmuletModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) hbCloseAmuletModal();
  });

  const body = document.getElementById("hb-amulet-modal-body");
  body.addEventListener("click", hbHandleAmuletModalClick);
  body.addEventListener("input", hbHandleAmuletModalInput);
  body.addEventListener("change", hbHandleAmuletModalChange, true);
}

function hbRenderAmuletModal() {
  const body = document.getElementById("hb-amulet-modal-body");
  const title = document.getElementById("hb-amulet-modal-title");
  if (!body || hbAmuletModalSlotIndex === null) return;
  const index = hbAmuletModalSlotIndex;
  const slot = hbAmuletSlots[index];

  if (hbAmuletModalStep === "pick" || !hbFindAmuletVariant(slot.key)) {
    hbAmuletModalStep = "pick";
    title.textContent = `Slot ${index + 1} · Choose an Amulet`;
    const usedIds = hbUsedAmuletIds(index);
    const cards = [];
    hbAmulets.forEach((amulet) => {
      const isUsedElsewhere = usedIds.has(amulet.id);
      (amulet.variants || []).forEach((variant) => {
        const key = hbAmuletKey(amulet.id, variant.rarity);
        const disabled = isUsedElsewhere && key !== slot.key;
        const selected = key === slot.key;
        const [r, g, b] = hbAmuletRarityRgb(variant.rarity);
        cards.push(`<button type="button"
            class="hb-amulet-pick-card${selected ? " hb-amulet-pick-selected" : ""}${disabled ? " hb-amulet-pick-disabled" : ""}"
            data-key="${hbEsc(key)}" ${disabled ? "disabled" : ""}
            style="--pick-r:${r}; --pick-g:${g}; --pick-b:${b};">
            <img src="${hbEsc(hbAmuletImage(amulet, variant))}" alt="" onerror="this.src='images/ui/site-logo.png'">
            <span class="hb-amulet-pick-name">${hbEsc(amulet.name)}</span>
            <span class="hb-amulet-pick-rarity">${hbEsc(variant.rarity)}</span>
            ${disabled ? '<span class="hb-amulet-pick-note">In use</span>' : ""}
          </button>`);
      });
    });
    body.innerHTML = `
      <div class="hb-amulet-pick-grid">${cards.join("")}</div>
      ${
        slot.key
          ? `<div class="hb-modal-actions">
              <button type="button" class="hb-btn hb-btn-danger" id="hb-amulet-remove-btn">Remove Amulet</button>
              <button type="button" class="hb-btn hb-btn-primary" id="hb-amulet-done-btn">Done</button>
            </div>`
          : ""
      }
    `;
    return;
  }

  const found = hbFindAmuletVariant(slot.key);
  title.textContent = `Slot ${index + 1} · ${found.amulet.name}`;
  body.innerHTML = `
    <button type="button" class="hb-modal-back" id="hb-amulet-change-btn">&larr; Change amulet</button>
    ${hbAmuletDetailsHtml(found.amulet, found.variant, index, slot.selections)}
    <div class="hb-modal-actions">
      <button type="button" class="hb-btn hb-btn-danger" id="hb-amulet-remove-btn">Remove Amulet</button>
      <button type="button" class="hb-btn hb-btn-primary" id="hb-amulet-done-btn">Done</button>
    </div>
  `;
}

function hbOpenAmuletModal(slotIndex) {
  hbEnsureAmuletModal();
  hbAmuletModalSlotIndex = slotIndex;
  const slot = hbAmuletSlots[slotIndex];
  hbAmuletModalStep = slot.key ? "configure" : "pick";
  hbRenderAmuletModal();
  const overlay = document.getElementById("hb-amulet-modal");
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("hb-modal-open"));
}

function hbCloseAmuletModal() {
  const overlay = document.getElementById("hb-amulet-modal");
  if (!overlay || overlay.hidden) return;
  overlay.classList.remove("hb-modal-open");
  setTimeout(() => {
    overlay.hidden = true;
  }, 160);
  hbAmuletModalSlotIndex = null;
  hbBuildAmuletSlots();
}

function hbHandleAmuletModalClick(e) {
  const index = hbAmuletModalSlotIndex;
  if (index === null) return;

  const pick = e.target.closest(".hb-amulet-pick-card");
  if (pick && !pick.disabled) {
    hbAmuletSlots[index] = { key: pick.dataset.key, selections: {} };
    hbAmuletModalStep = "configure";
    hbRenderAmuletModal();
    hbRenderBonuses();
    return;
  }

  if (e.target.closest("#hb-amulet-change-btn")) {
    hbAmuletModalStep = "pick";
    hbRenderAmuletModal();
    return;
  }

  if (e.target.closest("#hb-amulet-remove-btn")) {
    hbAmuletSlots[index] = { key: null, selections: {} };
    hbAmuletModalStep = "pick";
    hbRenderAmuletModal();
    hbRenderBonuses();
    return;
  }

  if (e.target.closest("#hb-amulet-done-btn")) {
    hbCloseAmuletModal();
    return;
  }

  const check = e.target.closest(".hb-amulet-buff-check");
  if (check) {
    const slot = hbAmuletSlots[index];
    const found = hbFindAmuletVariant(slot.key);
    if (!found) return;
    const buffIndex = Number(check.dataset.buffIndex);
    const limit = found.variant.buffsAmount || 0;
    if (check.checked) {
      if (Object.keys(slot.selections).length >= limit) return;
      const buf = found.variant.buffs[buffIndex];
      slot.selections[buffIndex] = buf.max;
    } else {
      delete slot.selections[buffIndex];
    }
    hbRenderAmuletModal();
    hbRenderBonuses();
  }
}

function hbHandleAmuletModalInput(e) {
  const input = e.target.closest(".hb-amulet-buff-value");
  if (!input || hbAmuletModalSlotIndex === null) return;
  const slot = hbAmuletSlots[hbAmuletModalSlotIndex];
  const found = hbFindAmuletVariant(slot.key);
  if (!found) return;
  const buffIndex = Number(input.dataset.buffIndex);
  const buf = found.variant.buffs[buffIndex];
  const clamped = hbClamp(Number(input.value), buf.min, buf.max);
  slot.selections[buffIndex] = clamped;
  hbRenderBonuses();
}

function hbHandleAmuletModalChange(e) {
  const input = e.target.closest(".hb-amulet-buff-value");
  if (!input || hbAmuletModalSlotIndex === null) return;
  const slot = hbAmuletSlots[hbAmuletModalSlotIndex];
  const found = hbFindAmuletVariant(slot.key);
  if (!found) return;
  const buffIndex = Number(input.dataset.buffIndex);
  const buf = found.variant.buffs[buffIndex];
  const clamped = hbClamp(Number(input.value), buf.min, buf.max);
  slot.selections[buffIndex] = clamped;
  input.value = clamped;
}

function hbInitAmulets() {
  const wrap = document.getElementById("hb-amulet-list");
  if (wrap) {
    wrap.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".hb-amulet-slot-remove");
      if (removeBtn) {
        e.stopPropagation();
        const index = Number(removeBtn.dataset.removeIndex);
        hbAmuletSlots[index] = { key: null, selections: {} };
        hbBuildAmuletSlots();
        hbRenderBonuses();
        return;
      }
      const slotEl = e.target.closest(".hb-amulet-slot");
      if (slotEl) hbOpenAmuletModal(Number(slotEl.dataset.slotIndex));
    });

    wrap.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const slotEl = e.target.closest(".hb-amulet-slot");
      if (!slotEl) return;
      e.preventDefault();
      hbOpenAmuletModal(Number(slotEl.dataset.slotIndex));
    });
  }

  const resetBtn = document.getElementById("hb-amulet-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      hbAmuletSlots = Array.from({ length: HB_AMULET_SLOT_COUNT }, () => ({
        key: null,
        selections: {},
      }));
      hbBuildAmuletSlots();
      hbRenderBonuses();
    });
  }
}

function hbFindEquipItem(categoryKey, itemName) {
  if (!itemName) return null;
  const list = hbEquipment[categoryKey] || [];
  return list.find((it) => it.name === itemName) || null;
}

function hbNormalizeEquipType(type) {
  return type === "Multi" ? "Mult" : type;
}

function hbFormatEquipBuff(buf) {
  const type = hbNormalizeEquipType(buf.type);
  if (type === "Mult") return `x${hbFormatNumber(buf.value)}`;
  if (type === "Perc") return `+${hbFormatNumber(buf.value)}%`;
  return `+${hbFormatNumber(buf.value)}`;
}

function hbEquipDetailsHtml(item) {
  const rows = (item.buffs || [])
    .map(
      (b) =>
        `<tr><td>${hbEsc(b.stat)}</td><td>${hbEsc(hbFormatEquipBuff(b))}</td></tr>`,
    )
    .join("");
  const buffsTable =
    item.buffs && item.buffs.length
      ? `<table class="hb-equip-buffs"><tr><th>Stat</th><th>Bonus</th></tr>${rows}</table>`
      : "";
  return `<div class="hb-equip-details">
      <img class="hb-equip-img" src="${hbEsc(item.image)}" alt="${hbEsc(item.name)}" onerror="this.src='images/ui/site-logo.png'">
      <div class="hb-equip-info">
        <div class="hb-equip-name-row">
          <span class="hb-equip-name">${hbEsc(item.name)}</span>
        </div>
        <p class="hb-equip-source">${hbEsc(item.description || "")}</p>
      </div>
    </div>
    ${buffsTable}`;
}

function hbBuildEquipSlots() {
  const wrap = document.getElementById("hb-equip-list");
  if (!wrap) return;
  wrap.innerHTML = hbEquipSlots
    .map((slot, i) => {
      const def = HB_EQUIP_SLOT_DEFS[i];
      const item = hbFindEquipItem(def.key, slot.item);
      if (!item) {
        return `<div class="hb-equip-slot hb-equip-slot-empty" data-slot-index="${i}" role="button" tabindex="0" aria-label="${hbEsc(def.label)} slot, empty. Click to equip a ${hbEsc(def.label.toLowerCase())}.">
          <span class="hb-equip-slot-plus">+</span>
          <span class="hb-equip-slot-label">${hbEsc(def.label)}</span>
        </div>`;
      }
      return `<div class="hb-equip-slot hb-equip-slot-filled" data-slot-index="${i}" role="button" tabindex="0"
          aria-label="${hbEsc(def.label)} slot, ${hbEsc(item.name)}. Click to edit.">
        <img src="${hbEsc(item.image)}" alt="" onerror="this.src='images/ui/site-logo.png'">
        <button type="button" class="hb-equip-slot-remove" data-remove-index="${i}" aria-label="Remove ${hbEsc(def.label)}">&times;</button>
        <span class="hb-equip-slot-name">${hbEsc(item.name)}</span>
      </div>`;
    })
    .join("");
  const chip = document.getElementById("hb-equip-count-chip");
  if (chip) {
    const filled = hbEquipSlots.filter((s, i) =>
      hbFindEquipItem(HB_EQUIP_SLOT_DEFS[i].key, s.item),
    ).length;
    chip.textContent = `${filled}/${HB_EQUIP_SLOT_COUNT} equipped`;
  }
}

function hbEnsureEquipModal() {
  if (document.getElementById("hb-equip-modal")) return;
  const overlay = document.createElement("div");
  overlay.className = "hb-modal-overlay";
  overlay.id = "hb-equip-modal";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="hb-modal" role="dialog" aria-modal="true" aria-labelledby="hb-equip-modal-title">
      <div class="hb-modal-header">
        <span class="hb-modal-title" id="hb-equip-modal-title">Choose Equipment</span>
        <button type="button" class="hb-modal-close" id="hb-equip-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="hb-modal-body" id="hb-equip-modal-body"></div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hbCloseEquipModal();
  });
  document
    .getElementById("hb-equip-modal-close")
    .addEventListener("click", hbCloseEquipModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) hbCloseEquipModal();
  });

  const body = document.getElementById("hb-equip-modal-body");
  body.addEventListener("click", hbHandleEquipModalClick);
}

function hbRenderEquipModal() {
  const body = document.getElementById("hb-equip-modal-body");
  const title = document.getElementById("hb-equip-modal-title");
  if (!body || hbEquipModalSlotIndex === null) return;
  const index = hbEquipModalSlotIndex;
  const def = HB_EQUIP_SLOT_DEFS[index];
  const slot = hbEquipSlots[index];
  const current = hbFindEquipItem(def.key, slot.item);

  if (hbEquipModalStep === "pick" || !current) {
    hbEquipModalStep = "pick";
    title.textContent = `${def.label} · Choose an Item`;
    const items = hbEquipment[def.key] || [];
    const cards = items
      .map((item) => {
        const selected = item.name === slot.item;
        const [r, g, b] = HB_RARITY_RGB.epic;
        return `<button type="button"
            class="hb-equip-pick-card${selected ? " hb-equip-pick-selected" : ""}"
            data-item-name="${hbEsc(item.name)}"
            style="--pick-r:${r}; --pick-g:${g}; --pick-b:${b};">
            <img src="${hbEsc(item.image)}" alt="" onerror="this.src='images/ui/site-logo.png'">
            <span class="hb-equip-pick-name">${hbEsc(item.name)}</span>
          </button>`;
      })
      .join("");
    body.innerHTML = `
      <div class="hb-equip-pick-grid">${cards}</div>
      ${
        slot.item
          ? `<div class="hb-modal-actions">
              <button type="button" class="hb-btn hb-btn-danger" id="hb-equip-remove-btn">Remove</button>
              <button type="button" class="hb-btn hb-btn-primary" id="hb-equip-done-btn">Done</button>
            </div>`
          : ""
      }
    `;
    return;
  }

  title.textContent = `${def.label} · ${current.name}`;
  body.innerHTML = `
    <button type="button" class="hb-modal-back" id="hb-equip-change-btn">&larr; Change ${hbEsc(def.label.toLowerCase())}</button>
    ${hbEquipDetailsHtml(current)}
    <div class="hb-modal-actions">
      <button type="button" class="hb-btn hb-btn-danger" id="hb-equip-remove-btn">Remove</button>
      <button type="button" class="hb-btn hb-btn-primary" id="hb-equip-done-btn">Done</button>
    </div>
  `;
}

function hbOpenEquipModal(slotIndex) {
  hbEnsureEquipModal();
  hbEquipModalSlotIndex = slotIndex;
  const slot = hbEquipSlots[slotIndex];
  hbEquipModalStep = slot.item ? "configure" : "pick";
  hbRenderEquipModal();
  const overlay = document.getElementById("hb-equip-modal");
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("hb-modal-open"));
}

function hbCloseEquipModal() {
  const overlay = document.getElementById("hb-equip-modal");
  if (!overlay || overlay.hidden) return;
  overlay.classList.remove("hb-modal-open");
  setTimeout(() => {
    overlay.hidden = true;
  }, 160);
  hbEquipModalSlotIndex = null;
  hbBuildEquipSlots();
}

function hbHandleEquipModalClick(e) {
  const index = hbEquipModalSlotIndex;
  if (index === null) return;

  const pick = e.target.closest(".hb-equip-pick-card");
  if (pick) {
    hbEquipSlots[index] = { item: pick.dataset.itemName };
    hbEquipModalStep = "configure";
    hbRenderEquipModal();
    hbRenderBonuses();
    return;
  }

  if (e.target.closest("#hb-equip-change-btn")) {
    hbEquipModalStep = "pick";
    hbRenderEquipModal();
    return;
  }

  if (e.target.closest("#hb-equip-remove-btn")) {
    hbEquipSlots[index] = { item: null };
    hbEquipModalStep = "pick";
    hbRenderEquipModal();
    hbRenderBonuses();
    return;
  }

  if (e.target.closest("#hb-equip-done-btn")) {
    hbCloseEquipModal();
    return;
  }
}

function hbInitEquips() {
  const wrap = document.getElementById("hb-equip-list");
  if (wrap) {
    wrap.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".hb-equip-slot-remove");
      if (removeBtn) {
        e.stopPropagation();
        const index = Number(removeBtn.dataset.removeIndex);
        hbEquipSlots[index] = { item: null };
        hbBuildEquipSlots();
        hbRenderBonuses();
        return;
      }
      const slotEl = e.target.closest(".hb-equip-slot");
      if (slotEl) hbOpenEquipModal(Number(slotEl.dataset.slotIndex));
    });

    wrap.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const slotEl = e.target.closest(".hb-equip-slot");
      if (!slotEl) return;
      e.preventDefault();
      hbOpenEquipModal(Number(slotEl.dataset.slotIndex));
    });
  }

  const resetBtn = document.getElementById("hb-equip-reset");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      hbEquipSlots = Array.from({ length: HB_EQUIP_SLOT_COUNT }, () => ({
        item: null,
      }));
      hbBuildEquipSlots();
      hbRenderBonuses();
    });
  }
}

function hbCentralizeAndAggregateStats(allEntries) {
  const statGroup = new Map();

  allEntries.forEach(({ stat, type, value }) => {
    if (!statGroup.has(stat)) {
      statGroup.set(stat, { Add: 0, Perc: 0, Mult: [], originalTypes: new Set() });
    }
    const current = statGroup.get(stat);
    current.originalTypes.add(type);

    if (type === "Mult") {
      current.Mult.push(Number(value));
    } else if (type === "Perc") {
      current.Perc += Number(value);
    } else if (type === "Add") {
      current.Add += Number(value);
    }
  });

  const finalEntries = [];

  statGroup.forEach((data, stat) => {
    const productMult = data.Mult.reduce((acc, m) => acc * m, 1);
    const def = hbGetStatDef(stat);

    if (def && def.type === "Raw") {
      // Raw baseline from stats.json: Add, Perc, and Mult bonuses all
      // apply on top of it. Add stacks onto the base, Mult scales the
      // result, and Perc is applied as a percentage increase.
      const finalRaw = (def.value + data.Add) * productMult * (1 + data.Perc / 100);

      finalEntries.push({
        stat,
        type: "Raw",
        value: finalRaw
      });
    } else if (def && def.type === "Perc") {
      // Perc baseline from stats.json: Perc and Mult bonuses apply on
      // top of it, the same way stats.json defines the stat's type.
      const finalPerc = (def.value + data.Perc) * productMult;

      finalEntries.push({
        stat,
        type: "Perc",
        value: finalPerc
      });
    } else if (data.originalTypes.has("Perc") || (data.originalTypes.has("Mult") && !data.originalTypes.has("Add"))) {
      // Fallback for stats not tracked in stats.json (e.g. Mult-only stats
      // like "Attack Bonus"): keep the previous 100-baseline behavior.
      const finalPerc = (100 + data.Perc) * productMult;

      finalEntries.push({
        stat,
        type: "Perc",
        value: finalPerc
      });
    } else {
      // Fallback for untracked Add stats (e.g. "Bee Attack"): no baseline
      // to add onto, just the raw Add total scaled by any Mult bonuses.
      const finalAdd = data.Add * productMult;

      finalEntries.push({
        stat,
        type: "Add",
        value: finalAdd
      });
    }
  });

  return finalEntries;
}

function hbGetGiftBonusEntries() {
  const seen = new Set();
  const entries = [];
  hbSlots.forEach((slot) => {
    if (!slot.bee || !slot.shiny) return;
    if (seen.has(slot.bee)) return;
    seen.add(slot.bee);
    const bee = hbGetBee(slot.bee);
    if (bee && bee.shinyBonus) entries.push({ ...bee.shinyBonus });
  });
  return entries; // Returns raw items for centralized aggregation later
}

function hbGetStickerBonusEntries() {
  const seen = new Set();
  const entries = [];
  hbStickerSlots.forEach((slot) => {
    if (!slot.sticker) return;
    if (seen.has(slot.sticker)) return;
    seen.add(slot.sticker);
    const sticker = hbGetSticker(slot.sticker);
    if (sticker && Array.isArray(sticker.buffs)) {
      sticker.buffs.forEach((b) => entries.push({ ...b }));
    }
  });
  return entries; // Returns raw items for centralized aggregation later
}

function hbGetAmuletBonusEntries() {
  const entries = [];
  hbAmuletSlots.forEach((slot) => {
    const found = hbFindAmuletVariant(slot.key);
    if (!found) return;
    Object.entries(slot.selections).forEach(([buffIndex, value]) => {
      const buf = found.variant.buffs[Number(buffIndex)];
      if (!buf) return;
      entries.push({ stat: buf.stat, type: buf.type, value });
    });
  });
  return entries;
}

function hbGetBadgeBonusEntries() {
  const entries = [];
  hbBadges.forEach((badge) => {
    const tier = hbBadgeTiers[badge.id] || 0;
    if (!tier || !badge.buff) return;
    entries.push({
      stat: badge.buff.stat,
      type: badge.buff.type,
      value: hbBadgeBuffValue(badge, tier),
    });
  });
  return entries;
}

function hbGetEquipBonusEntries() {
  const entries = [];
  hbEquipSlots.forEach((slot, i) => {
    if (!slot.item) return;
    const def = HB_EQUIP_SLOT_DEFS[i];
    const item = hbFindEquipItem(def.key, slot.item);
    if (!item || !Array.isArray(item.buffs)) return;
    item.buffs.forEach((b) => {
      entries.push({ stat: b.stat, type: hbNormalizeEquipType(b.type), value: b.value });
    });
  });
  return entries;
}

function hbGetBuff(rawEntries, stat, type, defaultValue = 0) {
  const matches = rawEntries.filter(e => e.stat === stat && e.type === type);
  if (type === "Mult") {
    return matches.length ? matches.reduce((acc, m) => acc * m.value, 1) : 1;
  }
  return matches.reduce((acc, m) => acc + m.value, defaultValue);
}

function hbGetTotalHiveAttack(rawEntries) {
  const beeAttack = hbGetBuff(rawEntries, "Bee Attack", "Add", 0);
  const redBeeAttack = hbGetBuff(rawEntries, "Red Bee Attack", "Add", 0);
  const blueBeeAttack = hbGetBuff(rawEntries, "Blue Bee Attack", "Add", 0);
  const attackBonus = hbGetBuff(rawEntries, "Attack Bonus", "Mult", 1);

  let totalHiveAttack = 0;

  hbSlots.forEach((slot) => {
    if (!slot.bee) return;
    const data = hbGetBee(slot.bee);
    if (!data) return;

    const baseAttack = data.attack || 0;
    let attack = baseAttack + beeAttack;

    if (data.color === "Red") attack += redBeeAttack;
    else if (data.color === "Blue") attack += blueBeeAttack;

    attack *= attackBonus;

    if (slot.shiny) attack *= 2;

    totalHiveAttack += attack;
  });

  return totalHiveAttack;
}

function hbRenderBonuses() {
  const giftEntries = hbGetGiftBonusEntries();
  const stickerEntries = hbGetStickerBonusEntries();
  const badgeEntries = hbGetBadgeBonusEntries();
  const amuletEntries = hbGetAmuletBonusEntries();
  const equipEntries = hbGetEquipBonusEntries();
  
  const allRawEntries = [
    ...giftEntries,
    ...stickerEntries,
    ...badgeEntries,
    ...amuletEntries,
    ...equipEntries,
  ];

  const totalEntries = hbCentralizeAndAggregateStats(allRawEntries);
  const giftDisplayEntries = hbCentralizeAndAggregateStats(giftEntries);
  const stickerDisplayEntries = hbCentralizeAndAggregateStats(stickerEntries);

  // Load default baselines from the static stats.json data file
  const defaultStats = hbGetDefaultStats();

  // Pre-populate our structural layout container using data baseline blueprints
  const aggregateMap = new Map();
  defaultStats.forEach(item => {
    aggregateMap.set(item.stat, { stat: item.stat, type: item.type, value: item.value });
  });

  // Inject computed total hive combat performance value metrics
  const totalHiveAttackVal = hbGetTotalHiveAttack(allRawEntries);
  aggregateMap.set("Total Hive Attack", { stat: "Total Hive Attack", type: "Raw", value: totalHiveAttackVal });

  // Overwrite empty baselines with computed modifications instantly.
  // Only Raw and Perc stat types are shown in the total table.
  totalEntries
    .filter(entry => entry.type === "Perc" || entry.type === "Raw")
    .forEach(entry => {
      aggregateMap.set(entry.stat, entry);
    });

  // Total Capacity is derived the same way as Total Hive Attack: the base
  // stat ("Capacity") scaled by its bonus percentage ("Capacity Bonus"),
  // using the finalized values above so any Add/Mult/Perc contributions
  // from bees, badges, amulets, and equipment are already folded in.
  const capacityBase = (aggregateMap.get("Capacity") || {}).value || 0;
  const capacityBonusPct = (aggregateMap.get("Capacity Bonus") || {}).value ?? 100;
  const totalCapacityVal = capacityBase * (capacityBonusPct / 100);
  aggregateMap.set("Total Capacity", { stat: "Total Capacity", type: "Raw", value: totalCapacityVal });

  // Keep entries as raw numbers here — hbRenderBonusTable() is the single
  // place that calls hbFormatBonus(). Formatting here too (as before) fed
  // an already-formatted string like "3,250" or "100%" back into
  // hbFormatBonus a second time, where Number("3,250")/Number("100%")
  // both evaluate to NaN, which is why every non-zero stat showed "NaN".
  const displayEntries = Array.from(aggregateMap.values()).map(item => {
    if (item.stat === "Total Hive Attack" || item.stat === "Total Capacity") {
      return { stat: item.stat, type: "Add", value: item.value };
    }
    return {
      stat: item.stat,
      type: item.type,
      value: item.value,
    };
  });

  hbRenderBonusTable(
    "hb-gift-tbody",
    giftDisplayEntries,
    "No shiny bees placed yet.",
  );

  hbRenderBonusTable(
    "hb-sticker-tbody",
    stickerDisplayEntries,
    "No stickers placed yet.",
  );

  hbRenderBonusTable(
    "hb-total-tbody",
    displayEntries,
    "",
  );
}

function hbInitCopyButtons() {
  document.querySelectorAll(".hb-copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tableId = btn.dataset.copyTarget;
      const table = document.getElementById(tableId);
      const rows = Array.from(table.querySelectorAll("tbody tr"))
        .map((tr) => {
          const cells = Array.from(tr.querySelectorAll("td")).map((td) =>
            td.textContent.trim(),
          );
          return cells.join(": ");
        })
        .filter((line) => line && !line.includes("undefined"));

      const text = rows.join("\n");
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add("hb-copied");
        const original = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.classList.remove("hb-copied");
          btn.textContent = original;
        }, 1400);
      } catch {}
    });
  });
}

function hbHexPathAt(ctx, cx, cy, w, h) {
  const hw = w / 2;
  const hh = h / 2;
  ctx.beginPath();
  ctx.moveTo(cx - hw * 0.5, cy - hh);
  ctx.lineTo(cx + hw * 0.5, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx + hw * 0.5, cy + hh);
  ctx.lineTo(cx - hw * 0.5, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
}

function hbLoadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function hbRoundRectPath(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hbMixRgb(rgb, dark, ratio) {
  const r = Math.round(rgb[0] * ratio + dark[0] * (1 - ratio));
  const g = Math.round(rgb[1] * ratio + dark[1] * (1 - ratio));
  const b = Math.round(rgb[2] * ratio + dark[2] * (1 - ratio));
  return `rgb(${r},${g},${b})`;
}

function hbMixRgb(rgb, dark, ratio) {
  const r = Math.round(rgb[0] * ratio + dark[0] * (1 - ratio));
  const g = Math.round(rgb[1] * ratio + dark[1] * (1 - ratio));
  const b = Math.round(rgb[2] * ratio + dark[2] * (1 - ratio));
  return `rgb(${r},${g},${b})`;
}

function hbEnsurePolyGradient(hex, index, c1, c2) {
  const svg = hex.querySelector(".hb-hex-svg");
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  const gradId = "hb-grad-" + index;
  let grad = defs.querySelector("#" + gradId);
  if (!grad) {
    grad = document.createElementNS(SVG_NS, "linearGradient");
    grad.setAttribute("id", gradId);
    grad.setAttribute("x1", "0%");
    grad.setAttribute("y1", "0%");
    grad.setAttribute("x2", "100%");
    grad.setAttribute("y2", "100%");
    const stop1 = document.createElementNS(SVG_NS, "stop");
    stop1.setAttribute("offset", "0%");
    const stop2 = document.createElementNS(SVG_NS, "stop");
    stop2.setAttribute("offset", "100%");
    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);
  }
  grad.children[0].setAttribute("stop-color", c1);
  grad.children[1].setAttribute("stop-color", c2);
}

async function hbExportHive() {
  const hexW = 97;
  const hexH = 78;
  const gapX = hexW * 0.7826;
  const gapY = hexH + 6;
  const colOffset = gapY / 2;
  const strokeW = Math.max(3, hexW * 0.05);
  const maxCol = Math.max(...HB_COLUMNS);

  const hiveW = gapX * (HB_COLUMNS.length - 1) + hexW * 1.3;
  const hiveH = gapY * maxCol + colOffset;

  const stickerSize = 80;
  const stickerGap = 16;
  const ranges = hbStickerRanges();

  const topH = HB_STICKER_GROUPS.top ? stickerSize + 24 : 0;
  const bottomH = HB_STICKER_GROUPS.bottom ? stickerSize + 24 : 0;
  const leftW = HB_STICKER_GROUPS.left ? stickerSize + 24 : 0;
  const rightW = HB_STICKER_GROUPS.right ? stickerSize + 24 : 0;

  const outerPad = 36;
  const canvasW = outerPad * 2 + leftW + hiveW + rightW;
  const canvasH = outerPad * 2 + topH + hiveH + bottomH;

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#1a1200";
  ctx.fillRect(0, 0, canvasW, canvasH);

  const hiveOriginX = outerPad + leftW;
  const hiveOriginY = outerPad + topH;

  const faceCache = {};
  const stickerCache = {};

  let index = 0;
  for (let col = 0; col < HB_COLUMNS.length; col++) {
    const height = HB_COLUMNS[col];
    const isEven = col % 2 === 0;
    const colOffsetY = isEven ? colOffset : 0;
    const colContentH = gapY * (height - 1);
    const startY =
      hiveOriginY + colOffsetY + (hiveH - colOffset - colContentH) / 2;

    for (let row = 0; row < height; row++) {
      const slot = hbSlots[index];
      const cx = hiveOriginX + hexW * 0.7 + col * gapX;
      const cyFinal = startY + row * gapY;

      hbHexPathAt(ctx, cx, cyFinal, hexW, hexH);

      const bee = slot.bee ? hbGetBee(slot.bee) : null;

      if (!slot.bee) {
        ctx.fillStyle = "#2a2010";
        ctx.fill();
      } else {
        const rarityKey = bee ? (bee.rarity || "").toLowerCase() : "basic";
        const rgb = HB_RARITY_RGB[rarityKey] || HB_RARITY_RGB.basic;
        if (hbIsGradientRarity(rgb)) {
          const bounds = {
            x: cx - hexW / 2,
            y: cyFinal - hexH / 2,
            w: hexW,
            h: hexH,
          };
          const grad = ctx.createLinearGradient(
            bounds.x,
            bounds.y,
            bounds.x + bounds.w,
            bounds.y + bounds.h,
          );
          grad.addColorStop(0, hbMixRgb(rgb[0], HB_DARK_MIX, 0.9));
          grad.addColorStop(1, hbMixRgb(rgb[1], HB_DARK_MIX, 0.9));
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = hbMixRgb(rgb, HB_DARK_MIX, 0.9);
        }
        ctx.fill();
      }

      ctx.save();
      if (slot.bee && slot.shiny) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = strokeW + 1;
        ctx.shadowColor = "rgba(255,255,255,0.9)";
        ctx.shadowBlur = 14;
      } else {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = strokeW;
      }
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();

      if (bee) {
        const src = hbFaceIcon(bee);
        if (!(src in faceCache)) faceCache[src] = await hbLoadImage(src);
        const img = faceCache[src];
        if (img) {
          const size = hexH * 0.62;
          ctx.drawImage(img, cx - size / 2, cyFinal - size / 2, size, size);
        }
      }
      index++;
    }
  }

  async function drawStickerAt(x, y, stickerName) {
    hbRoundRectPath(ctx, x, y, stickerSize, stickerSize, 10);
    ctx.fillStyle = "rgba(18,12,0,0.6)";
    ctx.fill();
    ctx.strokeStyle = "rgba(58,40,0,0.7)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (!stickerName) return;
    const sticker = hbGetSticker(stickerName);
    if (!sticker) return;
    const src = sticker.image || "";
    if (!(src in stickerCache)) stickerCache[src] = await hbLoadImage(src);
    const img = stickerCache[src];
    if (img) {
      const pad = stickerSize * 0.12;
      ctx.drawImage(
        img,
        x + pad,
        y + pad,
        stickerSize - pad * 2,
        stickerSize - pad * 2,
      );
    }
  }

  if (HB_STICKER_GROUPS.top) {
    const [start, end] = ranges.top;
    const count = end - start;
    const rowW = count * stickerSize + (count - 1) * stickerGap;
    let x = hiveOriginX + (hiveW - rowW) / 2;
    const y = outerPad + (topH - stickerSize) / 2;
    for (let i = start; i < end; i++) {
      await drawStickerAt(x, y, hbStickerSlots[i].sticker);
      x += stickerSize + stickerGap;
    }
  }

  if (HB_STICKER_GROUPS.bottom) {
    const [start, end] = ranges.bottom;
    const count = end - start;
    const rowW = count * stickerSize + (count - 1) * stickerGap;
    let x = hiveOriginX + (hiveW - rowW) / 2;
    const y = hiveOriginY + hiveH + (bottomH - stickerSize) / 2;
    for (let i = start; i < end; i++) {
      await drawStickerAt(x, y, hbStickerSlots[i].sticker);
      x += stickerSize + stickerGap;
    }
  }

  if (HB_STICKER_GROUPS.left) {
    const [start, end] = ranges.left;
    const count = end - start;
    const colH = count * stickerSize + (count - 1) * stickerGap;
    let y = hiveOriginY + (hiveH - colH) / 2;
    const x = outerPad + (leftW - stickerSize) / 2;
    for (let i = start; i < end; i++) {
      await drawStickerAt(x, y, hbStickerSlots[i].sticker);
      y += stickerSize + stickerGap;
    }
  }

  if (HB_STICKER_GROUPS.right) {
    const [start, end] = ranges.right;
    const count = end - start;
    const colH = count * stickerSize + (count - 1) * stickerGap;
    let y = hiveOriginY + (hiveH - colH) / 2;
    const x = hiveOriginX + hiveW + (rightW - stickerSize) / 2;
    for (let i = start; i < end; i++) {
      await drawStickerAt(x, y, hbStickerSlots[i].sticker);
      y += stickerSize + stickerGap;
    }
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-hive.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function hbInitTopline() {
  document.getElementById("hb-clear-btn").addEventListener("click", () => {
    hbSlots = Array.from({ length: HB_TOTAL_SLOTS }, () => ({
      bee: null,
      shiny: false,
    }));
    hbStickerSlots = Array.from({ length: HB_STICKER_SLOTS }, () => ({
      sticker: null,
    }));
    hbRenderGrid();
    hbRenderStickerGrid();
    hbRenderBonuses();
  });

  document
    .getElementById("hb-export-btn")
    .addEventListener("click", hbExportHive);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await hbLoadData();
  } catch {
    return;
  }
  hbBuildPalettes();
  hbBuildGrid();
  hbBuildStickerFrame();
  hbBuildBadges();
  hbInitBadges();
  hbBuildAmuletSlots();
  hbInitAmulets();
  hbBuildEquipSlots();
  hbInitEquips();
  hbRenderBonuses();
  hbInitTopline();
  hbInitTrash();
  hbInitCopyButtons();
});
