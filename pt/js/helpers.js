/* ---------- Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const getPatient = (id) => state.patients.find((p) => p.id === id);
const getEx = (id) =>
  state.library.find((e) => e.id === id) || { id, name: id, min: 0, area: "" };
const firstName = (p) => p.name.split(" ")[0];
const totalMin = (items) => items.reduce((n, it) => n + getEx(it.exId).min, 0);
const mustItems = (items) => items.filter((it) => it.must);
const newCount = (p) => p.updates.filter((u) => !state.reviewed[u.id]).length;
const countKind = (p, k) => p.updates.filter((u) => u.kind === k).length;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function crumbs(items) {
  return `<nav class="crumbs" aria-label="You are here">${items
    .map(([label, href], i) =>
      href && i < items.length - 1
        ? `<a href="${href}">${esc(label)}</a><span class="sep" aria-hidden="true">›</span>`
        : `<span aria-current="page">${esc(label)}</span>`,
    )
    .join("")}</nav>`;
}

function toast(msg, undoFn) {
  const root = $("#toast-root");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span>${esc(msg)}</span>${undoFn ? '<button type="button">Undo</button>' : ""}`;
  if (undoFn)
    el.querySelector("button").onclick = () => {
      undoFn();
      el.remove();
    };
  root.innerHTML = "";
  root.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function openModal(html, onMount, size = "") {
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal-backdrop" data-close-modal><div class="modal ${size}" role="dialog" aria-modal="true">${html}</div></div>`;
  const first = root.querySelector(
    "input, textarea, select, button:not(.close-x)",
  );
  if (first) first.focus();
  if (onMount) onMount(root.querySelector(".modal"));
}
function closeModal() {
  $("#modal-root").innerHTML = "";
}

/* Parse "10:00" or "1:00" (afternoon) into hours from 9 am. */
function hourOffset(t) {
  let [h, m] = t.split(":").map(Number);
  if (h < 8) h += 12;
  return h - 9 + m / 60;
}
function niceTime(t) {
  let [h, m] = t.split(":").map(Number);
  const pm = h < 8 || h >= 12;
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, "0")} ${pm ? "pm" : "am"}`;
}

/* All visits, from patient data plus visits booked in this session. */
function allVisits() {
  const list = state.patients.map((p) => ({
    patient: p.id,
    ...p.visit,
    status: state.visitDone[p.id] ? "seen" : p.visit.status,
  }));
  return PAST_VISITS.concat(
    list,
    state.extraVisits.map((v) => ({ ...v, status: "booked" })),
  );
}
function visitLabel(v) {
  const days = WEEKS[String(v.week)].days;
  const months = v.week < 0 ? "Oct" : "Nov";
  return `${DAY_NAMES[v.day]}, ${days[v.day]} ${months} · ${niceTime(v.time)}`;
}
function nextVisitOf(p) {
  const booked = state.extraVisits.filter((v) => v.patient === p.id);
  if (booked.length) return visitLabel(booked[booked.length - 1]);
  if (p.visit.status === "seen" || state.visitDone[p.id]) return "Not booked";
  if (p.visit.week === 0 && p.visit.day === TODAY.dayIndex)
    return `Today · ${niceTime(p.visit.time)}`;
  return visitLabel(p.visit);
}
