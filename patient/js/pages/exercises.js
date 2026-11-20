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
      steps[0] =
        "Sit with your legs straight and a light band around your feet.";
      break;
    case "farmer":
      steps[0] = "Hold a lighter bag in each hand.";
      steps[2] = "Breathe slowly and hold, or walk slowly, for 15 seconds.";
      break;
    case "calf":
      steps[0] =
        "Stand with your feet hip width apart and hold a chair for balance.";
      break;
    case "hamstring":
      steps[0] = "Lie on your back.";
      steps[1] =
        "Lift one leg with your knee bent a little and hold it behind the thigh or with a strap.";
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

/* ---------- Choose a workout ---------- */

function exerciseMustTag(ex) {
  return ex.must ? '<span class="must-do-tag">Must-do</span>' : "";
}

/* The exercises in the open tab: all of them, or only the must-dos. */
const tabExercises = () =>
  state.exerciseTab === "must" ? EXERCISES.filter((ex) => ex.must) : EXERCISES;
/* Exercises Maya can still pick in this tab. Done ones are greyed out and can't be picked. */
const openExercises = () => tabExercises().filter((ex) => !isDone(ex.id));

function workoutExercises() {
  const open = openExercises();
  const ids = state.workoutSelection ?? open.map((ex) => ex.id);
  return open.filter((ex) => ids.includes(ex.id));
}

/* One row. Not done: a checkbox to pick it. Done: grey, crossed out, not clickable. */
function exerciseChoice(ex, chosen, locked) {
  if (isDone(ex.id))
    return `<li><div class="exercise-row exercise-choice done" aria-disabled="true">
      <span class="status-dot" aria-hidden="true">${icon("check")}</span>
      <span class="exercise-label"><span class="exercise-name-line"><strong class="cross">${ex.name}</strong>${state.exerciseTab === "all" ? exerciseMustTag(ex) : ""}</span><small>${ex.minutes} min · Done</small></span>
    </div></li>`;
  return `<li><label class="exercise-row exercise-choice ${locked ? "is-disabled" : ""}" for="workout-${ex.id}">
    <input type="checkbox" id="workout-${ex.id}" data-exercise-id="${ex.id}" ${chosen.includes(ex) ? "checked" : ""} ${locked ? "disabled" : ""}>
    <span class="exercise-label"><span class="exercise-name-line"><strong>${ex.name}</strong>${state.exerciseTab === "all" ? exerciseMustTag(ex) : ""}</span><small>${ex.minutes} min</small></span>
  </label></li>`;
}

PAGES.exercises = {
  tab: "home",
  render() {
    const must = EXERCISES.filter((ex) => ex.must);
    const open = openExercises();
    const chosen = state.session
      ? EXERCISES.filter((ex) => state.session.ids.includes(ex.id))
      : workoutExercises();
    const locked = !!(state.pause || state.session);
    let start = button(
      `${icon("play")} Start workout${chosen.length ? ` · ${minutesOf(chosen)} min` : ""}`,
      {
        action: "start-selected",
        attrs: chosen.length && !locked ? "" : "disabled",
      },
    );
    if (state.session) start = button("Resume workout", { href: "#/session" });
    if (state.pause)
      start = button(`${icon("lock")} Paused by your PT`, {
        attrs: "disabled",
      });
    const tabTime = (list) => {
      const left = list.filter((ex) => !isDone(ex.id));
      return left.length ? `${minutesOf(left)} min` : "done";
    };
    const emptyText =
      state.exerciseTab === "must"
        ? "<strong>All your must-dos are done.</strong> This week counts. Switch to All if you want to do more."
        : "<strong>Your whole plan is done.</strong> Great work this week.";
    return `<section class="screen screen-list">${header("Choose exercises", "#/home", { sub: "Pick the exercises you want in this workout." })}
      <div class="screen-body">
        ${state.pause ? `<a class="alert-strip" href="#/inbox/${(state.messages.find((m) => m.kind === "pause") || {}).id}">${icon("alert")}<span><strong>Paused by your PT.</strong> Please rest until you talk. Read message</span>${icon("chevron", "row-chevron")}</a>` : ""}
        <div class="exercise-tabs">${segmented(
          "exercise-tab",
          [
            ["all", `All · ${tabTime(EXERCISES)}`],
            ["must", `Must-dos · ${tabTime(must)}`],
          ],
          state.exerciseTab,
          "Which exercises to show",
        )}</div>
        ${state.session && !state.pause ? '<p class="selection-help">You have a workout in progress. Resume it before starting another.</p>' : ""}
        ${open.length ? `<div class="selection-tools"><span>${chosen.length} of ${open.length} selected</span><div><button type="button" class="text-button" data-action="select-all-exercises" ${locked ? "disabled" : ""}>Select all</button><button type="button" class="text-button" data-action="clear-exercises" ${locked ? "disabled" : ""}>Clear</button></div></div>` : `<p class="info-card">${icon("check")}<span>${emptyText}</span></p>`}
        <ul class="exercise-list" aria-label="Exercises to include in your workout">${tabExercises()
          .map((ex) => exerciseChoice(ex, chosen, locked))
          .join("")}</ul>
      </div>
      <footer class="screen-footer">${!locked && open.length ? `<p class="next-up" aria-live="polite">${chosen.length ? `${chosen.length} exercise${chosen.length === 1 ? "" : "s"} selected · about ${minutesOf(chosen)} min` : "Choose at least one exercise to start."}</p>` : ""}${open.length || locked ? start : button("Back to home", { href: "#/home", style: "secondary" })}</footer>
    </section>`;
  },
};

