/* ---------- Page: Published ---------- */
function pagePublished(p) {
  const pub = state.published[p.id];
  if (!pub)
    return `${crumbs([["Patients", "#/patients"], [p.name, `#/patient/${p.id}`], ["Published"]])}
    <section class="card empty-state"><h3>Nothing published yet</h3><p>Publish a plan update to see it here.</p></section>`;
  const nextUp = allVisits()
    .filter(
      (v) =>
        v.week === 0 &&
        v.status === "upcoming" &&
        v.patient !== p.id &&
        v.day >= TODAY.dayIndex,
    )
    .sort(
      (a, b) => a.day - b.day || hourOffset(a.time) - hourOffset(b.time),
    )[0];
  const np = nextUp && getPatient(nextUp.patient);
  return `
  ${crumbs([["Patients", "#/patients"], [p.name, `#/patient/${p.id}`], ["Published"]])}
  <div class="page-head"><div><h1>Plan update published</h1><p class="muted">${esc(firstName(p))} can see it in her app now.</p></div></div>
  ${stepper(2, 3)}
  <section class="card done-card">
    <div class="done-check" aria-hidden="true">✓</div>
    <h2>${esc(firstName(p))}'s updated plan is ready</h2>
    <p class="muted">The must-dos and your reason went out together.</p>
    <div class="pub-box">
      <div><p class="eyebrow">PUBLISHED BY</p><strong>Jordan Lee</strong><br><small class="muted">${esc(pub.at)}</small></div>
      <div><p class="eyebrow">PATIENT PLAN</p><strong>Version ${pub.version} · current</strong><br><small class="muted">${pub.mustCount} must-dos marked</small></div>
      <div><p class="eyebrow">NEXT VISIT</p><strong>${esc(pub.nextVisit)}</strong><br><small class="muted">Added to your calendar</small></div>
    </div>
    <span class="tag">Sent to ${esc(firstName(p))}</span>
    <p class="muted small" style="margin-top:.5rem">${esc(firstName(p))} has not opened it yet.</p>
  </section>
  <div class="btn-row center" style="margin-top:1.5rem">
    <a class="btn" href="#/patient/${p.id}">Back to ${esc(firstName(p))}</a>
    ${np ? `<a class="btn ghost" href="#/patient/${np.id}">Next patient: ${esc(np.name)}</a>` : ""}
    <a class="btn text" href="#/home">Go home</a>
  </div>`;
}
