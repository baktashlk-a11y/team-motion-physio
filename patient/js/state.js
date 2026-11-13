"use strict";
/* Everything Maya changes is kept in one state object and saved in this browser.
   Reset demo brings back the starting data. */

/* Change the version number when the demo data changes, so old saved data is ignored. */
const STORE_KEY = "rbc-patient-v4";

function freshState() {
  return {
    completed: [], // exercise ids checked in this cycle
    checkins: [], // saved check-ins
    session: null, // { ids, index, done, variants }
    filter: "all", // "all" or "must"
    draft: { feeling: "", discomfort: 0, note: "" },
    lastCheckin: null,
    moments: seedMoments(),
    momentDraft: null,
    lastMoment: null,
    pause: null, // set when the PT pauses the plan
    alertPending: null, // severe report waiting for the PT's reply
    messages: seedMessages(),
    buddies: seedBuddies(),
    requests: seedRequests(),
    askDraft: null,
    lastRequest: null,
    prep: { questions: ["Can I swim this week?", "Stairs still hurt a bit."] }, // notes for the PT
    notif: { daily: true, dailyTime: "7:00 pm", visit: true, buddy: true },
    privacy: { checkins: true, moments: true, notes: true },
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY));
    if (raw && typeof raw === "object") {
      const merged = Object.assign(freshState(), raw);
      merged.completed = merged.completed.filter((id) =>
        EXERCISES.some((ex) => ex.id === id),
      );
      return merged;
    }
  } catch {
    /* Storage is blocked or old. Start fresh. */
  }
  return freshState();
}

let savedToDevice = true;
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    savedToDevice = true;
  } catch {
    savedToDevice = false;
  }
  return savedToDevice;
}

function resetState() {
  state = freshState();
  save();
}

/* ---------- Plan helpers ---------- */
const exerciseById = (id) => EXERCISES.find((ex) => ex.id === id);
const isDone = (id) => state.completed.includes(id);
const remaining = () => EXERCISES.filter((ex) => !isDone(ex.id));
const minutesOf = (list) => list.reduce((sum, ex) => sum + ex.minutes, 0);
const nextVisit = () => daysFromToday(PLAN.nextVisitOffset);
const planStart = () => daysFromToday(PLAN.startedOffset);
const visitDate = (visit) => daysFromToday(visit.offset);
const unreadCount = () => state.messages.filter((m) => !m.read).length;
const buddyById = (id) => state.buddies.find((b) => b.id === id);

/* Read and write nested values like "notif.daily". */
function getPath(path) {
  return path
    .split(".")
    .reduce((obj, key) => (obj ? obj[key] : undefined), state);
}
function setPath(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((obj, key) => obj[key], state);
  target[last] = value;
}
