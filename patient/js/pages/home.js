"use strict";
/* Home: greeting, goal chart, visit reminder, paused notice and the plan card. */

function greetingWord() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* Goal chart. Each dot is the score Maya and her PT rated at a visit.
   Used on Home (dark card) and on Progress (light card). */
function goalChart(label = "Goal chart") {
  const points = VISITS.map((v) => ({ date: visitDate(v), value: v.comfort }));
  const left = 30;
  const right = 268;
  const top = 12;
  const bottom = 112;
  const y = (v) => bottom - (v / 10) * (bottom - top);
  const x = (i) => left + (i * (right - left)) / Math.max(points.length - 1, 1);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const last = points[points.length - 1];
  const goalY = y(PATIENT.goalTarget);
  const summary = points
    .map((p) => `${fmtShort(p.date)}: ${p.value}`)
    .join(", ");
  return `<svg class="comfort-chart" viewBox="0 0 300 136" role="img" aria-label="${label}. ${summary}. Goal: ${PATIENT.goalTarget} out of 10.">
    <g class="chart-grid">${[0, 5, 10].map((v) => `<path d="M${left} ${y(v)}H${right + 10}"/>`).join("")}</g>
    <g class="chart-axis">${[0, 5, 10].map((v) => `<text x="${left - 8}" y="${y(v) + 3.5}" text-anchor="end">${v}</text>`).join("")}</g>
    <path class="chart-goal" d="M${left} ${goalY}H${right + 10}"/>
    <text class="chart-goal-label" x="${left + 4}" y="${goalY - 5}">Goal ${PATIENT.goalTarget}</text>
    <polyline class="chart-line" points="${line}"/>
    ${points.map((p, i) => `<circle class="chart-dot ${p === last ? "now" : ""}" cx="${x(i)}" cy="${y(p.value)}" r="${p === last ? 6 : 4.5}"/>`).join("")}
    <text class="chart-value" x="${x(points.length - 1) - 12}" y="${y(last.value) + 4.5}" text-anchor="end">${last.value}</text>
    <g class="chart-axis">${points.map((p, i) => `<text x="${x(i)}" y="130" text-anchor="${i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}" ${i === 0 ? `dx="-4"` : i === points.length - 1 ? `dx="6"` : ""}>${fmtShort(p.date)}</text>`).join("")}</g>
  </svg>`;
}

function goalCard() {
  const first = VISITS[0];
  const last = VISITS[VISITS.length - 1];
  return `<section class="goal-card" aria-labelledby="goal-title">
    <div class="goal-heading"><span class="eyebrow">My goal</span></div>
    <h2 id="goal-title">${esc(PATIENT.goal)}</h2>
    <p class="chart-question">${esc(PATIENT.goalQuestion)}</p>
    <p class="chart-legend"><strong>0</strong> = very hard · <strong>10</strong> = easy</p>
    ${goalChart("How easy carrying your daughter feels, rated at each visit")}
    <p class="goal-caption">Your comfort went up <strong>${last.comfort - first.comfort} points</strong> since ${fmtMonth(visitDate(first))}.</p>
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

/* Buddy card: plans with buddies, so the feature is easy to find.
   No plans yet: a "Busy week?" prompt. With plans: a short list. + asks any buddy, a plan row opens that plan. */
function buddyCard() {
  const active = state.buddies.filter((b) => b.status === "active");
  if (!active.length)
    return `<a class="buddy-card" href="#/buddy/add"><span class="row-icon">${icon("heart")}</span><span class="row-text"><strong>Get a hand from someone you trust</strong><small>Add a recovery buddy</small></span>${icon("chevron", "row-chevron")}</a>`;
  const plans = state.requests
    .filter((r) => buddyById(r.buddy) && new Date(r.day) >= daysFromToday(-1))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(0, 2);
  if (!plans.length)
    return `<a class="buddy-card" href="#/ask"><span class="row-icon">${icon("heart")}</span><span class="row-text"><strong>Busy week?</strong><small>Ask a buddy to cover a chore so you have time</small></span>${icon("chevron", "row-chevron")}</a>`;
  return `<section class="card buddy-plans" aria-labelledby="buddy-title">
    <div class="card-heading"><h2 id="buddy-title">Plans with your buddies</h2><a class="icon-button add-plan" href="#/ask" aria-label="Ask a buddy for a hand">${icon("plus")}</a></div>
    <ul>${plans
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
      .join("")}</ul>
  </section>`;
}

/* The plan card keeps the same layout before and after Maya starts. */
function planCard() {
  const done = EXERCISES.filter((ex) => isDone(ex.id));
  const left = remaining();
  const pct = Math.round((done.length / EXERCISES.length) * 100);
  let copy = `New plan from your PT. No rush, start whenever you're ready.`;
  if (done.length && left.length)
    copy = "Nice start! Pick up the rest whenever you're ready.";
  if (!left.length)
    copy = "Your plan is complete. Nice work making time for yourself.";
  if (state.pause) copy = `Paused by your PT. Rest until you talk.`;

  let action = button(`Start exercises ${icon("chevron")}`, {
    href: "#/exercises",
  });
  if (state.session && !state.pause)
    action = button(`Resume session ${icon("chevron")}`, { href: "#/session" });
  else if (done.length && left.length)
    action = button(`Continue · ${left.length} left ${icon("chevron")}`, {
      href: "#/exercises",
    });
  else if (!left.length)
    action = button("See this week's exercises", {
      href: "#/exercises",
      style: "secondary",
    });
  if (state.pause)
    action = button(`${icon("lock")} Paused by your PT`, {
      style: "primary",
      attrs: "disabled",
    });

  return `<section class="card plan-card ${state.pause ? "is-paused" : ""}" aria-labelledby="plan-title">
    <div class="card-heading"><h2 id="plan-title">Until your next visit</h2><span class="date-chip">${fmtDay(nextVisit())}</span></div>
    <p class="plan-copy">${copy}</p>
    <div class="plan-meter"><span class="meter-label"><strong>${done.length} of ${EXERCISES.length}</strong> done</span><span class="muted">about ${minutesOf(left)} min left</span></div>
    <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Plan progress"><span style="width:${pct}%"></span></div>
    <ul class="plan-list">${EXERCISES.map(
      (ex) =>
        `<li class="plan-item ${isDone(ex.id) ? "done" : ""}"><span class="plan-name">${ex.name}</span><span class="plan-status">${isDone(ex.id) ? `${icon("check")} Done` : "Not started"}</span><span class="plan-min">${ex.minutes} min</span></li>`,
    ).join("")}</ul>
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
