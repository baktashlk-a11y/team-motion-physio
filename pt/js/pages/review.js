/* ---------- Page: Review daily moments ---------- */
function pageReview(p, params) {
  const filter = params.show || "all";
  const list = p.updates.filter((u) => filter === "all" || u.kind === filter);
  const sel = list.find((u) => u.id === params.item) || list[0];
  if (sel && !state.reviewed[sel.id]) {
    state.reviewed[sel.id] = true;
    save();
  }
  const qs = (extra) =>
    `#/patient/${p.id}/review?${new URLSearchParams({ show: filter, ...extra })}`;
  const chip = (k, label, n) =>
    `<a class="chip ${filter === k ? "on" : ""}" href="#/patient/${p.id}/review?show=${k}">${label} <span class="count">${n}</span></a>`;
  const idx = sel ? list.indexOf(sel) : -1;
  const previous = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  return `
  ${crumbs([["Patients", "#/patients"], [p.name, `#/patient/${p.id}`], ["Review daily moments"]])}
  <div class="page-head"><div><h1>Review daily moments</h1><p class="muted">${esc(firstName(p))} · daily moments, check-ins and questions</p></div></div>
  <div class="chips" style="margin-bottom:1rem">${chip("all", "All", p.updates.length)}${chip("moment", "Moments", countKind(p, "moment"))}${chip("checkin", "Check-ins", countKind(p, "checkin"))}${chip("question", "Questions", countKind(p, "question"))}</div>
  ${
    p.updates.length === 0
      ? `<section class="card empty-state"><h3>Nothing to review</h3><p>${esc(firstName(p))} hasn't added anything since the last visit.</p><p style="margin-top:1rem"><a class="btn" href="#/patient/${p.id}/edit">Edit plan</a></p></section>`
      : `
  <div class="review-grid">
    <section class="card review-list">
      <div class="card-head"><h3>Recent</h3><span class="tag">${list.length}</span></div>
      ${
        list.length
          ? `<ul>${list
              .map(
                (
                  u,
                ) => `<li><a class="${sel && u.id === sel.id ? "on" : ""}" href="${qs({ item: u.id })}">
        <small class="muted">${esc(u.date.toUpperCase())}</small>
        <strong>${esc(u.title)}</strong>
        <small class="muted">${u.kind === "moment" ? "Daily moment" : kindLabel(u.kind)}${state.replies[u.id] ? " · Answered" : ""}</small>
        ${!state.reviewed[u.id] ? `<span class="new-dot" aria-label="new">●</span>` : `<span aria-hidden="true">›</span>`}</a></li>`,
              )
              .join("")}</ul>`
          : `<p class="muted small">None of this type.</p>`
      }
      <p class="hint" style="margin-top:1rem">Review these together before you change the plan.</p>
    </section>
    <section class="card review-detail">${sel ? detailHTML(p, sel) : `<p class="muted">No items in this view. Choose another filter above.</p>`}</section>
  </div>
  <div class="bottom-bar">
    ${sel ? `<div class="btn-row">
      ${previous ? `<a class="btn ghost" href="${qs({ item: previous.id })}">‹ Previous item</a>` : `<button class="btn ghost" disabled>‹ Previous item</button>`}
      <span class="muted small">Item ${idx + 1} of ${list.length}</span>
      ${next ? `<a class="btn ghost" href="${qs({ item: next.id })}">Next item ›</a>` : `<button class="btn ghost" disabled>Next item ›</button>`}
    </div>` : `<span class="muted small">No items in this view.</span>`}
    <a class="btn" href="#/patient/${p.id}/edit">Edit plan together</a>
  </div>`
  }`;
}

function detailHTML(p, u) {
  const label =
    u.kind === "moment"
      ? "DAILY MOMENT"
      : u.kind === "checkin"
        ? "CHECK-IN"
        : "QUESTION";
  if (u.kind === "question") {
    const reply = state.replies[u.id];
    return `
    <span class="tag green">${label}</span>
    <h2 style="margin:.75rem 0 .25rem">${esc(u.title)}</h2>
    <p class="muted small">${esc(u.date)} · Added by ${esc(firstName(p))}</p>
    <hr>
    <p class="eyebrow">IN ${esc(firstName(p).toUpperCase())}'S WORDS</p>
    <p class="quote">“${esc(u.words)}”</p>
    <p class="eyebrow" style="margin-top:1.25rem">YOUR ANSWER</p>
    ${
      reply
        ? `<div class="reply"><p>${esc(reply)}</p><button class="btn text small" data-action="edit-reply" data-id="${u.id}" data-p="${p.id}">Edit answer</button></div>`
        : `<form class="reply-form" data-action="save-reply" data-id="${u.id}" data-p="${p.id}">
          <label class="sr-only" for="reply-${u.id}">Your answer</label>
          <textarea id="reply-${u.id}" name="reply" placeholder="Write a short answer. ${esc(firstName(p))} sees it with the next plan update."></textarea>
          <div class="btn-row" style="margin-top:.5rem"><button class="btn small" type="submit">Save answer</button><span class="hint">Or answer in person at the visit.</span></div>
        </form>`
    }
    <hr><p class="eyebrow">CONNECTED GOAL</p><p><strong>${esc(p.goalPlain)}</strong></p>`;
  }
  return `
  <span class="tag green">${label}</span>
  <h2 style="margin:.75rem 0 .25rem">${esc(u.title)}</h2>
  <p class="muted small">${esc(u.date)} · Added by ${esc(firstName(p))}</p>
  <hr>
  <div class="facts">
    <div><p class="eyebrow">HOW IT WENT</p><span class="tag green">${esc(u.how)}</span></div>
    <div><p class="eyebrow">WHAT HELPED</p>${u.helped && u.helped.length ? u.helped.map((h) => `<span class="tag green">${esc(h)}</span>`).join(" ") : `<span class="muted small">Nothing added</span>`}</div>
    <div><p class="eyebrow">DISCOMFORT</p><b class="big-num ${u.discomfort >= 6 ? "alert" : ""}">${u.discomfort} / 10</b></div>
  </div>
  ${u.exercise ? `<p class="small" style="margin-top:1rem"><strong>Exercise:</strong> ${esc(u.exercise)} · felt ${esc(u.effort)}</p>` : ""}
  <p class="eyebrow" style="margin-top:1.25rem">IN ${esc(firstName(p).toUpperCase())}'S WORDS</p>
  ${u.words ? `<p class="quote">“${esc(u.words)}”</p>` : `<p class="muted small">No note added.</p>`}
  <hr><p class="eyebrow">CONNECTED GOAL</p><p><strong>${esc(p.goalPlain)}</strong></p>`;
}