/* The first time Maya opens the list, a pop-up in the middle of the screen explains the must-dos once. */
PAGES.exercises.mount = () => {
  const mustLeft = EXERCISES.filter((ex) => ex.must && !isDone(ex.id));
  if (state.mustTipSeen || state.session || state.pause || !mustLeft.length)
    return;
  state.mustTipSeen = true;
  save();
  openModal({
    title: "Tired or busy this week?",
    text: `Your ${EXERCISES.filter((ex) => ex.must).length} must-dos are enough. Finishing them counts as this week's progress, about ${minutesOf(mustLeft)} min.`,
    confirm: "OK, got it",
    style: "secondary",
    cancel: "",
    center: true,
  });
};

/* Switching tabs picks every open exercise in the new tab. */
ACTIONS["exercise-tab"] = (el) => {
  if (state.session) return;
  state.exerciseTab = el.dataset.value === "must" ? "must" : "all";
  state.workoutSelection = null;
  save();
  rerender();
  $(`[data-action="exercise-tab"][data-value="${state.exerciseTab}"]`)?.focus({
    preventScroll: true,
  });
};

function updateWorkoutSelection(el) {
  const ex = exerciseById(el.dataset.exerciseId);
  if (state.pause || state.session || !ex || isDone(ex.id)) return;
  const ids = new Set(workoutExercises().map((item) => item.id));
  if (el.checked) ids.add(el.dataset.exerciseId);
  else ids.delete(el.dataset.exerciseId);
  state.workoutSelection = openExercises()
    .filter((item) => ids.has(item.id))
    .map((item) => item.id);
  save();
  rerender();
  $(`#${el.id}`)?.focus({ preventScroll: true });
}

/* Native checkbox input events support both tapping and the Space key. */
EXERCISES.forEach((ex) => {
  INPUTS[`workout-${ex.id}`] = updateWorkoutSelection;
});

function setWorkoutSelection(ids, action) {
  if (state.pause || state.session) return;
  state.workoutSelection = ids;
  save();
  rerender();
  $(`[data-action="${action}"]`)?.focus({ preventScroll: true });
}
ACTIONS["select-all-exercises"] = () => {
  setWorkoutSelection(
    openExercises().map((ex) => ex.id),
    "select-all-exercises",
  );
};
ACTIONS["clear-exercises"] = () => {
  setWorkoutSelection([], "clear-exercises");
};

function sessionReturnPath(session = state.session) {
  return session?.returnTo === "/home" ? "/home" : "/exercises";
}

