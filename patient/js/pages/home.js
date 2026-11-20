"use strict";
/* Home: greeting, goal chart, visit reminder, paused notice and the plan card. */

function greetingWord() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* Goal chart. Each dot is how hard the goal felt at a visit (0 = easy, 10 = very hard).
   Lower is better, like the discomfort scale. Used on Home and on Progress.
   It works like a stock chart: tap or slide along it. A dashed line follows the finger,
   a small label at its top shows that visit, and the big number above updates. */
const CHART = { left: 26, right: 284, top: 30, bottom: 112, height: 134 };
const chartY = (v) => CHART.bottom - (v / 10) * (CHART.bottom - CHART.top);
const chartX = (i) =>
  CHART.left +
  (i * (CHART.right - CHART.left)) / Math.max(VISITS.length - 1, 1);
const tipText = (i) =>
  `${VISITS[i].hard}/10 · ${fmtShort(visitDate(VISITS[i]))}`;

/* Label on the dashed goal line: the target score. Lower is easier. */
function goalLabel() {
  const left = VISITS[VISITS.length - 1].hard - PATIENT.goalTarget;
  if (left <= 0) return `Goal reached: ${PATIENT.goalTarget} or lower`;
  return `Goal: get down to ${PATIENT.goalTarget}`;
}

function goalChart(label) {
  const last = VISITS.length - 1;
  const line = VISITS.map((v, i) => `${chartX(i)},${chartY(v.hard)}`).join(" ");
  const goalY = chartY(PATIENT.goalTarget);
  const summary = VISITS.map(
    (v) => `${fmtShort(visitDate(v))}: ${v.hard}`,
  ).join(", ");
  return `<svg class="comfort-chart" viewBox="0 0 300 ${CHART.height}" role="slider" tabindex="0" aria-label="${label}. ${summary}. Goal: ${PATIENT.goalTarget} or lower. Use the arrow keys to move between visits." aria-valuemin="1" aria-valuemax="${VISITS.length}" aria-valuenow="${VISITS.length}" data-goal-chart>
    <g class="chart-grid">${[0, 5, 10].map((v) => `<path d="M${CHART.left} ${chartY(v)}H${CHART.right}"/>`).join("")}</g>
    <g class="chart-axis">${[0, 5, 10].map((v) => `<text x="${CHART.left - 8}" y="${chartY(v) + 3.5}" text-anchor="end">${v}</text>`).join("")}</g>
    <path class="chart-goal" d="M${CHART.left} ${goalY}H${CHART.right}"/>
    <text class="chart-goal-label" x="${CHART.left + 4}" y="${goalY - 5}">${goalLabel()}</text>
    <line class="chart-cursor" x1="${chartX(last)}" x2="${chartX(last)}" y1="${CHART.top - 6}" y2="${CHART.bottom}"/>
    <polyline class="chart-line" points="${line}"/>
    ${VISITS.map((v, i) => `<circle class="chart-dot ${i === last ? "is-active" : ""}" data-i="${i}" cx="${chartX(i)}" cy="${chartY(v.hard)}" r="${i === last ? 6 : 4}"/>`).join("")}
    <g class="chart-axis chart-dates">${VISITS.map((v, i) => `<text data-i="${i}" class="${i === last ? "is-active" : ""}" x="${chartX(i)}" y="${CHART.height - 4}" text-anchor="${i === 0 ? "start" : i === last ? "end" : "middle"}" ${i === 0 ? `dx="-6"` : i === last ? `dx="6"` : ""}>${fmtShort(visitDate(v))}</text>`).join("")}</g>
    <g class="chart-tipbox"><rect rx="4" ry="4" height="18"/><text y="12.5" text-anchor="middle">${tipText(last)}</text></g>
    <rect class="chart-hit" x="0" y="0" width="300" height="${CHART.height}"/>
  </svg>`;
}

/* Place the small label at the top of the dashed line, kept inside the chart. */
function placeTip(svg, i) {
  const box = $(".chart-tipbox", svg);
  const text = $("text", box);
  text.textContent = tipText(i);
  const w =
    (text.getComputedTextLength ? text.getComputedTextLength() : 50) + 14;
  const cx = Math.min(Math.max(chartX(i), w / 2 + 2), 300 - w / 2 - 2);
  const rect = $("rect", box);
  rect.setAttribute("width", w);
  rect.setAttribute("x", cx - w / 2);
  rect.setAttribute("y", 0);
  text.setAttribute("x", cx);
}

