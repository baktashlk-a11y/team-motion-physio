"use strict";
/* Shared pieces every page uses: icons, text and date helpers,
   buttons, headers, the bottom nav, pop-ups, toasts and notifications. */

const PAGES = {}; // page name -> { tab, nav, render(params), mount(params), guard(params) }
const ACTIONS = {}; // data-action name -> function(element, event)
const INPUTS = {}; // input id -> function(element, event)
const SUBMITS = {}; // form data-submit name -> function(form, event)

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

/* ---------- Icons (24 × 24, drawn with lines) ---------- */
const ICON_PATHS = {
  back: '<path d="m14 5-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
  log: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  progress: '<path d="M4 4v16h17M7 14l4-5 4 2 5-7"/>',
  profile:
    '<circle cx="12" cy="8" r="4"/><path d="M5 22v-3a7 7 0 0 1 14 0v3"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
  raiseHand:
    '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8a8 8 0 0 0 8 8h1a7 7 0 0 0 7-7v-3a2 2 0 0 0-4 0"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  hand: '<path d="M9 11V5a1.5 1.5 0 0 1 3 0v5M12 10V4a1.5 1.5 0 0 1 3 0v6M15 10V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L3.5 13a1.5 1.5 0 0 1 2.4-1.8L9 14"/>',
  play: '<path d="m8 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="2.6"/>',
  replay: '<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  microphone:
    '<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2ZM10 21h4"/>',
  video:
    '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  animation:
    '<circle cx="12" cy="5" r="2"/><path d="M12 7v7M8 10l4-2 4 2M9 21l3-7 3 7"/>',
  alert: '<path d="M12 3 2 20h20L12 3ZM12 10v4M12 17v.5"/>',
  phone:
    '<path d="M5 3h4l2 5-3 2a11 11 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
  message: '<path d="M4 5h16v11H9l-5 4V5Z"/>',
  /* Gear from Lucide icons (lucide.dev, ISC license) */
  settings:
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  heart:
    '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ""}</svg>`;

/* ---------- Dates ---------- */
const sameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();
const fmtDay = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
const fmtShort = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtMonth = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "long" });
const fmtWeekday = (d) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "long" });
const fmtTime = (d) =>
  new Date(d)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    .toLowerCase();
function relDay(d) {
  if (sameDay(d, daysFromToday(0))) return "Today";
  if (sameDay(d, daysFromToday(-1))) return "Yesterday";
  if (sameDay(d, daysFromToday(1))) return "Tomorrow";
  return fmtDay(d);
}
const daysUntil = (d) =>
  Math.round((daysFromToday(0) - new Date(d).setHours(12, 0, 0, 0)) / -864e5);

/* ---------- Building blocks ---------- */

/* One button style for the whole app: primary, secondary, quiet or danger. */
function button(
  label,
  {
    action,
    href,
    style = "primary",
    full = true,
    cls: extra = "",
    attrs = "",
  } = {},
) {
  const cls = `button ${style}${full ? " full" : ""}${extra ? ` ${extra}` : ""}`;
  if (href) return `<a class="${cls}" href="${href}" ${attrs}>${label}</a>`;
  return `<button type="button" class="${cls}" ${action ? `data-action="${action}"` : ""} ${attrs}>${label}</button>`;
}

/* Name the destination without taking space away from the screen title. */
function returnDestination(back) {
  const names = {
    "#/home": "Home",
    "#/log": "Log",
    "#/progress": "Progress",
    "#/profile": "Profile",
    "#/prep": "visit preparation",
    "#/inbox": "Messages",
    "#/settings": "Settings",
    "#/settings/privacy": "Privacy",
  };
  if (names[back]) return names[back];
  if (back.startsWith("#/buddy/")) {
    const buddy = buddyById(back.slice("#/buddy/".length));
    if (buddy) return `${buddy.name}'s profile`;
  }
  return back.startsWith("#/plan/") ? "plan details" : "the previous screen";
}

/* Screen header with an explicit in-app return route, like "#/home". */
function header(title, back, { sub = "", right = "", closeIcon = false } = {}) {
  const label = back
    ? `${closeIcon ? "Close and return to" : "Back to"} ${returnDestination(back)}`
    : "";
  const backHtml = back
    ? `<a class="icon-button" href="${esc(back)}" aria-label="${esc(label)}" title="${esc(label)}">${icon(closeIcon ? "close" : "back")}</a>`
    : "";
  return `<header class="screen-header">${backHtml}<div class="screen-title"><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ""}</div>${right}</header>`;
}

/* Bottom nav. Real links, so the phone's back gesture works too. */
function bottomNav(active) {
  const tabs = [
    ["home", "Home"],
    ["log", "Log"],
    ["progress", "Progress"],
    ["profile", "Profile"],
  ];
  return `<nav class="bottom-nav" aria-label="Main navigation">${tabs
    .map(
      ([name, label]) =>
        `<a class="nav-item ${name === active ? "active" : ""}" href="#/${name}" ${name === active ? 'aria-current="page"' : ""}>${icon(name)}<span>${label}</span></a>`,
    )
    .join("")}</nav>`;
}

function chip(label, { action, value, pressed = false, attrs = "" } = {}) {
  return `<button type="button" class="chip" data-action="${action}" data-value="${esc(value ?? label)}" aria-pressed="${pressed}" ${attrs}>${label}</button>`;
}

function segmented(name, options, current, label) {
  return `<div class="segmented" role="group" aria-label="${label}">${options
    .map(
      ([value, text, disabled]) =>
        `<button type="button" data-action="${name}" data-value="${value}" aria-pressed="${value === current}" ${disabled ? "disabled" : ""}>${text}</button>`,
    )
    .join("")}</div>`;
}

