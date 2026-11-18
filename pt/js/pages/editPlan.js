/* ---------- Plan drafts ---------- */
function getDraft(p) {
  if (!state.drafts[p.id]) {
    state.drafts[p.id] = {
      items: clone(p.plan.items),
      why: "",
      nextVisit: p.nextVisitOptions[0] || "",
    };
    save();
  }
  return state.drafts[p.id];
}
function planDiff(p, d) {
  const before = p.plan.items,
    after = d.items;
  const has = (list, id) => list.find((x) => x.exId === id);
  const out = [];
  after.forEach((it) => {
    if (!has(before, it.exId))
      out.push({
        type: "added",
        text: `Added ${getEx(it.exId).name}${it.must ? " as a must-do" : ""}`,
      });
  });
  before.forEach((it) => {
    if (!has(after, it.exId))
      out.push({ type: "removed", text: `Removed ${getEx(it.exId).name}` });
  });
  after.forEach((it) => {
    const b = has(before, it.exId);
    if (b && b.must !== it.must)
      out.push({
        type: it.must ? "must" : "optional",
        text: `${getEx(it.exId).name} is ${it.must ? "now a must-do" : "now optional"}`,
      });
  });
  return out;
}
function isDirty(p) {
  const d = state.drafts[p.id];
  return !!d && (planDiff(p, d).length > 0 || d.why.trim() !== "");
}

/* ---------- Page: Edit plan ---------- */
function stepper(active, done) {
  const steps = ["Edit plan", "Patient preview", "Publish"];
  return `<ol class="steps">${steps.map((s, i) => `<li class="${i < done ? "done" : ""} ${i === active ? "current" : ""}"><span class="n">${i < done ? "✓" : i + 1}</span>${s}</li>`).join("")}</ol>`;
}
function pageEdit(p) {
  const d = getDraft(p);
  const musts = mustItems(d.items);
  const q = p.updates.filter((u) => u.kind === "question");
  const nextVer = p.plan.version + 1;
  let mustNote = "";
  if (musts.length === 0)
    mustNote = `<p class="notice warn small">No must-dos yet. ${esc(firstName(p))} won't have a backup plan for hard weeks.</p>`;
  else if (musts.length > 3)
    mustNote = `<p class="notice warn small">${musts.length} must-dos is a lot for a hard week. 2 or 3 works best.</p>`;
  else
    mustNote = `<p class="notice good small">On hard weeks: ${musts.length} must-do${musts.length > 1 ? "s" : ""}, about ${totalMin(musts)} min.</p>`;

  return `
  ${crumbs([["Patients", "#/patients"], [p.name, `#/patient/${p.id}`], ["Edit plan"]])}
  <div class="page-head"><div><h1>Edit ${esc(firstName(p))}'s home plan</h1><p class="muted">Connect the plan to ${esc(firstName(p))}'s real life.</p></div><a class="btn ghost" href="#/patient/${p.id}">Back to ${esc(firstName(p))}</a></div>
  ${stepper(0, 0)}
  <div class="grid two">
    <section class="card">
      <div class="card-head">
        <div><h3>Pick the must-dos</h3><p class="muted small">The backup plan for busy or sore weeks.</p></div>
        <span class="tag">Draft · version ${nextVer}</span>
      </div>
      ${
        d.items.length
          ? `<ul class="must-list">${d.items
              .map((it, i) => {
                const e = getEx(it.exId);
                return `<li class="${it.must ? "on" : ""}">
          <span class="grow"><strong>${esc(e.name)}</strong><br><small class="muted">${esc(e.area)}</small></span>
          <span class="muted small">${e.min} min</span>
          <label class="must-switch"><span class="${it.must ? "strong" : "muted"}">Must-do</span>
            <span class="switch"><input type="checkbox" data-action="toggle-must" data-i="${i}" ${it.must ? "checked" : ""} aria-label="${esc(e.name)} is a must-do"><span></span></span></label>
          <button class="remove-btn" data-action="remove-ex" data-i="${i}" aria-label="Remove ${esc(e.name)}">×</button>
        </li>`;
              })
              .join("")}</ul>`
          : `<p class="empty-state small">No exercises in this plan.</p>`
      }
      <button class="btn ghost small" style="margin-top:.75rem" data-action="add-ex" data-id="${p.id}">+ Add exercise</button>
      <p class="muted small" style="margin-top:.75rem">Full plan: ${d.items.length} exercises, about ${totalMin(d.items)} min.</p>
      ${mustNote}

      <div class="field" style="margin-top:1.25rem">
        <label for="why">Why did we make this change? <span class="req">Required</span></label>
        <textarea id="why" data-action="why" aria-describedby="why-error" placeholder="For example: Some weeks are sore or busy. These 3 keep your lifting on track until our next visit.">${esc(d.why)}</textarea>
        <span class="field-error" id="why-error" hidden>Write a short reason. ${esc(firstName(p))} will read it.</span>
        <span class="hint">${esc(firstName(p))} reads this with the plan. Keep it short and plain.</span>
      </div>
      <div class="field" style="margin-top:1rem">
        <label for="next-visit">Next visit</label>
        <select id="next-visit" data-action="next-visit">${p.nextVisitOptions.map((o) => `<option ${o === d.nextVisit ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
      </div>
    </section>

    <div class="stack">
      <section class="card soft">
        <h3 class="small-title">From ${esc(firstName(p))}'s questions</h3>
        ${
          q.length
            ? q
                .map(
                  (u) =>
                    `<p class="small" style="margin-top:.5rem">“${esc(u.words)}”${state.replies[u.id] ? ` <span class="tag green">Answered</span>` : ""}</p>`,
                )
                .join("") +
              `<a class="small" href="#/patient/${p.id}/review?show=question">Answer questions ›</a>`
            : `<p class="muted small">No questions this time.</p>`
        }
      </section>
      <section class="card soft">
        <p class="eyebrow">KEEP THE GOAL IN VIEW</p>
        <h3 class="goal-small">${p.goal}</h3>
      </section>
      <section class="card soft">
        <h3 class="small-title">Shared after publishing</h3>
        <p class="small muted">${esc(firstName(p))} sees which exercises are must-dos, and your reason.</p>
      </section>
    </div>
  </div>
  <div class="bottom-bar">
    <div class="btn-row"><button class="btn ghost" data-action="cancel-draft" data-id="${p.id}">Discard draft</button><span class="muted small">Draft saved in this browser. Plan unchanged until published.</span></div>
    <div class="btn-row"><button class="btn" data-action="go-preview" data-id="${p.id}" ${d.items.length === 0 ? "disabled" : ""}>Preview update</button></div>
  </div>`;
}