function startSession(ids, returnTo = "/exercises") {
  if (state.pause) return;
  if (state.session) {
    go("/session");
    return;
  }
  const validIds = EXERCISES.filter(
    (ex) => Array.isArray(ids) && ids.includes(ex.id),
  ).map((ex) => ex.id);
  if (!validIds.length) return;
  if (timer) clearInterval(timer.id);
  timer = null;
  state.session = {
    ids: validIds,
    index: 0,
    done: [],
    variants: {},
    returnTo: sessionReturnPath({ returnTo }),
  };
  state.workoutSelection = null;
  state.draft = { feeling: "", discomfort: 0, note: "" };
  save();
  go("/session");
}
ACTIONS["start-selected"] = () => {
  startSession(workoutExercises().map((ex) => ex.id));
};
ACTIONS["open-exercise"] = (el) => {
  startSession([el.dataset.id], "/home");
};

/* ---------- Player ---------- */

/* Pain button: a small round floating icon at the bottom right, like a chat button in a banking app.
   It sits just above the workout buttons, below the steps.
   Hover (laptop) or keyboard focus shows its message. One tap stops the workout and opens "Tell your PT". */
function painButton() {
  return `<button type="button" class="pain-fab" data-action="report-pain" aria-label="Feel severe pain? Report to your PT now">${icon("alert")}<span class="pain-fab-label">Feel severe pain? Report to your PT now</span></button>`;
}

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
        <ol class="steps">${exerciseSteps(ex, easier)
          .map((step) => `<li>${step}</li>`)
          .join("")}</ol>
      </div>
      <footer class="screen-footer player-footer">${painButton()}<p class="next-up">${next ? `Next up: ${next.name} · ${next.minutes} min` : "Next up: a quick check-in"}</p>
        <div class="player-actions"><button type="button" class="button primary full timer-btn" data-action="timer-toggle"></button>${button(next ? "Done, next exercise" : "Done, tell your PT how it felt", { action: "next-exercise", style: "secondary", cls: "player-done" })}</div><p class="timer-hint">Timer is a guide. Tap Done after your sets or holds.</p></footer>
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
    go(sessionReturnPath(s), { replace: true });
    toast("Session ended. Nothing was skipped for good.");
    return;
  }
  save();
  go("/checkin", { replace: true });
}
ACTIONS["next-exercise"] = () => advance(true);

/* Pain during an exercise: stop the workout now and go straight to the check-in,
   so the PT can be told without finishing the other exercises first. */
/* Tapped the pain button by mistake: the back arrow returns to the same exercise. Nothing done is lost. */
ACTIONS["resume-exercise"] = () => {
  const s = state.session;
  if (!s || !s.painStop) return;
  s.index = s.painIndex ?? s.ids.indexOf(s.painStop);
  delete s.painStop;
  delete s.painIndex;
  state.draft = { feeling: "", discomfort: 0, note: "" };
  save();
  go("/session", { replace: true });
};

ACTIONS["report-pain"] = () => {
  const s = state.session;
  if (!s) return;
  s.painStop = s.ids[s.index];
  s.painIndex = s.index; // so "Back to …" can return to this exercise
  s.index = s.ids.length;
  if (timer) clearInterval(timer.id);
  state.draft = { feeling: "Too hard", discomfort: 0, note: "" };
  save();
  go("/checkin", { replace: true });
};

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
      go(sessionReturnPath(s), { replace: true });
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
    state.session && (state.session.done.length || state.session.painStop)
      ? null
      : "/exercises",
  render() {
    const s = state.session;
    const d = state.draft;
    const stopped = s.painStop ? exerciseById(s.painStop) : null;
    const sub = stopped
      ? `Stopped during ${stopped.name.toLowerCase()}${s.done.length ? ` · ${s.done.length} done before` : ""}`
      : `${s.done.length} exercise${s.done.length === 1 ? "" : "s"} done`;
    return `<form class="screen screen-checkin" data-submit="checkin"><header class="screen-header">${stopped ? `<button type="button" class="icon-button" data-action="resume-exercise" aria-label="Back to ${stopped.name.toLowerCase()}">${icon("back")}</button>` : `<button type="button" class="icon-button" data-action="leave-checkin" aria-label="Leave check-in">${icon("close")}</button>`}<div class="screen-title"><h1>${stopped ? "Tell your PT" : "Quick check-in"}</h1><p class="muted">${sub}</p></div></header>
      <div class="screen-body">
        <fieldset class="field-group"><legend>1. How did it feel?</legend><div class="choice-grid four">${["Easy", "OK", "Hard", "Too hard"].map((f) => chip(f, { action: "feeling", pressed: d.feeling === f })).join("")}</div></fieldset>
        ${discomfortField("discomfort", d.discomfort, stopped ? "2. How bad is the pain?" : "2. Any discomfort?")}
        <div class="field-group"><label for="note">3. Anything to tell your PT? <span>(optional)</span></label><textarea id="note" rows="3" maxlength="500" placeholder="e.g. My shoulder clicked on the last set">${esc(d.note)}</textarea></div>
      </div>
      <footer class="screen-footer"><button type="submit" class="button primary full" id="save-checkin" ${canSaveCheckin() ? "" : "disabled"}>Save</button><p class="field-hint center" id="save-hint">${saveHint()}</p></footer>
    </form>`;
  },
};