/* The big number above the chart: score, change since the visit before, and the date. */
function chartReadout(i, withLink) {
  const v = VISITS[i];
  const before = VISITS[i - 1];
  const isLast = i === VISITS.length - 1;
  let change = "First visit";
  if (before) {
    const diff = v.hard - before.hard;
    change =
      diff < 0
        ? `<span class="is-better">${icon("arrowDown")} ${-diff} ${-diff === 1 ? "point" : "points"} easier than last visit</span>`
        : diff > 0
          ? `<span class="is-worse">${icon("arrowUp")} ${diff} ${diff === 1 ? "point" : "points"} harder than last visit</span>`
          : "Same as last visit";
  }
  return `<div class="readout-row"><strong class="readout-value">${v.hard}<small>/10</small></strong>${withLink ? `<a class="readout-link" href="#/visit/${v.id}">See visit ${icon("chevron")}</a>` : ""}</div>
    <p class="readout-meta">${change} · ${fmtShort(visitDate(v))}${isLast ? " (latest)" : ""}</p>`;
}

function chartBlock(label, withLink = false) {
  return `<div class="chart-block" data-link="${withLink ? "1" : ""}">
    <div class="chart-readout" aria-live="polite">${chartReadout(VISITS.length - 1, withLink)}</div>
    ${goalChart(label)}
  </div>`;
}

/* Make every chart on the screen respond to taps, drags and arrow keys. */
function mountGoalCharts() {
  $$("[data-goal-chart]", app).forEach((svg) => {
    const block = svg.closest(".chart-block");
    const withLink = block.dataset.link === "1";
    let current = VISITS.length - 1;
    placeTip(svg, current);
    const select = (i) => {
      i = Math.max(0, Math.min(VISITS.length - 1, i));
      if (i === current) return;
      current = i;
      const cursor = $(".chart-cursor", svg);
      cursor.setAttribute("x1", chartX(i));
      cursor.setAttribute("x2", chartX(i));
      $$(".chart-dot", svg).forEach((dot) => {
        const on = Number(dot.dataset.i) === i;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("r", on ? 6 : 4);
      });
      $$(".chart-dates text", svg).forEach((t) =>
        t.classList.toggle("is-active", Number(t.dataset.i) === i),
      );
      placeTip(svg, i);
      svg.setAttribute("aria-valuenow", i + 1);
      $(".chart-readout", block).innerHTML = chartReadout(i, withLink);
    };
    const fromPointer = (event) => {
      const box = svg.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width) * 300;
      let best = 0;
      VISITS.forEach((_, i) => {
        if (Math.abs(chartX(i) - x) < Math.abs(chartX(best) - x)) best = i;
      });
      select(best);
    };
    svg.addEventListener("pointerdown", (event) => {
      svg.setPointerCapture(event.pointerId);
      fromPointer(event);
    });
    svg.addEventListener("pointermove", (event) => {
      if (
        event.pointerType === "mouse" ||
        svg.hasPointerCapture(event.pointerId)
      )
        fromPointer(event);
    });
    svg.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") select(current - 1);
      else if (event.key === "ArrowRight") select(current + 1);
      else return;
      event.preventDefault();
    });
  });
}

/* Home goal card: the goal, then "How hard it feels" with the scale and a link to Progress, then the interactive chart. */
function goalCard() {
  return `<section class="goal-card" aria-labelledby="goal-title">
    <div class="goal-top"><span class="eyebrow">My goal</span><a class="goal-progress-link" href="#/progress">See progress ${icon("chevron")}</a></div>
    <h2 id="goal-title">${esc(PATIENT.goal)}</h2>
    <div class="goal-chart-area">
      <p class="goal-stat-label">How hard it feels</p>
      <p class="chart-legend"><strong>0</strong> = easy · <strong>10</strong> = very hard</p>
      ${chartBlock("How hard carrying your daughter feels, rated at each visit")}
    </div>
  </section>`;
}

