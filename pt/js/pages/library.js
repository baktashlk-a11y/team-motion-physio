/* ---------- Page: Plan library ---------- */
function pageLibrary(params) {
  const area = params.area || "All";
  const areas = ["All", ...new Set(state.library.map((e) => e.area))];
  const items = state.library.filter((e) => area === "All" || e.area === area);
  const usedIn = (id) =>
    state.patients.filter((p) => p.plan.items.some((it) => it.exId === id))
      .length;
  return `
  <div class="page-head">
    <div><h1>Plan library</h1><p class="muted">Exercises you can add to any home plan.</p></div>
    <button class="btn" data-action="new-ex">+ New exercise</button>
  </div>
  <div class="toolbar">
    <div class="chips">${areas.map((a) => `<a class="chip ${a === area ? "on" : ""}" href="#/library?area=${encodeURIComponent(a)}">${esc(a)}</a>`).join("")}</div>
    <label class="sr-only" for="lib-search">Search exercises</label>
    <input id="lib-search" type="search" placeholder="Search exercises">
  </div>
  <div class="lib-grid" id="lib-grid">${items
    .map(
      (e) => `
    <button class="card lib-card" data-action="show-ex" data-ex="${e.id}" data-name="${esc(e.name.toLowerCase())}">
      <span class="tag">${esc(e.area)}</span>
      <strong>${esc(e.name)}</strong>
      <span class="muted small">${e.min} min · in ${usedIn(e.id)} plan${usedIn(e.id) === 1 ? "" : "s"}</span>
    </button>`,
    )
    .join("")}</div>
  <p id="no-ex" class="empty-state" hidden>No exercises match.</p>`;
}
function filterLibrary() {
  const q = $("#lib-search").value.trim().toLowerCase();
  let n = 0;
  document.querySelectorAll("#lib-grid .lib-card").forEach((c) => {
    const ok = c.dataset.name.includes(q);
    c.hidden = !ok;
    if (ok) n++;
  });
  $("#no-ex").hidden = n > 0;
}
