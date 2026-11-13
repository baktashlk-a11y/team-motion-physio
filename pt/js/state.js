/* Recovery Beyond Clinic · PT workspace prototype
   Plain JavaScript. Each page is a function that returns HTML.
   The URL hash decides the page, so browser back/forward and every menu link work from anywhere. */

/* ---------- State (saved in the browser) ---------- */
const STORE_KEY = "rbc-pt-v2";
const clone = (o) => JSON.parse(JSON.stringify(o));

function freshState() {
  return {
    patients: clone(PATIENTS),
    library: clone(LIBRARY),
    drafts: {}, // patientId -> { items, why, nextVisit }
    reviewed: {}, // updateId -> true
    replies: {}, // updateId (question) -> text
    extraVisits: [], // visits booked when a plan is published
    published: {}, // patientId -> { version, at, mustCount }
    visitDone: {}, // patientId -> true once the plan is published at today's visit
    calWeek: 0,
  };
}
let state = load();
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return Object.assign(freshState(), JSON.parse(raw));
  } catch (e) {
    /* storage blocked: use memory only */
  }
  return freshState();
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    /* ignore */
  }
}
