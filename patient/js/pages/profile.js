"use strict";
/* Profile: Maya's info, recovery buddies (ask, add, remove) and settings. */

function requestLine(r) {
  const what =
    r.kind === "join"
      ? `Join my ${r.exercises === "must" ? "must-dos" : "exercises"}`
      : r.chore;
  return `${esc(what)} · ${relDay(r.day)} ${r.slot.toLowerCase()}`;
}
const statusLabel = (r) =>
  r.status === "yes"
    ? '<span class="status-pill yes">Confirmed</span>'
    : '<span class="status-pill">No reply yet</span>';
const planWhat = (r) =>
  r.kind === "join"
    ? `Join my ${r.exercises === "must" ? "must-dos" : "exercises"}`
    : esc(r.chore);
const planWhen = (r) => `${relDay(r.day)} ${r.slot.toLowerCase()}`;

PAGES.profile = {
  tab: "profile",
  render() {
    const active = state.buddies.filter((b) => b.status === "active");
    const invited = state.buddies.filter((b) => b.status === "invited");
    return `<section class="screen screen-profile">${header("Profile", null, { right: `<a class="icon-button" href="#/settings" aria-label="Settings">${icon("settings")}</a>` })}
      <div class="screen-body">
        <div class="profile-head">${avatar(PATIENT.name, "large")}<div><h2>${PATIENT.name}</h2><p class="muted">Patient at ${PT.clinic}</p></div></div>
        <div class="card list-card">
          <div class="list-row"><span class="row-icon">${icon("heart")}</span><span class="row-text"><strong>My goal</strong><small>${esc(PATIENT.goal)}</small></span></div>
          <div class="list-row"><span class="row-icon">${icon("profile")}</span><span class="row-text"><strong>${PT.name}</strong><small>${PT.role} · ${PT.clinic}</small></span></div>
          ${linkRow("#/prep", "Next visit", `${fmtDay(nextVisit())} · ${PLAN.nextVisitTime}`, { lead: `<span class="row-icon">${icon("calendar")}</span>` })}
        </div>
        <div class="section-head"><h2 class="section-title">Recovery buddies</h2><a class="text-link" href="#/buddy/add">${icon("plus")} Add</a></div>
        <div class="card list-card">${
          active
            .map((b) =>
              linkRow(
                `#/buddy/${b.id}`,
                esc(b.name),
                `${esc(b.relation)} · Buddy since ${fmtShort(b.since)}`,
                { lead: avatar(b.name) },
              ),
            )
            .join("") +
            invited
              .map(
                (b) =>
                  `<div class="list-row">${avatar(b.name, "pending")}<span class="row-text"><strong>${esc(b.name)}</strong><small>Invite sent · waiting</small></span></div>`,
              )
              .join("") ||
          `<div class="empty-state">No buddies yet. ${button(`${icon("plus")} Add a buddy`, { href: "#/buddy/add", style: "secondary" })}</div>`
        }</div>
      </div>
    </section>`;
  },
};

/* ---------- One buddy ---------- */

PAGES.buddy = {
  tab: "profile",
  guard: ({ id }) =>
    buddyById(id) && buddyById(id).status === "active" ? null : "/profile",
  render({ id }) {
    const b = buddyById(id);
    const mine = state.requests.filter((r) => r.buddy === id);
    return `<section class="screen screen-buddy">${header(esc(b.name), "#/profile", { right: `<button type="button" class="icon-button danger" data-action="remove-buddy" data-id="${id}" aria-label="Remove ${esc(b.name)} as a buddy">${icon("minus")}</button>` })}
      <div class="screen-body">
        <div class="profile-head">${avatar(b.name, "large")}<div><h2>${esc(b.name)}</h2><p class="muted">${esc(b.relation)} · Buddy since ${fmtShort(b.since)}</p></div></div>
        <h2 class="section-title">Coming up with ${esc(b.name)}</h2>
        ${
          mine.length
            ? `<div class="card list-card">${mine.map((r) => `<a class="list-row link-row" href="#/plan/${r.id}"><span class="row-icon">${icon(r.kind === "join" ? "heart" : "clock")}</span><span class="row-text"><strong>${planWhat(r)}</strong><small>${planWhen(r)}</small></span>${statusLabel(r)}${icon("chevron", "row-chevron")}</a>`).join("")}</div>`
            : `<p class="empty-state">No plans with ${esc(b.name)} yet. Ask for a hand when your week gets busy.</p>`
        }
        <h2 class="section-title">What ${esc(b.name)} can see</h2>
        <p class="card plain-card small">Your plan and the sessions you ask ${esc(b.name)} to join. Never your pain, moments or notes.</p>
      </div>
      <footer class="screen-footer">${button(`Ask ${esc(b.name)} for a hand`, { href: `#/buddy/${id}/ask` })}</footer>
    </section>`;
  },
};

function removeBuddy(id, after) {
  const b = buddyById(id);
  openModal({
    title: `Remove ${esc(b.name)}?`,
    text: `${esc(b.name)} won't see your plan anymore. Plans you made together are cancelled.`,
    confirm: "Remove",
    style: "danger",
    onConfirm: () => {
      state.buddies = state.buddies.filter((x) => x.id !== id);
      state.requests = state.requests.filter((r) => r.buddy !== id);
      save();
      toast(`${b.name} removed`);
      after();
    },
  });
}
ACTIONS["remove-buddy"] = (el) =>
  removeBuddy(el.dataset.id, () => go("/profile", { replace: true }));