function pauseCard() {
  const msg = state.messages.find((m) => m.kind === "pause");
  return `<section class="alert-card" role="status">
    <div class="alert-heading">${icon("alert")}<strong>Exercises paused by your PT</strong></div>
    <p>You rated your discomfort ${state.pause.value} out of 10. Your PT asked you to stop this week's exercises until you talk.</p>
    ${msg ? button("Read message", { href: `#/inbox/${msg.id}`, style: "secondary" }) : ""}
  </section>`;
}

function pendingCard() {
  return `<section class="info-card" role="status">${icon("clock")}<p><strong>Your PT has been told.</strong> You rated your discomfort ${state.alertPending.value}. Stop for now if it hurts. Your PT will reply soon.</p></section>`;
}

function visitReminder() {
  const visit = nextVisit();
  const days = daysUntil(visit);
  if (days > 3) return "";
  const when =
    days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  const notes = state.prep.questions.length;
  return `<a class="reminder-card" href="#/prep">
    <span class="reminder-icon">${icon("calendar")}</span>
    <span class="row-text"><strong>Visit ${when}</strong><small>${fmtDay(visit)} · ${PLAN.nextVisitTime}</small></span>
    <span class="reminder-link">${notes ? `${notes} note${notes === 1 ? "" : "s"}` : "Get ready"}</span>${icon("chevron", "row-chevron")}
  </a>`;
}

/* Buddy card: one card for everything buddy-related on Home.
   Top: plans with buddies (or a short prompt if there are none).
   Bottom row, inside the card: "Request a favor" and "Add a buddy", side by side. */
function buddyCard() {
  const active = state.buddies.filter((b) => b.status === "active");
  const plans = state.requests
    .filter((r) => buddyById(r.buddy) && new Date(r.day) >= daysFromToday(-1))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(0, 2);

  let body = `<p class="buddy-empty">Busy week? Ask a buddy to cover a chore, so you have time for your exercises.</p>`;
  if (!active.length)
    body = `<p class="buddy-empty">Recovery is easier with help. Add someone you trust, like a partner or a friend.</p>`;
  if (active.length && plans.length)
    body = `<ul class="buddy-plan-list">${plans
      .map((r) => {
        const b = buddyById(r.buddy);
        const what =
          r.kind === "join"
            ? `${esc(b.name)} joins your ${r.exercises === "must" ? "must-dos" : "exercises"}`
            : esc(r.chore);
        const when = `${relDay(r.day)} ${r.slot.toLowerCase()}`;
        const sub =
          r.status === "yes"
            ? `${esc(b.name)} · ${when}`
            : `Asked ${esc(b.name)} · no reply yet`;
        return `<li><a class="buddy-plan ${r.status === "yes" ? "" : "is-waiting"}" href="#/plan/${r.id}">${avatar(b.name, r.status === "yes" ? "" : "pending")}<span class="row-text"><strong>${what}</strong><small>${sub}</small></span>${icon("chevron", "row-chevron")}</a></li>`;
      })
      .join("")}</ul>`;

  const actions = active.length
    ? `<a class="buddy-action" href="#/ask">${icon("raiseHand")}<span>${plans.length ? "Request another favor" : "Request a favor"}</span></a><a class="buddy-action" href="#/buddy/add">${icon("plus")}<span>Add a buddy</span></a>`
    : `<a class="buddy-action" href="#/buddy/add">${icon("plus")}<span>Add a buddy</span></a>`;

  return `<section class="card buddy-box" aria-labelledby="buddy-title">
    <div class="buddy-box-body">
      <div class="card-heading"><h2 id="buddy-title">${plans.length && active.length ? "Plans with your buddies" : "Recovery buddies"}</h2></div>
      ${body}
    </div>
    <div class="buddy-actions">${actions}</div>
  </section>`;
}

/* One progress row: label, "1 of 3 done", minutes left and a bar that fills up. */
function planMeter(label, list, cls = "") {
  const done = list.filter((ex) => isDone(ex.id));
  const left = list.filter((ex) => !isDone(ex.id));
  const pct = Math.round((done.length / list.length) * 100);
  return `<div class="plan-meter-row ${cls}">
    <div class="plan-meter"><span class="meter-label">${label}</span><span class="meter-count"><strong>${done.length} of ${list.length}</strong> done</span></div>
    <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${label}: ${done.length} of ${list.length} done"><span style="width:${pct}%"></span></div>
    <p class="meter-time">${left.length ? `About ${minutesOf(left)} min to finish` : `${icon("check")} All done`}</p>
  </div>`;
}

/* Plan card: no exercise list here. It shows how far Maya is, how long is left,
   and that the must-dos alone count as this week's progress. The list opens on the next page. */
function planCard() {
  const must = EXERCISES.filter((ex) => ex.must);
  const mustLeft = must.filter((ex) => !isDone(ex.id));
  const left = remaining();
  const anyDone = left.length < EXERCISES.length;

  let message = `<strong>Tired or busy this week?</strong> Finishing just your ${must.length} must-dos counts as this week's progress.`;
  if (!mustLeft.length)
    message = `<strong>Your must-dos are done.</strong> This week counts. Anything else is a bonus.`;
  if (!left.length)
    message = `<strong>Your whole plan is done.</strong> Great work this week.`;

  let action = button(
    `${anyDone ? "Continue exercises" : "Start exercises"} ${icon("chevron")}`,
    { href: "#/exercises" },
  );
  if (!left.length)
    action = button(`See exercises ${icon("chevron")}`, {
      href: "#/exercises",
      style: "secondary",
    });
  if (state.session && !state.pause)
    action = button(`Resume workout ${icon("chevron")}`, { href: "#/session" });
  if (state.pause)
    action = button(`${icon("lock")} Paused by your PT`, { attrs: "disabled" });

  return `<section class="card plan-card ${state.pause ? "is-paused" : ""}" aria-labelledby="plan-title">
    <div class="card-heading"><h2 id="plan-title">Until your next visit</h2><span class="date-chip">${fmtDay(nextVisit())}</span></div>
    <p class="must-message ${mustLeft.length ? "" : "is-done"}">${icon(mustLeft.length ? "heart" : "check")}<span>${state.pause ? "<strong>Paused by your PT.</strong> Rest until you talk." : message}</span></p>
    ${planMeter("Must-dos", must, "is-must")}
    ${planMeter("All exercises", EXERCISES)}
    ${action}
  </section>`;
}

