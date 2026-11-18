"use strict";
/* Exercises: the list, the player (GIF + timer), the check-in and the Completed screen. */

const clock = (sec) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

/* Exercise GIF from Patient/assets/. If the file is missing, a plain box shows instead. */
function exerciseGif(ex, easier = false) {
  return `${easier ? '<p class="media-version-note">Shared movement demo · follow the Easier steps below.</p>' : ""}<div class="media"><img src="assets/${ex.gif}" alt="${ex.name}, movement demonstration" onerror="this.parentElement.classList.add('is-missing')"><span class="media-missing">GIF coming soon</span></div>
    <p class="media-credit">We don't own this GIF. Source: <a href="${ex.source.url}" target="_blank" rel="noopener">${ex.source.name}</a></p>`;
}

/* Repeat the easier adjustments already specified in the plan in the relevant
   movement steps. Keep the prescribed sets, repetitions and holds unchanged. */
function exerciseSteps(ex, easier) {
  if (!easier) return ex.steps;
  const steps = [...ex.steps];
  switch (ex.id) {
    case "wallsquat":
      steps[1] = "Slide down slowly with a smaller bend in your knees.";
      break;
    case "bandrow":
      steps[0] = "Sit with your legs straight and a light band around your feet.";
      break;
    case "farmer":
      steps[0] = "Hold a lighter bag in each hand.";
      steps[2] = "Breathe slowly and hold, or walk slowly, for 15 seconds.";
      break;
    case "calf":
      steps[0] = "Stand with your feet hip width apart and hold a chair for balance.";
      break;
    case "hamstring":
      steps[0] = "Lie on your back.";
      steps[1] = "Lift one leg with your knee bent a little and hold it behind the thigh or with a strap.";
      steps[2] = "Hold for 20 seconds, then switch sides.";
      break;
  }
  return steps;
}

/* ---------- Timer ----------
   Counts down the exercise time, like a workout app. Kept per exercise,
   so switching Standard or Easier doesn't reset it. */
let timer = null;

function timerFor(key, minutes) {
  if (!timer || timer.key !== key) {
    if (timer) clearInterval(timer.id);
    timer = {
      key,
      total: minutes * 60,
      left: minutes * 60,
      running: false,
      id: null,
    };
  }
  return timer;
}

function timerLabel(t) {
  if (t.left <= 0) return `${icon("check")}<span>Time's up</span>`;
  if (t.running) return `${icon("pause")}<span>${clock(t.left)}</span>`;
  if (t.left < t.total)
    return `${icon("play")}<span>Resume · ${clock(t.left)}</span>`;
  return `${icon("play")}<span>Start timer · ${clock(t.total)}</span>`;
}

function drawTimer() {
  const btn = $(".timer-btn", app);
  if (!btn || !timer) return;
  btn.innerHTML = timerLabel(timer);
  btn.style.setProperty(
    "--p",
    `${((timer.total - timer.left) / timer.total) * 100}%`,
  );
  btn.classList.toggle("is-running", timer.running);
  btn.classList.toggle("is-finished", timer.left <= 0);
  btn.setAttribute(
    "aria-label",
    timer.left <= 0
      ? "Time's up"
      : timer.running
        ? `Pause timer, ${clock(timer.left)} left`
        : `Start timer, ${clock(timer.left)}`,
  );
  /* When time is up, Done becomes the main (dark) button and the timer steps back. */
  const finished = timer.left <= 0;
  btn.classList.toggle("primary", !finished);
  btn.classList.toggle("secondary", finished);
  const done = $(".player-done", app);
  done.classList.toggle("primary", finished);
  done.classList.toggle("secondary", !finished);
}

function tick() {
  timer.left = Math.max(timer.left - 1, 0);
  if (timer.left <= 0) {
    timer.running = false;
    clearInterval(timer.id);
    if (navigator.vibrate) navigator.vibrate(200);
  }
  drawTimer();
}

function mountPlayer() {
  drawTimer();
  if (timer && timer.running) timer.id = setInterval(tick, 1000);
  onCleanup(() => {
    if (timer) clearInterval(timer.id);
  });
}

ACTIONS["timer-toggle"] = () => {
  if (!timer || timer.left <= 0) return;
  timer.running = !timer.running;
  clearInterval(timer.id);
  if (timer.running) timer.id = setInterval(tick, 1000);
  drawTimer();
};

/* ---------- This week's exercises ---------- */

const selected = () =>
  EXERCISES.filter((ex) => state.filter === "all" || ex.must);