/* ---------- Ask a buddy ---------- */

function askDraft(id) {
  if (!state.askDraft || state.askDraft.buddy !== id)
    state.askDraft = {
      buddy: id,
      kind: "join",
      chore: "",
      day: 0,
      slot: "Evening",
      exercises: "must",
      note: "",
      showList: false,
    };
  return state.askDraft;
}

/* The ask form. From a buddy's page it asks that buddy.
   From Home it starts with "Who?", because Maya may have more than one buddy. */
function askForm(id, { back, chooseWho = false, editing = false }) {
  const d = editing ? state.askDraft : askDraft(id);
  const b = buddyById(d.buddy);
  const active = state.buddies.filter((x) => x.status === "active");
  const days = [0, 1, 2, 3].map((n) => [
    n,
    n === 0
      ? "Today"
      : n === 1
        ? "Tomorrow"
        : fmtWeekday(daysFromToday(n)).slice(0, 3),
  ]);
  const list = EXERCISES.filter((ex) => d.exercises === "all" || ex.must);
  return `<form class="screen screen-ask" data-submit="ask">${header(editing ? "Change plan" : chooseWho ? "Ask a buddy" : `Ask ${esc(b.name)}`, back, { closeIcon: true, sub: editing ? `${esc(b.name)} gets the change to confirm` : "" })}
    <div class="screen-body">
      ${chooseWho ? `<fieldset class="field-group"><legend>Who?</legend><div class="choice-grid three">${active.map((x) => chip(esc(x.name), { action: "ask-who", value: x.id, pressed: d.buddy === x.id })).join("")}</div></fieldset>` : ""}
      <fieldset class="field-group"><legend>What do you need?</legend><div class="choice-grid two">${chip("Join my exercises", { action: "ask-kind", value: "join", pressed: d.kind === "join" })}${chip("Cover a chore", { action: "ask-kind", value: "chore", pressed: d.kind === "chore" })}</div></fieldset>
      ${
        d.kind === "join"
          ? `<div class="field-group"><span class="field-label" id="ask-ex-label">Which exercises?</span>${segmented(
              "ask-exercises",
              [
                [
                  "must",
                  `Must-dos (${EXERCISES.filter((e) => e.must).length})`,
                ],
                ["all", `All (${EXERCISES.length})`],
              ],
              d.exercises,
              "Which exercises",
            )}
              <button type="button" class="disclosure" data-action="ask-list" aria-expanded="${d.showList}">${d.showList ? "Hide" : "See"} exercises · ${minutesOf(list)} min ${icon("down")}</button>
              ${d.showList ? `<ul class="mini-list">${list.map((ex) => `<li>${ex.name}<small>${ex.minutes} min</small></li>`).join("")}</ul>` : ""}</div>`
          : `<div class="field-group"><label for="ask-chore">Which chore?</label><input id="ask-chore" type="text" maxlength="80" value="${esc(d.chore)}" placeholder="e.g. Start dinner, watch the kids" autocomplete="off"></div>`
      }
      <fieldset class="field-group"><legend>When?</legend><div class="choice-grid four">${days.map(([n, label]) => chip(label, { action: "ask-day", value: n, pressed: d.day === n })).join("")}</div>
        <div class="choice-grid three spaced">${["Morning", "Afternoon", "Evening"].map((sl) => chip(sl, { action: "ask-slot", pressed: d.slot === sl })).join("")}</div></fieldset>
      <div class="field-group"><label for="ask-note">Message <span>(optional)</span></label><textarea id="ask-note" rows="2" maxlength="200" placeholder="e.g. Could you keep me company?">${esc(d.note)}</textarea></div>
    </div>
    <footer class="screen-footer"><p id="ask-error" class="form-error" role="alert" hidden></p><button type="submit" class="button primary full">${editing ? `Send change to ${esc(b.name)}` : `Send to ${esc(b.name)}`}</button></footer>
  </form>`;
}