PAGES.home = {
  tab: "home",
  render() {
    const unread = unreadCount();
    return `<section class="screen screen-home">
      <header class="home-top"><p class="today">${fmtWeekday(new Date())}, ${fmtShort(new Date())}</p>
        <a class="icon-button bell" href="#/inbox" aria-label="Messages${unread ? `, ${unread} new` : ""}">${icon("bell")}${unread ? `<span class="badge-dot">${unread}</span>` : ""}</a></header>
      <div class="screen-body">
        <h1 class="greeting">${greetingWord()}, <em>${PATIENT.name}</em></h1>
        ${state.pause ? pauseCard() : state.alertPending ? pendingCard() : ""}
        ${goalCard()}
        ${planCard()}
        ${buddyCard()}
        ${visitReminder()}
        <p class="section-caption">A little progress, at your pace.</p>
      </div>
    </section>`;
  },
  mount: mountGoalCharts,
};

/* ---------- Visit prep: opened from the Home reminder or Progress ---------- */

function prepSummary() {
  const start = planStart();
  const done = EXERCISES.filter((ex) => isDone(ex.id)).length;
  const moments = state.moments.filter((m) => new Date(m.at) >= start);
  const all = [
    ...moments.map((m) => m.discomfort),
    ...state.checkins.map((c) => c.discomfort),
  ];
  const highest = all.length ? Math.max(...all) : 0;
  return receipt([
    ["Exercises done", `${done} of ${EXERCISES.length}`],
    ["Moments logged", moments.length],
    ["Highest discomfort", `${highest}/10`, highest >= SEVERE],
  ]);
}

PAGES.prep = {
  tab: "home",
  render() {
    const notes = state.prep.questions;
    return `<section class="screen screen-prep">${header("Get ready for your visit", "#/home", { sub: `${fmtDay(nextVisit())} · ${PLAN.nextVisitTime} · ${PT.clinic}` })}
      <div class="screen-body">
        <h2 class="section-title">Since your last visit</h2>
        ${prepSummary()}
        <h2 class="section-title">Questions and notes for your PT</h2>
        ${
          notes.length
            ? `<div class="card list-card">${notes
                .map(
                  (q, i) =>
                    `<a class="list-row link-row note-row" href="#/prep/note/${i}" aria-label="Edit note: ${esc(q)}"><span class="row-text">${esc(q)}</span>${icon("edit", "row-chevron")}</a>`,
                )
                .join("")}</div>`
            : '<p class="empty-state">No notes yet. Add anything you want to ask or tell your PT.</p>'
        }
        <div class="add-note">${button(`${icon("plus")} Add a note`, { href: "#/prep/note", style: "secondary" })}</div>
      </div>
    </section>`;
  },
};