function toggleRow(path, title, sub = "", { locked = false } = {}) {
  const on = locked ? true : !!getPath(path);
  const id = `toggle-${path.replace(/\W/g, "-")}`;
  return `<div class="list-row toggle-row"><label for="${id}"><strong>${title}</strong>${sub ? `<small>${sub}</small>` : ""}</label><input id="${id}" class="switch" type="checkbox" role="switch" data-toggle="${path}" ${on ? "checked" : ""} ${locked ? 'disabled aria-describedby="' + id + '-lock"' : ""}>${locked ? `<span id="${id}-lock" class="sr-only">Always on</span>` : ""}</div>`;
}

function linkRow(href, title, sub = "", { lead = "", trail = "" } = {}) {
  return `<a class="list-row link-row" href="${href}">${lead}<span class="row-text"><strong>${title}</strong>${sub ? `<small>${sub}</small>` : ""}</span>${trail}${icon("chevron", "row-chevron")}</a>`;
}

function avatar(name, cls = "") {
  const letters = name === PT.label ? "PT" : name.charAt(0);
  return `<span class="avatar ${cls} ${name === PT.label ? "is-pt" : ""}" aria-hidden="true">${esc(letters)}</span>`;
}

/* Receipt: a read-only summary, one line per item, label on the left and value on the right.
   rows = [[label, value, isAlert], ...] */
function receipt(rows, caption = "") {
  return `<div class="receipt">${caption ? `<p class="receipt-caption">${caption}</p>` : ""}<dl>${rows
    .map(
      ([label, value, alert]) =>
        `<div class="receipt-row ${alert ? "is-alert" : ""}"><dt>${label}</dt><dd>${value}</dd></div>`,
    )
    .join("")}</dl></div>`;
}

function discomfortWord(value) {
  if (value === 0) return "None";
  if (value <= 3) return "Mild";
  if (value < SEVERE) return "Moderate";
  return "Severe";
}

/* ---------- Pop-up, toast and notification ---------- */
let modalConfirm = null;
let modalCancel = null;
let modalReturnFocus = null;

/* onCancel runs only when the second button is tapped, not when the pop-up is closed. */
/* dismiss adds a third, quiet button that just closes the pop-up.
   cancel: "" shows only one button. center: true puts the card in the middle of the screen. */
function openModal({
  title,
  text,
  confirm = "OK",
  style = "primary",
  cancel = "Cancel",
  dismiss = "",
  center = false,
  onConfirm,
  onCancel,
}) {
  modalConfirm = onConfirm;
  modalCancel = onCancel;
  modalReturnFocus = document.activeElement;
  $("#overlay-root").innerHTML =
    `<div class="modal-backdrop" data-action="modal-cancel"></div>
    <div class="modal ${center ? "is-center" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">${title}</h2>${text ? `<p class="muted">${text}</p>` : ""}
      <div class="modal-actions">${button(confirm, { action: "modal-confirm", style })}${cancel ? button(cancel, { action: "modal-second", style: "secondary" }) : ""}${dismiss ? button(dismiss, { action: "modal-cancel", style: "quiet" }) : ""}</div>
    </div>`;
  $(".modal [data-action='modal-confirm']").focus({ preventScroll: true });
}
function closeModal() {
  $("#overlay-root").innerHTML = "";
  modalConfirm = null;
  modalCancel = null;
  if (modalReturnFocus && document.contains(modalReturnFocus))
    modalReturnFocus.focus({ preventScroll: true });
}
ACTIONS["modal-cancel"] = closeModal;
ACTIONS["modal-second"] = () => {
  const fn = modalCancel;
  closeModal();
  if (fn) fn();
};
ACTIONS["modal-confirm"] = () => {
  const fn = modalConfirm;
  closeModal();
  if (fn) fn();
};
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $(".modal")) closeModal();
});

let toastTimer = null;
function toast(text) {
  const el = $("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* A phone-style notification that slides down from the top. Tap opens href. */
let notifyTimer = null;
function notify({ from, title, href }) {
  const el = $("#notify");
  el.innerHTML = `<a class="notify-card" href="${href}">${avatar(from)}<span><strong>${esc(from)}</strong><small>${esc(title)}</small></span><span class="notify-time">now</span></a>`;
  el.classList.add("show");
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => el.classList.remove("show"), 6000);
}
ACTIONS["hide-notify"] = () => $("#notify").classList.remove("show");
document.addEventListener("click", (event) => {
  if (event.target.closest(".notify-card"))
    $("#notify").classList.remove("show");
});

/* ---------- Severe discomfort: the PT is told, then pauses the plan ---------- */
function reportSevere(value, detail) {
  if (state.pause || state.alertPending) return;
  state.alertPending = { value, detail, at: new Date().toISOString() };
  save();
  schedulePtReply();
}

let ptTimer = null;
function schedulePtReply() {
  if (!state.alertPending || ptTimer) return;
  ptTimer = setTimeout(() => {
    ptTimer = null;
    const { value, detail } = state.alertPending;
    state.alertPending = null;
    state.pause = { at: new Date().toISOString(), value, detail };
    state.session = null;
    state.messages.unshift({
      id: `pause-${Date.now()}`,
      kind: "pause",
      from: PT.label,
      at: new Date().toISOString(),
      title: "Please pause this week's exercises",
      text: `Hi Maya, I saw you rated your discomfort ${value} out of 10 ${detail}. Please stop this week's exercises until we talk. Rest is OK, and so is gentle walking. I'll call you today. If the pain gets worse or you feel numbness, call the clinic.`,
      read: false,
    });
    save();
    notify({
      from: PT.label,
      title: "Please pause this week's exercises",
      href: `#/inbox/${state.messages[0].id}`,
    });
    rerender();
  }, 4000);
}