PAGES.ask = {
  guard: ({ id }) =>
    buddyById(id) && buddyById(id).status === "active" ? null : "/profile",
  render: ({ id }) => askForm(id, { back: `#/buddy/${id}` }),
};

PAGES.askAny = {
  guard: () =>
    state.buddies.some((b) => b.status === "active") ? null : "/buddy/add",
  render() {
    const keep =
      state.askDraft && buddyById(state.askDraft.buddy)
        ? state.askDraft.buddy
        : state.buddies.find((b) => b.status === "active").id;
    return askForm(keep, { back: "#/home", chooseWho: true });
  },
};

ACTIONS["ask-who"] = (el) => {
  state.askDraft.buddy = el.dataset.value;
  save();
  rerender();
};
ACTIONS["ask-kind"] = (el) => {
  state.askDraft.kind = el.dataset.value;
  save();
  rerender();
};
ACTIONS["ask-exercises"] = (el) => {
  state.askDraft.exercises = el.dataset.value;
  save();
  rerender();
};
ACTIONS["ask-list"] = () => {
  state.askDraft.showList = !state.askDraft.showList;
  rerender();
};
ACTIONS["ask-day"] = (el) => {
  state.askDraft.day = Number(el.dataset.value);
  $$("[data-action='ask-day']").forEach((b) =>
    b.setAttribute("aria-pressed", String(b === el)),
  );
  save();
};
ACTIONS["ask-slot"] = (el) => {
  state.askDraft.slot = el.dataset.value;
  $$("[data-action='ask-slot']").forEach((b) =>
    b.setAttribute("aria-pressed", String(b === el)),
  );
  save();
};
INPUTS["ask-chore"] = (el) => {
  state.askDraft.chore = el.value;
  el.removeAttribute("aria-invalid");
  save();
};
INPUTS["ask-note"] = (el) => {
  state.askDraft.note = el.value;
  save();
};

/* In this prototype, the buddy confirms a few seconds after each ask or change. */
function buddyReplies(requestId) {
  setTimeout(() => {
    const r = state.requests.find((x) => x.id === requestId);
    const b = r && buddyById(r.buddy);
    if (!r || !b || r.status === "yes") return;
    r.status = "yes";
    if (state.notif.buddy) {
      state.messages.unshift({
        id: `reply-${r.id}-${Date.now()}`,
        kind: "buddy",
        buddy: b.id,
        plan: r.id,
        from: b.name,
        at: new Date().toISOString(),
        title: `Confirmed: ${planWhat(r).replace(/&#39;/g, "'")} · ${planWhen(r)}`,
        text: `I'm in! See you ${relDay(r.day).toLowerCase()} in the ${r.slot.toLowerCase()}.`,
        read: false,
      });
      notify({
        from: b.name,
        title: `Confirmed ${planWhen(r)}`,
        href: `#/plan/${r.id}`,
      });
    }
    save();
    rerender();
  }, 5000);
}

SUBMITS.ask = () => {
  const d = state.askDraft;
  if (d.kind === "chore" && !d.chore.trim()) {
    const err = $("#ask-error");
    err.textContent = "Write which chore you need help with.";
    err.hidden = false;
    $("#ask-chore").setAttribute("aria-invalid", "true");
    $("#ask-chore").focus();
    return;
  }
  const fields = {
    buddy: d.buddy,
    kind: d.kind,
    chore: d.chore.trim(),
    day: daysFromToday(d.day).toISOString(),
    slot: d.slot,
    exercises: d.exercises,
    note: d.note.trim(),
    status: "waiting",
  };
  if (d.editing) {
    const r = state.requests.find((x) => x.id === d.editing);
    Object.assign(r, fields);
    state.askDraft = null;
    save();
    history.back(); /* back to the plan page this edit came from */
    toast(`Change sent to ${buddyById(r.buddy).name}`);
    buddyReplies(r.id);
    return;
  }
  const request = { id: `request-${Date.now()}`, ...fields };
  state.requests.unshift(request);
  state.lastRequest = request.id;
  state.askDraft = null;
  save();
  go(`/buddy/${request.buddy}/sent`, { replace: true });
  buddyReplies(request.id);
};