/* Add or edit one note. No index = a new note. */
PAGES.prepNote = {
  guard: ({ index }) =>
    index === undefined || state.prep.questions[Number(index)] !== undefined
      ? null
      : "/prep",
  render({ index }) {
    const editing = index !== undefined;
    const text = editing ? state.prep.questions[Number(index)] : "";
    return `<form class="screen screen-note" data-submit="prep-note" data-index="${editing ? index : ""}">${header(editing ? "Edit note" : "Add a note", "#/prep", { closeIcon: true })}
      <div class="screen-body">
        <div class="field-group"><label for="note-text">Question or note for your PT</label><textarea id="note-text" rows="4" maxlength="300" placeholder="e.g. Can I go back to yoga?">${esc(text)}</textarea></div>
      </div>
      <footer class="screen-footer stack-footer"><p id="note-error" class="form-error" role="alert" hidden></p><button type="submit" class="button primary full">Save note</button>${editing ? button(`${icon("trash")} Delete note`, { action: "delete-note", style: "danger-quiet", attrs: `data-index="${index}"` }) : ""}</footer>
    </form>`;
  },
  mount() {
    const box = $("#note-text");
    box.focus({ preventScroll: true });
    box.setSelectionRange(box.value.length, box.value.length);
  },
};

SUBMITS["prep-note"] = (form) => {
  const text = $("#note-text").value.trim();
  if (!text) {
    const err = $("#note-error");
    err.textContent = "Write your question or note first.";
    err.hidden = false;
    $("#note-text").setAttribute("aria-invalid", "true");
    return;
  }
  const index = form.dataset.index;
  if (index === "") state.prep.questions.push(text);
  else state.prep.questions[Number(index)] = text;
  save();
  go("/prep", { replace: true });
  toast("Note saved");
};

ACTIONS["delete-note"] = (el) => {
  openModal({
    title: "Delete this note?",
    text: "Your PT won't see it anymore.",
    confirm: "Delete",
    style: "danger",
    cancel: "Keep note",
    onConfirm: () => {
      state.prep.questions.splice(Number(el.dataset.index), 1);
      save();
      go("/prep", { replace: true });
      toast("Note deleted");
    },
  });
};

/* ---------- Messages: from the PT and buddies ---------- */

PAGES.inbox = {
  tab: "home",
  render() {
    const list = [...state.messages].sort((a, b) => b.at.localeCompare(a.at));
    return `<section class="screen screen-inbox">${header("Messages", "#/home")}
      <div class="screen-body"><ul class="message-list">${list
        .map(
          (m) =>
            `<li><a class="message-row ${m.read ? "" : "unread"} ${m.kind === "pause" ? "is-alert" : ""}" href="#/inbox/${m.id}">${avatar(m.from)}<span class="row-text"><span class="message-top"><strong>${esc(m.from)}</strong><small>${relDay(m.at)}</small></span><span class="message-title">${esc(m.title)}</span></span>${m.read ? "" : '<span class="unread-dot" aria-label="New"></span>'}</a></li>`,
        )
        .join("")}</ul></div>
    </section>`;
  },
};

PAGES.message = {
  tab: "home",
  guard: ({ id }) =>
    state.messages.some((m) => m.id === id) ? null : "/inbox",
  render({ id }) {
    const m = state.messages.find((item) => item.id === id);
    let actions = "";
    if (m.kind === "pause")
      actions = `${button(`${icon("phone")} Call ${PT.clinic}`, { action: "call-clinic" })}${button("OK, I'll rest", { href: "#/home", style: "secondary" })}`;
    if (m.kind === "plan")
      actions = button(`See this week's exercises ${icon("chevron")}`, {
        href: "#/exercises",
      });
    if (m.kind === "buddy" && m.buddy)
      actions = button(`Open ${esc(m.from)}`, {
        href: `#/buddy/${m.buddy}`,
        style: "secondary",
      });
    return `<section class="screen screen-message">${header(esc(m.from), "#/inbox", { sub: `${relDay(m.at)} · ${fmtTime(m.at)}` })}
      <div class="screen-body"><article class="message-card ${m.kind === "pause" ? "is-alert" : ""}">${m.kind === "pause" ? `<p class="alert-heading">${icon("alert")}<strong>Exercises paused</strong></p>` : ""}<h2>${esc(m.title)}</h2><p>${esc(m.text)}</p></article></div>
      ${actions ? `<footer class="screen-footer stack-footer">${actions}</footer>` : ""}
    </section>`;
  },
  mount({ id }) {
    const m = state.messages.find((item) => item.id === id);
    if (m && !m.read) {
      m.read = true;
      save();
    }
  },
};

ACTIONS["call-clinic"] = () => toast("Calling is turned off in this prototype");
