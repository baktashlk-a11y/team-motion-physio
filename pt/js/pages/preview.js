/* ---------- Page: Preview ---------- */
function pagePreview(p) {
  const d = state.drafts[p.id];
  if (!d) return noDraft(p);
  if (!d.why.trim()) {
    location.replace(`#/patient/${p.id}/edit`);
    return "";
  }
  const diff = planDiff(p, d);
  const musts = mustItems(d.items);
  const answered = p.updates.filter(
    (u) => u.kind === "question" && state.replies[u.id],
  );
  const changeSummary = diff.length
    ? `${diff.length} change${diff.length > 1 ? "s" : ""} + reason`
    : "Reason only";

  return `
  ${crumbs([["Patients", "#/patients"], [p.name, `#/patient/${p.id}`], ["Edit plan", `#/patient/${p.id}/edit`], ["Preview"]])}
  <div class="page-head"><div><h1>Preview ${esc(firstName(p))}'s update</h1><p class="muted">Check what ${esc(firstName(p))} will see.</p></div></div>
  ${stepper(1, 1)}
  <div class="preview-grid">
    <section class="card patient-view">
      <div class="pv-bar"><span class="eyebrow">PATIENT VIEW</span><span class="muted small">${esc(firstName(p))}'s app</span></div>
      <div class="pv-body">
        <div class="pv-title"><span class="check" aria-hidden="true">✓</span><div><h2>Your plan, updated</h2><p class="muted small">From Jordan · ${TODAY.short}</p></div></div>
        <hr>
        <p class="eyebrow">WHAT CHANGED</p>
        <p><strong>${musts.length} must-do${musts.length === 1 ? "" : "s"} for busy or sore weeks</strong></p>
        <p class="muted small">${musts.map((it) => esc(getEx(it.exId).name)).join(" · ") || "None"}</p>
        ${diff.length ? `<ul class="diff">${diff.map((c) => `<li><span class="tag ${c.type === "removed" ? "" : "green"}">${c.type === "added" ? "New" : c.type === "removed" ? "Removed" : c.type === "must" ? "Must-do" : "Optional"}</span>${esc(c.text)}</li>`).join("")}</ul>` : `<p class="muted small">Same exercises as before.</p>`}
        <p class="eyebrow" style="margin-top:1rem">WHY</p>
        <p>${esc(d.why)}</p>
        ${answered.length ? `<p class="eyebrow" style="margin-top:1rem">ANSWERS TO YOUR QUESTIONS</p>${answered.map((u) => `<p class="small"><strong>“${esc(u.words)}”</strong><br>${esc(state.replies[u.id])}</p>`).join("")}` : ""}
        <p class="eyebrow" style="margin-top:1rem">WHAT TO DO NEXT</p>
        <p>Do the full plan when you can. On hard weeks, the must-dos are enough.</p>
        <p class="eyebrow" style="margin-top:1rem">NEXT VISIT</p>
        <p>${esc(d.nextVisit)}</p>
      </div>
    </section>
    <div class="stack">
      <section class="card">
        <h3 class="small-title">Publish summary</h3>
        <dl class="summary">
          <dt>PATIENT</dt><dd>${esc(p.name)}</dd>
          <dt>PLAN</dt><dd>Version ${p.plan.version} → version ${p.plan.version + 1}</dd>
          <dt>CHANGE</dt><dd>${changeSummary}</dd>
          <dt>EXERCISES</dt><dd>${d.items.length} · ${musts.length} must-dos</dd>
        </dl>
      </section>
      <section class="card soft">
        <h3 class="small-title">What happens next</h3>
        <p class="small muted">A new-plan card shows on ${esc(firstName(p))}'s Home screen. She can read your reason or save a question for next time.</p>
      </section>
    </div>
  </div>
  <div class="bottom-bar">
    <a class="btn ghost" href="#/patient/${p.id}/edit">Back to edit</a>
    <button class="btn" data-action="publish" data-id="${p.id}">Publish update</button>
  </div>`;
}
function noDraft(p) {
  return `${crumbs([["Patients", "#/patients"], [p.name, `#/patient/${p.id}`], ["Preview"]])}
  <section class="card empty-state"><h3>No draft to preview</h3><p>Start by editing ${esc(firstName(p))}'s plan.</p>
  <p style="margin-top:1rem"><a class="btn" href="#/patient/${p.id}/edit">Edit plan</a></p></section>`;
}