/* ---------- One plan with a buddy: change it, cancel it, or ask for more ---------- */

PAGES.plan = {
  tab: "home",
  guard: ({ id }) =>
    state.requests.some((r) => r.id === id && buddyById(r.buddy))
      ? null
      : "/home",
  render({ id }) {
    const r = state.requests.find((x) => x.id === id);
    const b = buddyById(r.buddy);
    const confirmed = r.status === "yes";
    return `<section class="screen screen-plan">${header(`Plan with ${esc(b.name)}`, "back")}
      <div class="screen-body">
        <div class="profile-head">${avatar(b.name, confirmed ? "large" : "large pending")}<div><h2>${planWhat(r)}</h2><p class="muted">${confirmed ? `${esc(b.name)} confirmed` : `Asked ${esc(b.name)} · no reply yet`}</p></div></div>
        ${receipt([
          ["When", planWhen(r)],
          ["With", esc(b.name)],
          ...(r.note ? [["Your message", esc(r.note)]] : []),
        ])}
      </div>
      <footer class="screen-footer stack-footer">
        ${button(`${icon("edit")} Change details`, { href: `#/plan/${r.id}/edit` })}
        ${button(`${icon("plus")} Ask ${esc(b.name)} for something else`, { href: `#/buddy/${b.id}/ask`, style: "secondary" })}
        ${button("Cancel this plan", { action: "cancel-plan", style: "danger-quiet", attrs: `data-id="${r.id}"` })}
      </footer>
    </section>`;
  },
};

PAGES.planEdit = {
  guard: ({ id }) =>
    state.requests.some((r) => r.id === id && buddyById(r.buddy))
      ? null
      : "/home",
  render({ id }) {
    const r = state.requests.find((x) => x.id === id);
    if (!state.askDraft || state.askDraft.editing !== id) {
      const offset = Math.min(Math.max(daysUntil(r.day), 0), 3);
      state.askDraft = {
        buddy: r.buddy,
        kind: r.kind,
        chore: r.chore,
        day: offset,
        slot: r.slot,
        exercises: r.exercises,
        note: r.note,
        showList: false,
        editing: id,
      };
    }
    return askForm(r.buddy, { back: "back", editing: true });
  },
};

ACTIONS["cancel-plan"] = (el) => {
  const r = state.requests.find((x) => x.id === el.dataset.id);
  const b = buddyById(r.buddy);
  openModal({
    title: "Cancel this plan?",
    text: `${esc(b.name)} gets a message that you don't need help ${planWhen(r)} anymore.`,
    confirm: "Cancel plan",
    style: "danger",
    cancel: "Keep plan",
    onConfirm: () => {
      state.requests = state.requests.filter((x) => x.id !== r.id);
      save();
      go("/home", { replace: true });
      toast(`Plan cancelled. ${b.name} has been told.`);
    },
  });
};

PAGES.sent = {
  guard: () =>
    state.requests.some((r) => r.id === state.lastRequest) ? null : "/profile",
  render({ id }) {
    const b = buddyById(id);
    const r = state.requests.find((x) => x.id === state.lastRequest);
    return `<section class="screen screen-saved"><div class="screen-body completion-content"><div class="success-mark">${icon("check")}</div><h1>Sent to ${esc(b ? b.name : "your buddy")}</h1>
      <p class="muted">You'll get a notification when ${esc(b ? b.name : "they")} replies.</p>
      <div class="session-summary"><span class="summary-label">Your ask</span><h2 class="summary-title">${requestLine(r)}</h2>${r.note ? `<p class="small muted">${esc(r.note)}</p>` : ""}<p>${statusLabel(r)}</p></div></div>
      <footer class="screen-footer stack-footer">${button(`Back to ${esc(b ? b.name : "Profile")}`, { href: b ? `#/buddy/${b.id}` : "#/profile" })}${button("Go to home", { href: "#/home", style: "secondary" })}</footer></section>`;
  },
};

