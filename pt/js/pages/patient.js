/* ---------- Page: Patient overview ---------- */
function pagePatient(p) {
  const n = newCount(p);
  const ver = p.plan.version;
  const items = p.plan.items;
  const draft = state.drafts[p.id];
  const comfortFirst = p.comfort[0],
    comfortLast = p.comfort[p.comfort.length - 1];
  const latest = p.updates.slice(0, 3);
  const visitToday =
    p.visit.week === 0 &&
    p.visit.day === TODAY.dayIndex &&
    p.visit.status !== "seen" &&
    !state.visitDone[p.id];

  return `
  ${crumbs([["Patients", "#/patients"], [p.name]])}
  <div class="patient-head">
    <div class="left"><span class="avatar lg">${p.initials}</span>
      <div><h1>${esc(p.name)}</h1><p class="muted">${esc(p.focus)} · ${esc(p.condition)} · ${visitToday ? `Visit today, ${niceTime(p.visit.time)}` : `Next visit: ${esc(nextVisitOf(p))}`}</p></div>
    </div>
  </div>

  ${
    draft
      ? `<div class="notice draft-notice"><span><strong>Unpublished draft.</strong> ${esc(firstName(p))}'s plan stays the same until you publish.</span>
    <span class="btn-row"><a class="btn small" href="#/patient/${p.id}/edit">Continue editing</a><button class="btn ghost small" data-action="cancel-draft" data-id="${p.id}">Cancel draft</button></span></div>`
      : ""
  }

  <div class="grid two">
    <section class="goal-card">
      <div class="goal-top">
        <div>
          <p class="eyebrow light">${esc(firstName(p).toUpperCase())}'S GOAL</p>
          <h2 class="goal-title">${p.goal}</h2>
        </div>
        <button class="btn on-dark small" data-action="add-score" data-id="${p.id}">+ Today's score</button>
      </div>
      ${goalChart(p)}
      <p class="goal-foot">${esc(p.comfortLabel)}: ${comfortFirst} → ${comfortLast} out of 10</p>
    </section>
    <section class="card">
      <p class="eyebrow">LAST 2 WEEKS</p>
      <div class="stat-row two">
        <div class="stat"><b>${p.stats.daysWithEx}</b><span>days with exercises</span></div>
        <div class="stat"><b>${p.stats.mustdoOnly}</b><span>must-dos only</span></div>
      </div>
      <p class="muted small" style="margin-top:.75rem">Patient since ${esc(p.patientSince)} · Last visit ${esc(p.lastVisit)}</p>
    </section>

    <section class="card">
      <div class="card-head">
        <div><h3>Current home plan <span class="tag green">Version ${ver}</span></h3>
        <p class="muted small">Set on ${esc(p.plan.setOn)} · ${items.length} exercises · ${mustItems(items).length} must-dos</p></div>
      </div>
      <ul class="ex-list">${items
        .map((it) => {
          const e = getEx(it.exId);
          return `<li><strong>${esc(e.name)}</strong><span class="muted">${e.min} min</span>${it.must ? `<span class="tag must">MUST-DO</span>` : "<span></span>"}</li>`;
        })
        .join("")}</ul>
      ${p.plan.why ? `<p class="small muted" style="margin-top:.75rem"><strong>Your last reason:</strong> “${esc(p.plan.why)}”</p>` : ""}
      <div class="focus-row">
        <div class="grow">
          <p class="eyebrow">YOUR FOCUS FOR THIS VISIT</p>
          <p id="focus-text">${esc(p.visitFocus)}</p>
          <button class="btn text small" data-action="edit-focus" data-id="${p.id}">Edit focus</button>
        </div>
        <a class="btn" href="#/patient/${p.id}/edit">${draft ? "Continue editing" : "Edit plan"}</a>
      </div>
      ${(p.history || []).length ? "" : ""}
    </section>

    <section class="card">
      <div class="card-head"><h3>Since the last visit</h3>${n ? `<span class="new-dot">● ${n} new</span>` : `<span class="muted small">All reviewed</span>`}</div>
      ${
        latest.length
          ? `<ul class="since">${latest
              .map(
                (u) => `
        <li><a href="#/patient/${p.id}/review?item=${u.id}">
          <span class="bullet ${state.reviewed[u.id] ? "seen" : ""}" aria-hidden="true"></span>
          <span><strong>${esc(u.kind === "question" ? "Question for this visit" : u.title)}</strong><br>
          <small class="muted">${u.kind === "question" ? `“${esc(u.words)}”` : `${kindLabel(u.kind)} · Discomfort ${u.discomfort} · ${esc(u.date)}`}</small></span></a></li>`,
              )
              .join("")}</ul>`
          : `<p class="muted small">Nothing new since the last visit.</p>`
      }
      ${p.updates.length ? `<a class="btn ghost block" href="#/patient/${p.id}/review">Review daily moments${p.updates.length > 3 ? ` (${p.updates.length})` : ""}</a>` : ""}
    </section>
  </div>`;
}
function kindLabel(k) {
  return k === "moment" ? "Moment" : k === "checkin" ? "Check-in" : "Question";
}

function goalChart(p) {
  const vals = p.comfort,
    W = 520,
    H = 130,
    pad = 22;
  const x = (i) =>
    pad +
    (vals.length === 1
      ? (W - 2 * pad) / 2
      : (i * (W - 2 * pad)) / (vals.length - 1));
  const y = (v) => H - pad - (v / 10) * (H - 2 * pad);
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const dates = p.comfortDates;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H + 16}" role="img" aria-label="${esc(p.comfortLabel)} over time: ${vals.join(", ")}">
    ${[0, 5, 10].map((g) => `<line x1="${pad}" x2="${W - pad}" y1="${y(g)}" y2="${y(g)}" stroke="rgba(255,255,255,.15)"/><text x="4" y="${y(g) + 4}" fill="rgba(255,255,255,.6)" font-size="10">${g}</text>`).join("")}
    <polyline points="${pts}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
    ${vals
      .map(
        (
          v,
          i,
        ) => `<circle cx="${x(i)}" cy="${y(v)}" r="${i === vals.length - 1 ? 5 : 3.5}" fill="${i === vals.length - 1 ? "#ECDDC6" : "#fff"}"/>
      <text x="${x(i)}" y="${H + 12}" fill="rgba(255,255,255,.7)" font-size="10" text-anchor="middle">${esc(dates[i] || "")}</text>`,
      )
      .join("")}
    <text x="${x(vals.length - 1)}" y="${y(vals[vals.length - 1]) - 10}" fill="#fff" font-size="12" font-weight="700" text-anchor="middle">${vals[vals.length - 1]}</text>
  </svg></div>`;
}
