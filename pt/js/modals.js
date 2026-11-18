/* ---------- Modals and flows ---------- */
function confirmCancelDraft(p) {
  const go = () => {
    const old = state.drafts[p.id];
    delete state.drafts[p.id];
    save();
    location.hash = `#/patient/${p.id}`;
    render();
    toast("Draft discarded.", () => {
      state.drafts[p.id] = old;
      save();
      render();
    });
  };
  if (!isDirty(p)) {
    go();
    return;
  }
  openModal(
    `<div class="modal-head"><h2>Discard this draft?</h2><button class="close-x" aria-label="Close">×</button></div>
    <p class="muted">Your changes will be lost. ${esc(firstName(p))}'s plan stays at version ${p.plan.version}.</p>
    <div class="btn-row" style="margin-top:1.25rem"><button class="btn danger" id="yes">Discard draft</button><button class="btn ghost" data-close-modal>Keep editing</button></div>`,
    (m) => {
      m.querySelector("#yes").onclick = () => {
        closeModal();
        go();
      };
    },
    "sm",
  );
}

function publish(p) {
  const d = state.drafts[p.id];
  if (!d) {
    location.hash = `#/patient/${p.id}/edit`;
    return;
  }
  const newVer = p.plan.version + 1;
  p.plan = {
    version: newVer,
    setOn: TODAY.short,
    by: "Jordan Lee",
    items: clone(d.items),
    why: d.why.trim(),
  };
  // Book the next visit on the calendar
  const m = d.nextVisit.match(/(\w+), (\d+) Nov · (\d+:\d+)/);
  if (m) {
    const dayNum = m[2];
    const weekKey = Object.keys(WEEKS).find(
      (k) => k !== "-1" && WEEKS[k].days.includes(dayNum),
    );
    if (weekKey) {
      state.extraVisits = state.extraVisits.filter((v) => v.patient !== p.id);
      state.extraVisits.push({
        patient: p.id,
        week: +weekKey,
        day: WEEKS[weekKey].days.indexOf(dayNum),
        time: m[3],
        status: "upcoming",
      });
    }
  }
  state.published[p.id] = {
    version: newVer,
    at: `${TODAY.short} · ${TODAY.time}`,
    mustCount: mustItems(d.items).length,
    nextVisit: d.nextVisit,
  };
  if (p.visit.week === 0 && p.visit.day === TODAY.dayIndex)
    state.visitDone[p.id] = true;
  delete state.drafts[p.id];
  save();
  location.hash = `#/patient/${p.id}/published`;
}

function openAddExercise(p) {
  const d = getDraft(p);
  const listHTML = (q) =>
    state.library
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) || e.area.toLowerCase().includes(q),
      )
      .map((e) => {
        const inPlan = d.items.some((it) => it.exId === e.id);
        return `<div class="lib-row"><span><strong>${esc(e.name)}</strong><br><small class="muted">${esc(e.area)} · ${e.min} min</small></span>
      <button class="btn small ${inPlan ? "ghost" : ""}" data-add="${e.id}" ${inPlan ? "disabled" : ""}>${inPlan ? "In plan" : "Add"}</button></div>`;
      })
      .join("") ||
    `<p class="muted small" style="padding:1rem 0">No exercises match.</p>`;
  openModal(
    `<div class="modal-head"><h2>Add an exercise</h2><button class="close-x" aria-label="Close">×</button></div>
    <label class="sr-only" for="add-search">Search</label>
    <input id="add-search" type="search" class="full-input" placeholder="Search by name or body area">
    <div id="add-list">${listHTML("")}</div>`,
    (m) => {
      const s = m.querySelector("#add-search");
      s.addEventListener("input", () => {
        m.querySelector("#add-list").innerHTML = listHTML(
          s.value.trim().toLowerCase(),
        );
      });
      m.addEventListener("click", (ev) => {
        const b = ev.target.closest("[data-add]");
        if (!b) return;
        d.items.push({ exId: b.dataset.add, must: false });
        save();
        toast(`Added ${getEx(b.dataset.add).name}`);
        render();
      });
    },
  );
}

