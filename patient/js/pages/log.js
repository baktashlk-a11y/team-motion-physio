"use strict";
/* Log: moments from Maya's day, good and hard. List, form, saved screen and one moment's details. */

function blankMoment() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return {
    activity: "",
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    outcome: "",
    discomfort: 0,
    help: [],
    other: "",
    note: "",
  };
}
const momentDraft = () =>
  state.momentDraft || (state.momentDraft = blankMoment());
const momentWhen = (m) => `${relDay(m.at)} · ${fmtTime(m.at)}`;
const badgeClass = (v) => (v >= SEVERE ? "is-severe" : v >= 5 ? "is-high" : "");

PAGES.log = {
  tab: "log",
  render() {
    const sorted = [...state.moments].sort((a, b) => b.at.localeCompare(a.at));
    return `<section class="screen screen-log">${header("Log", null, { sub: "Note moments in your day when you feel pain or feel better. Your PT reviews them before your next visit." })}
      <div class="screen-body"><h2 class="section-title">Recent</h2>
        <ul class="moment-list">${
          sorted
            .map(
              (m) => `<li><a class="card moment-card" href="#/log/${m.id}">
                <span class="moment-meta"><time datetime="${m.at}">${esc(momentWhen(m))}</time><span class="discomfort-badge ${badgeClass(m.discomfort)}">Discomfort ${m.discomfort}</span></span>
                <strong class="moment-activity">${esc(m.activity)}</strong>
                <span class="moment-detail">${esc([m.outcome, ...m.help].join(" · "))}</span>
              </a></li>`,
            )
            .join("") ||
          '<li class="empty-state">Your everyday moments will show up here.</li>'
        }</ul>
      </div>
      <footer class="screen-footer">${button(`${icon("plus")} Log a moment`, { href: "#/log/new" })}</footer>
    </section>`;
  },
};

PAGES.logNew = {
  render() {
    const d = momentDraft();
    const today = blankMoment().date;
    const otherOn = d.help.includes("Other");
    return `<form id="moment-form" class="screen screen-moment" data-submit="moment" novalidate>${header("Log a moment", "#/log", { sub: "What you did and how your body felt. Your PT will see it before your visit." })}
      <div class="screen-body">
        <div class="field-group"><label for="moment-activity">What were you doing?</label><input id="moment-activity" type="text" maxlength="120" value="${esc(d.activity)}" placeholder="e.g. Carrying my daughter upstairs" autocomplete="off"></div>
        <fieldset class="field-group"><legend>When?</legend><div class="when-grid"><label class="sr-only" for="moment-date">Date</label><input id="moment-date" type="date" value="${d.date}" max="${today}"><label class="sr-only" for="moment-time">Time</label><input id="moment-time" type="time" value="${d.time}"></div></fieldset>
        <fieldset class="field-group"><legend>How did it go?</legend><div class="choice-grid two">${OUTCOMES.map((o) => chip(o, { action: "moment-outcome", pressed: d.outcome === o })).join("")}</div></fieldset>
        ${discomfortField("moment-discomfort", d.discomfort, "How much discomfort?")}
        <fieldset class="field-group"><legend>What helped? <span>(optional)</span></legend><div class="choice-grid two">${[...HELP_OPTIONS, "Other"].map((h) => chip(h === "Other" ? "+ Other" : h, { action: "moment-help", value: h, pressed: d.help.includes(h), attrs: h === "Other" ? `aria-expanded="${otherOn}" aria-controls="other-help-field"` : "" })).join("")}</div>
          <div id="other-help-field" class="field-group nested" ${otherOn ? "" : "hidden"}><label for="moment-other">What else helped?</label><input id="moment-other" type="text" maxlength="120" value="${esc(d.other)}" placeholder="e.g. Asked someone to help"></div></fieldset>
        <div class="field-group"><label for="moment-note">Anything else? <span>(optional)</span></label><textarea id="moment-note" rows="2" maxlength="500" placeholder="e.g. My back felt tight after.">${esc(d.note)}</textarea></div>
      </div>
      <footer class="screen-footer"><p id="moment-error" class="form-error" role="alert" hidden></p><button class="button primary full" type="submit">Save</button></footer>
    </form>`;
  },
};

function showMomentError(text, focusEl) {
  const error = $("#moment-error");
  error.textContent = text;
  error.hidden = false;
  if (focusEl) {
    focusEl.setAttribute("aria-invalid", "true");
    focusEl.focus();
  }
}