/* ---------- Add a buddy ---------- */

PAGES.addBuddy = {
  render() {
    const d = state.addDraft || (state.addDraft = { name: "", relation: "" });
    return `<form class="screen screen-add" data-submit="add-buddy">${header("Add a buddy", "#/profile", { closeIcon: true })}
      <div class="screen-body">
        <p class="muted intro">Invite someone you trust. They get a link to join as your buddy.</p>
        <div class="field-group"><label for="buddy-name">Their name</label><input id="buddy-name" type="text" maxlength="40" value="${esc(d.name)}" placeholder="e.g. Sam" autocomplete="off"></div>
        <fieldset class="field-group"><legend>They are your…</legend><div class="choice-grid three">${["Partner", "Friend", "Family"].map((r) => chip(r, { action: "add-relation", pressed: d.relation === r })).join("")}</div></fieldset>
        <div class="info-card">${icon("shield")}<p><strong>What buddies see:</strong> your plan and the sessions you ask them to join. Never your pain, moments or notes.</p></div>
      </div>
      <footer class="screen-footer"><p id="add-error" class="form-error" role="alert" hidden></p><button type="submit" class="button primary full">${icon("share")} Share invite link</button></footer>
    </form>`;
  },
};
ACTIONS["add-relation"] = (el) => {
  state.addDraft.relation = el.dataset.value;
  $$("[data-action='add-relation']").forEach((b) =>
    b.setAttribute("aria-pressed", String(b === el)),
  );
};
INPUTS["buddy-name"] = (el) => {
  state.addDraft.name = el.value;
  el.removeAttribute("aria-invalid");
};
SUBMITS["add-buddy"] = async () => {
  const d = state.addDraft;
  const err = $("#add-error");
  if (!d.name.trim()) {
    err.textContent = "Write their name first.";
    err.hidden = false;
    $("#buddy-name").setAttribute("aria-invalid", "true");
    $("#buddy-name").focus();
    return;
  }
  if (!d.relation) {
    err.textContent = "Choose who they are to you.";
    err.hidden = false;
    $("[data-action='add-relation']").focus();
    return;
  }
  const link = "https://recovery.example/invite/maya";
  const text = `Hi ${d.name.trim()}, will you be my recovery buddy? ${link}`;
  try {
    if (navigator.share)
      await navigator.share({ title: "Be my recovery buddy", text });
    else if (navigator.clipboard) await navigator.clipboard.writeText(text);
  } catch {
    /* Share sheet closed. Keep going, the invite is still made in the demo. */
  }
  state.buddies.push({
    id: `buddy-${Date.now()}`,
    name: d.name.trim(),
    relation: d.relation,
    since: new Date().toISOString(),
    status: "invited",
    sees: { plan: true, sessions: true },
  });
  state.addDraft = null;
  save();
  go("/profile", { replace: true });
  toast(navigator.share ? "Invite sent" : "Invite link copied");
};

/* ---------- Settings ---------- */

PAGES.settings = {
  tab: "profile",
  render() {
    return `<section class="screen screen-settings">${header("Settings", "#/profile")}
      <div class="screen-body">
        <div class="card list-card">
          ${linkRow("#/settings/notifications", "Notifications", "Daily reminder, visit nudge, buddy replies", { lead: `<span class="row-icon">${icon("bell")}</span>` })}
          ${linkRow("#/settings/privacy", "Privacy", `What your PT and buddies can see`, { lead: `<span class="row-icon">${icon("shield")}</span>` })}
        </div>
        <h2 class="section-title">Prototype</h2>
        <div class="card list-card">${linkRow("#/settings/credits", "Image credits", "Where the exercise GIFs and icons come from", { lead: `<span class="row-icon">${icon("info")}</span>` })}<button type="button" class="list-row link-row" data-action="reset-demo"><span class="row-icon">${icon("replay")}</span><span class="row-text"><strong>Reset demo</strong><small>Bring back Maya's starting data</small></span></button></div>
        <p class="field-hint center">${APP_NAME} · ${APP_TAGLINE} · IAT 334 · Team Motion</p>
      </div>
    </section>`;
  },
};