function openScore(p) {
  const last = p.comfort[p.comfort.length - 1];
  openModal(
    `<div class="modal-head"><h2>Today's ${esc(p.comfortLabel.toLowerCase())}</h2><button class="close-x" aria-label="Close">×</button></div>
    <p class="muted small">Measure it together at the visit. Last time: ${last} out of 10.</p>
    <div class="score-form"><label class="sr-only" for="score">Score</label>
      <input id="score" type="range" min="0" max="10" value="${last}"><span class="score-val" id="score-val">${last}</span></div>
    <div class="btn-row" style="margin-top:1.25rem"><button class="btn" id="save-score">Save score</button><button class="btn ghost" data-close-modal>Cancel</button></div>`,
    (m) => {
      const r = m.querySelector("#score");
      r.addEventListener("input", () => {
        m.querySelector("#score-val").textContent = r.value;
      });
      m.querySelector("#save-score").onclick = () => {
        const todayIdx = p.comfortDates.indexOf(TODAY.short);
        if (todayIdx >= 0) p.comfort[todayIdx] = +r.value;
        else {
          p.comfort.push(+r.value);
          p.comfortDates.push(TODAY.short);
        }
        save();
        render();
        toast("Score saved to the progress graph.");
      };
    },
    "sm",
  );
}

function openFocus(p) {
  openModal(
    `<div class="modal-head"><h2>Your focus for this visit</h2><button class="close-x" aria-label="Close">×</button></div>
    <label class="sr-only" for="focus">Focus</label><textarea id="focus">${esc(p.visitFocus)}</textarea>
    <p class="hint">Only you see this.</p>
    <div class="btn-row" style="margin-top:1rem"><button class="btn" id="save-focus">Save</button><button class="btn ghost" data-close-modal>Cancel</button></div>`,
    (m) => {
      m.querySelector("#save-focus").onclick = () => {
        p.visitFocus = m.querySelector("#focus").value.trim() || p.visitFocus;
        save();
        render();
        toast("Focus saved.");
      };
    },
    "sm",
  );
}

function openExerciseInfo(id) {
  const e = getEx(id);
  const users = state.patients.filter((p) =>
    p.plan.items.some((it) => it.exId === id),
  );
  openModal(`<div class="modal-head"><h2>${esc(e.name)}</h2><button class="close-x" aria-label="Close">×</button></div>
    <p><span class="tag">${esc(e.area)}</span> <span class="muted small">${e.min} min</span></p>
    <p style="margin-top:1rem">${esc(e.how || "No steps written yet.")}</p>
    <div class="video-box" aria-hidden="true">▶ Standard video &nbsp;·&nbsp; Easier video</div>
    <p class="eyebrow" style="margin-top:1rem">IN THESE PLANS</p>
    ${users.length ? `<ul class="people">${users.map((p) => `<li><a href="#/patient/${p.id}"><span class="avatar">${p.initials}</span><span class="grow"><strong>${esc(p.name)}</strong></span>${p.plan.items.find((it) => it.exId === id).must ? `<span class="tag must">MUST-DO</span>` : ""}</a></li>`).join("")}</ul>` : `<p class="muted small">Not in any plan yet.</p>`}`);
}

function openNewExercise() {
  const areas = [...new Set(state.library.map((e) => e.area))];
  openModal(
    `<div class="modal-head"><h2>New exercise</h2><button class="close-x" aria-label="Close">×</button></div>
    <form id="new-ex-form" class="stack">
      <div class="field"><label for="nx-name">Name</label><input id="nx-name" required placeholder="e.g. Side plank"></div>
      <div class="form-row">
        <div class="field"><label for="nx-area">Body area</label><select id="nx-area">${areas.map((a) => `<option>${esc(a)}</option>`).join("")}</select></div>
        <div class="field"><label for="nx-min">Minutes</label><input id="nx-min" type="number" min="1" max="30" value="4" required></div>
      </div>
      <div class="field"><label for="nx-how">How to do it</label><textarea id="nx-how" placeholder="Short steps the patient can follow."></textarea></div>
      <div class="btn-row"><button class="btn" type="submit">Save to library</button><button class="btn ghost" type="button" data-close-modal>Cancel</button></div>
    </form>`,
    (m) => {
      m.querySelector("#new-ex-form").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const name = m.querySelector("#nx-name").value.trim();
        if (!name) return;
        state.library.push({
          id: "custom-" + Date.now(),
          name,
          area: m.querySelector("#nx-area").value,
          min: +m.querySelector("#nx-min").value || 4,
          how: m.querySelector("#nx-how").value.trim(),
        });
        save();
        render();
        toast(`${name} added to the library.`);
      });
    },
  );
}