ACTIONS["moment-outcome"] = (el) => {
  momentDraft().outcome = el.dataset.value;
  $$("[data-action='moment-outcome']").forEach((b) =>
    b.setAttribute("aria-pressed", String(b === el)),
  );
  $("#moment-error").hidden = true;
  save();
};
ACTIONS["moment-help"] = (el) => {
  const d = momentDraft();
  const value = el.dataset.value;
  const chosen = !d.help.includes(value);
  d.help = chosen ? [...d.help, value] : d.help.filter((h) => h !== value);
  el.setAttribute("aria-pressed", String(chosen));
  if (value === "Other") {
    el.setAttribute("aria-expanded", String(chosen));
    $("#other-help-field").hidden = !chosen;
    if (chosen) $("#moment-other").focus();
  }
  save();
};
const momentFields = {
  "moment-activity": "activity",
  "moment-date": "date",
  "moment-time": "time",
  "moment-other": "other",
  "moment-note": "note",
};
Object.entries(momentFields).forEach(([id, key]) => {
  INPUTS[id] = (el) => {
    momentDraft()[key] = el.value;
    el.removeAttribute("aria-invalid");
    save();
  };
});
INPUTS["moment-discomfort"] = (el) => {
  momentDraft().discomfort = updateDiscomfort(el);
  save();
};

SUBMITS.moment = () => {
  const d = momentDraft();
  if (!d.activity.trim())
    return showMomentError(
      "Write a few words about what you were doing.",
      $("#moment-activity"),
    );
  if (!d.date || !d.time)
    return showMomentError("Add a date and time.", $("#moment-date"));
  const at = new Date(`${d.date}T${d.time}`);
  if (Number.isNaN(at.getTime()) || at > new Date(Date.now() + 60000))
    return showMomentError(
      "The time can't be in the future.",
      $("#moment-time"),
    );
  if (!d.outcome)
    return showMomentError(
      "Choose how it went before saving.",
      $("[data-action='moment-outcome']"),
    );
  if (d.help.includes("Other") && !d.other.trim())
    return showMomentError(
      "Write what else helped, or turn off + Other.",
      $("#moment-other"),
    );
  confirmSevere(d.discomfort, () => saveMoment(d, at), "moment-discomfort");
};

function saveMoment(d, at) {
  const moment = {
    id: `moment-${Date.now()}`,
    activity: d.activity.trim(),
    at: at.toISOString(),
    outcome: d.outcome,
    discomfort: d.discomfort,
    help: d.help.map((h) => (h === "Other" ? d.other.trim() : h)),
    note: d.note.trim(),
  };
  state.moments.unshift(moment);
  state.lastMoment = moment.id;
  state.momentDraft = null;
  save();
  if (moment.discomfort >= SEVERE)
    reportSevere(moment.discomfort, `while "${moment.activity.toLowerCase()}"`);
  go("/log/saved", { replace: true });
}

function momentSummary(m) {
  return `<div class="session-summary"><time class="summary-label" datetime="${m.at}">${esc(momentWhen(m))}</time><h2 class="summary-title">${esc(m.activity)}</h2>
    <p class="small muted">${esc(m.outcome)} · Discomfort ${m.discomfort}/10</p>${m.help.length ? `<p class="small muted">Helped: ${esc(m.help.join(" · "))}</p>` : ""}${m.note ? `<p class="moment-note">${esc(m.note)}</p>` : ""}</div>`;
}

PAGES.logSaved = {
  guard: () =>
    state.moments.some((m) => m.id === state.lastMoment) ? null : "/log",
  render() {
    const m = state.moments.find((item) => item.id === state.lastMoment);
    const severe = m.discomfort >= SEVERE;
    return `<section class="screen screen-saved"><div class="screen-body completion-content"><div class="success-mark">${icon("check")}</div><h1>Moment saved</h1>
      <p class="muted">${savedToDevice ? "Added to your log on this device." : "Kept until this page closes. Browser saving is off."}</p>
      ${severe ? `<div class="info-card is-alert">${icon("alert")}<p><strong>Your PT has been told.</strong> Rest, and stop your exercises for now.</p></div>` : ""}
      ${momentSummary(m)}</div>
      <footer class="screen-footer stack-footer">${button("Done", { href: "#/log" })}${button("Log another", { href: "#/log/new", style: "secondary" })}</footer></section>`;
  },
};

PAGES.logDetail = {
  tab: "log",
  guard: ({ id }) => (state.moments.some((m) => m.id === id) ? null : "/log"),
  render({ id }) {
    const m = state.moments.find((item) => item.id === id);
    return `<section class="screen screen-moment-detail">${header("Moment", "#/log")}
      <div class="screen-body">${momentSummary(m)}
        <p class="field-hint">${state.privacy.moments ? `Your PT can see this moment.` : `Your PT can't see your moments. Change this in Settings, Privacy.`}</p></div>
      <footer class="screen-footer">${button(`${icon("trash")} Delete moment`, { action: "delete-moment", style: "danger-quiet", attrs: `data-id="${m.id}"` })}</footer>
    </section>`;
  },
};

ACTIONS["delete-moment"] = (el) => {
  openModal({
    title: "Delete this moment?",
    text: "You can't undo this.",
    confirm: "Delete",
    style: "danger",
    onConfirm: () => {
      state.moments = state.moments.filter((m) => m.id !== el.dataset.id);
      save();
      go("/log", { replace: true });
      toast("Moment deleted");
    },
  });
};