/* Image credits: every outside image or icon, with a link to where it came from. */
PAGES.credits = {
  tab: "profile",
  render() {
    return `<section class="screen screen-settings">${header("Image credits", "#/settings")}
      <div class="screen-body">
        <h2 class="section-title first">Exercise GIFs</h2>
        <div class="card list-card">${EXERCISES.map(
          (ex) =>
            `<a class="list-row link-row" href="${ex.source.url}" target="_blank" rel="noopener"><span class="row-text"><strong>${ex.name}</strong><small>${ex.source.name} · ${ex.source.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}</small></span>${icon("share", "row-chevron")}</a>`,
        ).join("")}</div>
        <h2 class="section-title">Icons</h2>
        <div class="card list-card"><a class="list-row link-row" href="https://lucide.dev" target="_blank" rel="noopener"><span class="row-text"><strong>Settings gear</strong><small>Lucide icons · lucide.dev · ISC license</small></span>${icon("share", "row-chevron")}</a>
          <div class="list-row"><span class="row-text"><strong>All other icons</strong><small>Drawn by Team Motion</small></span></div></div>
        <p class="field-hint">GIFs are used for a class prototype only. All rights belong to their owners.</p>
      </div>
    </section>`;
  },
};

PAGES.notifications = {
  tab: "profile",
  render() {
    return `<section class="screen screen-settings">${header("Notifications", "#/settings")}
      <div class="screen-body"><div class="card list-card">
        ${toggleRow("notif.daily", "Daily reminder", `${state.notif.dailyTime}, only on days you haven't exercised`)}
        ${toggleRow("notif.visit", "Visit nudge", "2 days before a visit, so you can get ready")}
        ${toggleRow("notif.buddy", "Buddy replies", "When a buddy says yes or no")}
        ${toggleRow("alerts", `Messages from your PT`, "Always on, for your safety", { locked: true })}
      </div></div>
    </section>`;
  },
};

PAGES.privacy = {
  tab: "profile",
  render() {
    const n = state.buddies.filter((b) => b.status === "active").length;
    return `<section class="screen screen-settings">${header("Privacy", "#/settings")}
      <div class="screen-body"><div class="card list-card">
        ${linkRow("#/settings/privacy/pt", "Your PT", `${PT.name} · sees what you choose`, { lead: avatar(PT.label) })}
        ${linkRow("#/settings/privacy/buddies", "Your buddies", `${n} buddy${n === 1 ? "" : "s"} · plan and shared sessions only`, { lead: `<span class="row-icon">${icon("heart")}</span>` })}
      </div></div>
    </section>`;
  },
};

PAGES.privacyPt = {
  tab: "profile",
  render() {
    return `<section class="screen screen-settings">${header("Your PT", "#/settings/privacy", { sub: `${PT.name} · ${PT.clinic}` })}
      <div class="screen-body"><div class="card list-card">
        ${toggleRow("privacy.checkins", "Check-ins", "How exercises felt and discomfort")}
        ${toggleRow("privacy.moments", "Moments", "Everyday moments from your Log")}
        ${toggleRow("privacy.notes", "Notes", "Notes you write in check-ins and moments")}
        ${toggleRow("severe", "Severe discomfort alerts", `Always on. Your PT is told when you rate ${SEVERE} or more.`, { locked: true })}
      </div><p class="field-hint">Your PT uses this to adjust your plan at each visit.</p></div>
    </section>`;
  },
};

PAGES.privacyBuddies = {
  tab: "profile",
  render() {
    const active = state.buddies.filter((b) => b.status === "active");
    return `<section class="screen screen-settings">${header("Your buddies", "#/settings/privacy")}
      <div class="screen-body">
        <p class="small muted intro">Buddies see your plan and the sessions you ask them to join. They never see your pain, moments or notes.</p>
        <div class="card list-card">${
          active
            .map(
              (b) =>
                `<div class="list-row">${avatar(b.name)}<span class="row-text"><strong>${esc(b.name)}</strong><small>${esc(b.relation)} · since ${fmtShort(b.since)}</small></span><button type="button" class="button danger-quiet compact" data-action="remove-buddy-privacy" data-id="${b.id}">Remove</button></div>`,
            )
            .join("") || '<div class="empty-state">No buddies yet.</div>'
        }</div>
      </div>
    </section>`;
  },
};
ACTIONS["remove-buddy-privacy"] = (el) => removeBuddy(el.dataset.id, rerender);