PAGES.exercises = {
  tab: "home",
  render() {
    const items = selected();
    const todo = items.filter((ex) => !isDone(ex.id));
    const doneCount = EXERCISES.filter((ex) => isDone(ex.id)).length;
    const left = remaining();
    let start = button(
      `${icon("play")} Start ${state.filter === "must" ? "must-dos" : "all"} · ${minutesOf(todo)} min`,
      { action: "start-all", attrs: todo.length ? "" : "disabled" },
    );
    if (state.session)
      start = button(
        `Resume · exercise ${state.session.index + 1} of ${state.session.ids.length}`,
        { href: "#/session" },
      );
    if (state.pause)
      start = button(`${icon("lock")} Paused by your PT`, {
        attrs: "disabled",
      });
    return `<section class="screen screen-list">${header(doneCount ? "Still to do" : "This week's exercises", "#/home", { sub: `Until your visit on ${fmtDay(nextVisit())} · about ${minutesOf(left)} min left` })}
      <div class="screen-body">
        ${state.pause ? `<a class="alert-strip" href="#/inbox/${(state.messages.find((m) => m.kind === "pause") || {}).id}">${icon("alert")}<span><strong>Paused by your PT.</strong> Please rest until you talk. Read message</span>${icon("chevron", "row-chevron")}</a>` : ""}
        ${segmented(
          "filter",
          [
            ["all", `All (${left.length})`],
            ["must", `Must-dos only (${left.filter((ex) => ex.must).length})`],
          ],
          state.filter,
          "Which exercises",
        )}
        ${state.filter === "must" ? `<aside class="backup-plan"><strong>Your PT's backup plan</strong><p>For busy or sore weeks. ${todo.length ? `These ${todo.length} are enough until your visit.` : "You've finished your must-dos."}</p></aside>` : ""}
        <ul class="exercise-list">${items
          .map(
            (
              ex,
            ) => `<li><button type="button" class="exercise-row ${isDone(ex.id) ? "done" : ""}" data-action="open-exercise" data-id="${ex.id}" ${state.pause || state.session ? "disabled" : ""}>
              <span class="status-dot">${isDone(ex.id) ? icon("check") : ""}</span>
              <span class="exercise-label"><strong>${ex.name}</strong><small>${ex.minutes} min${isDone(ex.id) ? " · Done" : ""}</small></span>
              ${icon("chevron", "row-chevron")}
            </button></li>`,
          )
          .join("")}</ul>
        ${doneCount ? '<p class="field-hint center">Tap a done exercise to do it again.</p>' : ""}
      </div>
      <footer class="screen-footer">${start}</footer>
    </section>`;
  },
};

ACTIONS.filter = (el) => {
  state.filter = el.dataset.value;
  save();
  rerender();
  $(`[data-action="filter"][data-value="${state.filter}"]`).focus();
};

function startSession(ids) {
  state.session = { ids, index: 0, done: [], variants: {} };
  state.draft = { feeling: "", discomfort: 0, note: "" };
  save();
  go("/session");
}
ACTIONS["start-all"] = () => {
  const todo = selected().filter((ex) => !isDone(ex.id));
  if (todo.length && !state.pause) startSession(todo.map((ex) => ex.id));
};
ACTIONS["open-exercise"] = (el) => {
  if (!state.pause) startSession([el.dataset.id]);
};

/* ---------- Player ---------- */

PAGES.session = {
  guard: () =>
    state.pause
      ? "/exercises"
      : state.session
        ? state.session.index >= state.session.ids.length
          ? "/checkin"
          : null
        : "/exercises",
  render() {
    const s = state.session;
    const ex = exerciseById(s.ids[s.index]);
    const easier = s.variants[ex.id] === "easier";
    const next = exerciseById(s.ids[s.index + 1]);
    timerFor(`${s.index}-${ex.id}`, ex.minutes);
    const dots = s.ids
      .map(
        (id, i) =>
          `<span class="${i < s.index ? "past" : i === s.index ? "now" : ""}"></span>`,
      )
      .join("");
    return `<section class="screen screen-player">
      <header class="screen-header player-top"><button type="button" class="icon-button" data-action="leave-session" aria-label="Skip or end session">${icon("close")}</button>
        <div class="player-step"><h1>Exercise ${s.index + 1} of ${s.ids.length}</h1><div class="step-dots" aria-hidden="true">${dots}</div></div><span class="icon-spacer"></span></header>
      <div class="screen-body">
        ${segmented(
          "variant",
          [
            ["standard", "Standard"],
            ["easier", "Easier", !ex.easier],
          ],
          easier ? "easier" : "standard",
          "Exercise version",
        )}
        ${!ex.easier ? `<p class="field-hint center">Your PT didn't add an easier version for this one.</p>` : ""}
        ${easier ? `<aside class="version-changes" aria-label="What changes in the easier version"><strong>Easier plan</strong><p>${esc(ex.easier)}</p><small>Standard: ${esc(ex.standard)}</small></aside>` : ""}
        ${exerciseGif(ex, easier)}
        <div class="exercise-head"><h2>${ex.name}</h2></div>
        <p class="prescription">${easier ? ex.easier : ex.standard}</p>
        <ol class="steps">${exerciseSteps(ex, easier).map((step) => `<li>${step}</li>`).join("")}</ol>
      </div>
      <footer class="screen-footer"><p class="next-up">${next ? `Next up: ${next.name} · ${next.minutes} min` : "Next up: a quick check-in"}</p>
        <div class="player-actions"><button type="button" class="button primary full timer-btn" data-action="timer-toggle"></button>${button("Done", { action: "next-exercise", style: "secondary", cls: "player-done" })}</div><p class="timer-hint">Timer is a guide. Tap Done after your sets or holds.</p></footer>
    </section>`;
  },
  mount: mountPlayer,
};

ACTIONS.variant = (el) => {
  const s = state.session;
  s.variants[s.ids[s.index]] = el.dataset.value;
  save();
  rerender();
  $(`[data-action="variant"][data-value="${el.dataset.value}"]`).focus();
};

function advance(markDone) {
  const s = state.session;
  const id = s.ids[s.index];
  if (markDone && !s.done.includes(id)) s.done.push(id);
  s.index += 1;
  if (s.index < s.ids.length) {
    save();
    go("/session", { replace: true });
    return;
  }
  if (!s.done.length) {
    state.session = null;
    save();
    go("/exercises", { replace: true });
    toast("Session ended. Nothing was skipped for good.");
    return;
  }
  save();
  go("/checkin", { replace: true });
}
ACTIONS["next-exercise"] = () => advance(true);

/* The X: skip this exercise, or end the session. Done exercises are never lost. */
ACTIONS["leave-session"] = () => {
  const s = state.session;
  const ex = exerciseById(s.ids[s.index]);
  const isLast = s.index === s.ids.length - 1;
  const end = () => {
    if (s.done.length) {
      s.index = s.ids.length;
      save();
      go("/checkin", { replace: true });
    } else {
      state.session = null;
      save();
      go("/exercises", { replace: true });
    }
  };
  const n = s.done.length;
  const doneText = n
    ? ` If you end now, you'll check in on the ${n} you did.`
    : "";
  if (isLast) {
    openModal({
      title:
        s.ids.length === 1
          ? `Stop ${ex.name.toLowerCase()}?`
          : "End this session?",
      text: `It stays on your list for later.${doneText}`,
      confirm: "End session",
      cancel: "Keep going",
      onConfirm: end,
    });
    return;
  }
  openModal({
    title: `Skip ${ex.name.toLowerCase()}?`,
    text: `It stays on your list for later.${doneText}`,
    confirm: "Skip to next exercise",
    cancel: "End session",
    dismiss: "Keep going",
    onConfirm: () => advance(false),
    onCancel: end,
  });
};

/* ---------- Check-in ---------- */

PAGES.checkin = {
  guard: () =>
    state.session && state.session.done.length ? null : "/exercises",
  render() {
    const s = state.session;
    const d = state.draft;
    return `<form class="screen screen-checkin" data-submit="checkin"><header class="screen-header"><button type="button" class="icon-button" data-action="leave-checkin" aria-label="Leave check-in">${icon("close")}</button><div class="screen-title"><h1>Quick check-in</h1><p class="muted">${s.done.length} exercise${s.done.length === 1 ? "" : "s"} done</p></div></header>
      <div class="screen-body">
        <fieldset class="field-group"><legend>1. How did it feel?</legend><div class="choice-grid four">${["Easy", "OK", "Hard", "Too hard"].map((f) => chip(f, { action: "feeling", pressed: d.feeling === f })).join("")}</div></fieldset>
        ${discomfortField("discomfort", d.discomfort, "2. Any discomfort?")}
        <div class="field-group"><label for="note">3. Anything to tell your PT? <span>(optional)</span></label><textarea id="note" rows="3" maxlength="500" placeholder="e.g. My shoulder clicked on the last set">${esc(d.note)}</textarea></div>
      </div>
      <footer class="screen-footer"><button type="submit" class="button primary full" id="save-checkin" ${canSaveCheckin() ? "" : "disabled"}>Save</button><p class="field-hint center" id="save-hint">${saveHint()}</p></footer>
    </form>`;
  },
};

ACTIONS["leave-checkin"] = () => {
  const n = state.session.done.length;
  openModal({
    title: "Leave without saving?",
    text: `Your ${n} exercise${n === 1 ? "" : "s"} won't be marked as done.`,
    confirm: "Keep checking in",
    cancel: "Leave without saving",
    onCancel: () => {
      state.session = null;
      state.draft = { feeling: "", discomfort: 0, note: "" };
      save();
      go("/exercises", { replace: true });
    },
  });
};

/* Discomfort slider. Shared with the Log form. 8 or more turns red and tells Maya her PT will see it. */
function discomfortField(id, value, label) {
  return `<div class="field-group discomfort-field ${value >= SEVERE ? "is-severe" : ""}"><div class="range-heading"><label for="${id}">${label}</label><output id="${id}-value" class="range-value" for="${id}">${value} · ${discomfortWord(value)}</output></div>
    <input id="${id}" type="range" min="0" max="10" step="1" value="${value}"><div class="range-labels"><span>0 none</span><span>10 worst</span></div>
    <p class="severe-hint" id="${id}-hint" ${value >= SEVERE ? "" : "hidden"}>${icon("alert")} ${SEVERE} or more is severe. Your PT will be told right away.</p></div>`;
}
function updateDiscomfort(el) {
  const value = Number(el.value);
  const field = el.closest(".discomfort-field");
  $(`#${el.id}-value`).value = `${value} · ${discomfortWord(value)}`;
  field.classList.toggle("is-severe", value >= SEVERE);
  $(`#${el.id}-hint`).hidden = value < SEVERE;
  return value;
}

/* Save needs a feeling, except when pain is severe: then Maya can save right away. */
const canSaveCheckin = () =>
  !!state.draft.feeling || state.draft.discomfort >= SEVERE;
function saveHint() {
  if (state.draft.discomfort >= SEVERE) return "Save now so your PT is told.";
  return state.draft.feeling
    ? "Your check-in is saved on this device."
    : "Choose how it felt to save.";
}
function updateSave() {
  $("#save-checkin").disabled = !canSaveCheckin();
  $("#save-hint").textContent = saveHint();
}

ACTIONS.feeling = (el) => {
  state.draft.feeling = el.dataset.value;
  $$("[data-action='feeling']").forEach((b) =>
    b.setAttribute("aria-pressed", String(b === el)),
  );
  updateSave();
  save();
};
INPUTS.discomfort = (el) => {
  state.draft.discomfort = updateDiscomfort(el);
  updateSave();
  save();
};
INPUTS.note = (el) => {
  state.draft.note = el.value;
  save();
};

SUBMITS.checkin = () => {
  const s = state.session;
  const d = state.draft;
  if (!canSaveCheckin()) return;
  const entry = {
    id: `checkin-${Date.now()}`,
    ids: [...s.done],
    variants: { ...s.variants },
    feeling: d.feeling,
    discomfort: d.discomfort,
    note: d.note.trim(),
    at: new Date().toISOString(),
  };
  state.checkins.push(entry);
  state.completed = [...new Set([...state.completed, ...s.done])];
  state.lastCheckin = entry;
  state.session = null;
  state.draft = { feeling: "", discomfort: 0, note: "" };
  save();
  if (entry.discomfort >= SEVERE) {
    const names = entry.ids
      .map((id) => exerciseById(id).name.toLowerCase())
      .join(" and ");
    reportSevere(entry.discomfort, `after ${names}`);
  }
  go("/done", { replace: true });
};

/* ---------- Completed ---------- */

PAGES.done = {
  guard: () => (state.lastCheckin ? null : "/home"),
  render() {
    const e = state.lastCheckin;
    const severe = e.discomfort >= SEVERE;
    return `<section class="screen screen-done"><div class="screen-body completion-content">
      <div class="success-mark">${icon("check")}</div><h1>Completed</h1><p class="muted">Nice work making time for yourself.</p>
      ${severe ? `<div class="info-card is-alert">${icon("alert")}<p><strong>Your PT has been told.</strong> Stop for now if it hurts.</p></div>` : ""}
      <div class="session-summary"><span class="summary-label">${relDay(e.at)}</span><p>${e.ids.map((id) => exerciseById(id).name).join(" · ")}</p><p class="small muted">${e.feeling ? `${esc(e.feeling)} · ` : ""}Discomfort ${e.discomfort}/10${e.note ? " · 1 note" : ""}</p></div>
      <p class="small muted">${savedToDevice ? "Saved on this device." : "Browser saving is off, so this is kept until the page closes."}</p>
    </div><footer class="screen-footer stack-footer">${button("Back to home", { href: "#/home" })}${button("Log a moment", { href: "#/log/new", style: "secondary" })}</footer></section>`;
  },
};
