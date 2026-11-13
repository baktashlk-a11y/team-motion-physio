/* ---------- Page: Patients ---------- */
function pagePatients(params) {
  const filter = params.filter || "all";
  // Sort by visit date, earliest first, so the table reads like the calendar
  const visitKey = (p) => {
    const v =
      allVisits().find(
        (x) => x.patient === p.id && x.week >= 0 && x.status !== "booked",
      ) || p.visit;
    return v.week * 1000 + v.day * 100 + hourOffset(v.time);
  };
  const sorted = [...state.patients].sort((a, b) => visitKey(a) - visitKey(b));
  const rows = sorted
    .map((p) => {
      const n = newCount(p);
      // Visit this week = a visit this week, done or still to come (not new bookings)
      const weekVisit = allVisits().find(
        (v) => v.patient === p.id && v.week === 0 && v.status !== "booked",
      );
      const thisWeek = !!weekVisit;
      const seen = weekVisit && weekVisit.status === "seen" ? weekVisit : null;
      // The visit date cell: a seen visit is crossed out, with "Seen" next to it
      let dateCell = esc(nextVisitOf(p));
      if (seen) {
        const booked = nextVisitOf(p);
        dateCell =
          `<span class="cross">${esc(visitLabel(seen))}</span> <span class="tag">Seen</span>` +
          (booked !== "Not booked"
            ? `<br><small class="muted">Next: ${esc(booked)}</small>`
            : "");
      }
      const ver = state.published[p.id]?.version || p.plan.version;
      return `<tr class="click ${seen ? "seen-row" : ""}" data-href="#/patient/${p.id}" data-name="${esc(p.name.toLowerCase())} ${esc(p.condition.toLowerCase())}" data-week="${thisWeek}" data-new="${n > 0}">
      <td><div class="who"><span class="avatar">${p.initials}</span><span><a href="#/patient/${p.id}" class="row-link"><strong class="${seen ? "cross" : ""}">${esc(p.name)}</strong></a><br><small class="muted">${esc(p.condition)}</small></span></div></td>
      <td>${dateCell}</td>
      <td>${n ? `<span class="tag green">${n} new</span>` : `<span class="muted small">Up to date</span>`}</td>
      <td>${p.stats.daysWithEx.replace("/", " of ")}</td>
      <td>Version ${ver}${state.drafts[p.id] ? ` <span class="tag">Draft</span>` : ""}</td>
    </tr>`;
    })
    .join("");
  const chip = (key, label) =>
    `<a class="chip ${filter === key ? "on" : ""}" href="#/patients?filter=${key}">${label}</a>`;
  return `
  <div class="page-head"><div><h1>Patients</h1><p class="muted">${state.patients.length} people on home plans.</p></div></div>
  <section class="card">
    <div class="toolbar">
      <div class="chips">${chip("all", "All")}${chip("week", "Visit this week")}${chip("new", "Has new updates")}</div>
      <label class="sr-only" for="patient-search">Search patients</label>
      <input id="patient-search" type="search" placeholder="Search by name or condition">
    </div>
    <table class="table" data-filter="${filter}">
      <thead><tr><th>Patient</th><th>Visit date</th><th>Since last visit</th><th>Days with exercises</th><th>Home plan</th></tr></thead>
      <tbody id="patient-rows">${rows}</tbody>
    </table>
    <p id="no-patients" class="empty-state" hidden>No patients match. <button class="btn text" data-action="clear-search">Clear search</button></p>
  </section>`;
}
function filterPatientRows() {
  const q = ($("#patient-search")?.value || "").trim().toLowerCase();
  const filter = $("table[data-filter]")?.dataset.filter || "all";
  let shown = 0;
  document.querySelectorAll("#patient-rows tr").forEach((tr) => {
    const ok =
      tr.dataset.name.includes(q) &&
      (filter === "all" ||
        (filter === "week" && tr.dataset.week === "true") ||
        (filter === "new" && tr.dataset.new === "true"));
    tr.hidden = !ok;
    if (ok) shown++;
  });
  $("#no-patients").hidden = shown > 0;
}
