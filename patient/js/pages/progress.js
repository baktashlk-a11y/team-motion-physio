"use strict";
/* Progress: goal chart, what affects the pain, next visit and past visits. */

function painPatterns() {
  const hardest = [...state.moments]
    .sort((a, b) => b.discomfort - a.discomfort)
    .slice(0, 2);
  const counts = {};
  state.moments.forEach((m) =>
    m.help.forEach((h) => (counts[h] = (counts[h] || 0) + 1)),
  );
  const helped = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  if (!state.moments.length)
    return '<p class="empty-state">Log a few moments and patterns show up here.</p>';
  return `<div class="pattern-grid">
    <div class="card pattern-card"><span class="eyebrow">Hardest moments</span><ul>${hardest
      .map(
        (m) =>
          `<li><span>${esc(m.activity)}</span><span class="discomfort-badge ${badgeClass(m.discomfort)}">${m.discomfort}</span></li>`,
      )
      .join("")}</ul></div>
    <div class="card pattern-card"><span class="eyebrow">What helped</span>${
      helped.length
        ? `<ul>${helped.map(([h, n]) => `<li><span>${esc(h)}</span><small>${n} time${n === 1 ? "" : "s"}</small></li>`).join("")}</ul>`
        : '<p class="small muted">Nothing marked yet.</p>'
    }</div>
  </div>`;
}

PAGES.progress = {
  tab: "progress",
  render() {
    const first = VISITS[0];
    const last = VISITS[VISITS.length - 1];
    return `<section class="screen screen-progress">${header("Progress", null, { sub: `Toward: ${esc(PATIENT.goal.toLowerCase())}` })}
      <div class="screen-body">
        <section class="chart-card" aria-labelledby="chart-title">
          <h2 id="chart-title" class="card-title">${esc(PATIENT.goalQuestion)}</h2>
          <p class="chart-legend"><strong>0</strong> = very hard · <strong>10</strong> = easy</p>
          ${goalChart("How easy carrying your daughter feels, rated at each visit")}
          <p class="chart-caption">Your comfort went up <strong>${last.comfort - first.comfort} points</strong> since ${fmtMonth(visitDate(first))}. ${PATIENT.goalTarget - last.comfort} more to reach your goal.</p>
        </section>
        <h2 class="section-title">What affects your pain</h2>
        ${painPatterns()}
        <h2 class="section-title">Past visits</h2>
        <div class="card list-card">${[...VISITS]
          .reverse()
          .map((v) =>
            linkRow(
              `#/visit/${v.id}`,
              `${fmtDay(visitDate(v))} · ${v.title}`,
              `Score ${v.comfort}/10 · ${v.sessions.includes(" of ") ? `${v.sessions} exercises done` : v.sessions}`,
            ),
          )
          .join("")}</div>
      </div>
    </section>`;
  },
};

PAGES.visit = {
  tab: "progress",
  guard: ({ id }) => (VISITS.some((v) => v.id === id) ? null : "/progress"),
  render({ id }) {
    const i = VISITS.findIndex((v) => v.id === id);
    const v = VISITS[i];
    const before = VISITS[i - 1];
    return `<section class="screen screen-visit">${header(v.title, "#/progress", { sub: `${fmtDay(visitDate(v))} · ${PT.clinic}` })}
      <div class="screen-body">
        ${receipt([
          ["Goal score", `${v.comfort}/10`],
          ...(before
            ? [
                [
                  "Change since last visit",
                  `${v.comfort - before.comfort >= 0 ? "+" : ""}${v.comfort - before.comfort}`,
                ],
              ]
            : []),
          ["Exercises done", before ? esc(v.sessions) : "First plan"],
        ])}
        <h2 class="section-title">What your PT said</h2>
        <blockquote class="pt-quote">${avatar(PT.label)}<p>${esc(v.note)}</p></blockquote>
        <h2 class="section-title">Plan after this visit</h2>
        <p class="card plain-card">${esc(v.plan)}</p>
        <h2 class="section-title">Your questions</h2>
        ${
          v.questions.length
            ? v.questions
                .map(
                  (q) =>
                    `<div class="card qa-card"><p class="qa-q">${esc(q.q)}</p><p class="qa-a"><strong>Your PT:</strong> ${esc(q.a)}</p></div>`,
                )
                .join("")
            : '<p class="empty-state">No questions at this visit.</p>'
        }
      </div>
    </section>`;
  },
};