ACTIONS["leave-checkin"] = () => {
  const n = state.session.done.length;
  const returnTo = sessionReturnPath();
  const painText = state.session.painStop
    ? "Your PT won't be told about the pain."
    : "";
  openModal({
    title: "Leave without saving?",
    text: n
      ? `Your ${n} exercise${n === 1 ? "" : "s"} won't be marked as done. ${painText}`
      : painText,
    confirm: "Keep checking in",
    cancel: "Leave without saving",
    onCancel: () => {
      state.session = null;
      state.draft = { feeling: "", discomfort: 0, note: "" };
      save();
      go(returnTo, { replace: true });
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
  if (!canSaveCheckin()) return;
  confirmSevere(state.draft.discomfort, saveCheckin, "discomfort");
};

/* A rating of 8 or more alerts the PT. Ask once first, so a wrong tap can be fixed. */
function confirmSevere(value, onSend, sliderId) {
  if (value < SEVERE) return onSend();
  openModal({
    title: `You rated ${value} out of 10. Tell your PT?`,
    text: "Your PT will be told right away and may pause this week's exercises. If this was a mistake, change your rating.",
    confirm: "Yes, tell my PT",
    style: "danger",
    cancel: "Change my rating",
    onConfirm: onSend,
    onCancel: () => $(`#${sliderId}`)?.focus(),
  });
}

function saveCheckin() {
  const s = state.session;
  const d = state.draft;
  if (!s) return;
  const entry = {
    id: `checkin-${Date.now()}`,
    ids: [...s.done],
    stoppedAt: s.painStop || null,
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
    const detail = entry.stoppedAt
      ? `during ${exerciseById(entry.stoppedAt).name.toLowerCase()}`
      : `after ${entry.ids.map((id) => exerciseById(id).name.toLowerCase()).join(" and ")}`;
    reportSevere(entry.discomfort, detail);
  }
  go("/done", { replace: true });
}

/* ---------- Completed ---------- */

PAGES.done = {
  guard: () => (state.lastCheckin ? null : "/home"),
  render() {
    const e = state.lastCheckin;
    const severe = e.discomfort >= SEVERE;
    return `<section class="screen screen-done"><div class="screen-body completion-content">
      <div class="success-mark">${icon("check")}</div><h1>${e.stoppedAt ? "Saved" : "Completed"}</h1><p class="muted">${e.stoppedAt ? "Thanks for telling us. Rest now." : "Nice work making time for yourself."}</p>
      ${severe ? `<div class="info-card is-alert">${icon("alert")}<p><strong>Your PT has been told.</strong> Stop for now if it hurts.</p></div>` : ""}
      <div class="session-summary"><span class="summary-label">${relDay(e.at)}</span><p>${[...e.ids.map((id) => exerciseById(id).name), ...(e.stoppedAt ? [`Stopped during ${exerciseById(e.stoppedAt).name.toLowerCase()}`] : [])].join(" · ")}</p><p class="small muted">${e.feeling ? `${esc(e.feeling)} · ` : ""}Discomfort ${e.discomfort}/10${e.note ? " · 1 note" : ""}</p></div>
      <p class="small muted">${savedToDevice ? "Saved on this device." : "Browser saving is off, so this is kept until the page closes."}</p>
    </div><footer class="screen-footer stack-footer">${button("Back to home", { href: "#/home" })}${button("Log a moment", { href: "#/log/new", style: "secondary" })}</footer></section>`;
  },
};
