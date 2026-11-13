/* ---------- Actions ---------- */
document.addEventListener("click", (e) => {
  if (e.target.matches("[data-close-modal]") || e.target.closest(".close-x")) {
    closeModal();
    return;
  }

  const row = e.target.closest("tr[data-href]");
  if (row && !e.target.closest("a")) {
    location.hash = row.dataset.href;
    return;
  }

  const el = e.target.closest("[data-action]");
  if (!el || el.tagName === "FORM" || el.matches("input, textarea, select"))
    return;
  const a = el.dataset.action;
  const { parts } = parseHash();
  const p =
    parts[0] === "patient" ? getPatient(parts[1]) : getPatient(el.dataset.id);

  switch (a) {
    case "cal-prev":
      state.calWeek = Math.max(-1, state.calWeek - 1);
      save();
      render();
      break;
    case "cal-next":
      state.calWeek = Math.min(2, state.calWeek + 1);
      save();
      render();
      break;
    case "cal-today":
      state.calWeek = 0;
      save();
      render();
      break;
    case "clear-search":
      $("#patient-search").value = "";
      filterPatientRows();
      break;

    case "remove-ex": {
      const d = getDraft(p);
      const i = +el.dataset.i;
      const [removed] = d.items.splice(i, 1);
      save();
      render();
      toast(`Removed ${getEx(removed.exId).name}`, () => {
        d.items.splice(i, 0, removed);
        save();
        render();
      });
      break;
    }
    case "add-ex":
      openAddExercise(p);
      break;
    case "go-preview": {
      const d = getDraft(p);
      if (!d.why.trim()) {
        // No reason yet: jump to the box and show the red message
        const box = $("#why");
        box.classList.add("invalid");
        $("#why-error").hidden = false;
        box.scrollIntoView({ behavior: "smooth", block: "center" });
        box.focus({ preventScroll: true });
        break;
      }
      location.hash = `#/patient/${p.id}/preview`;
      break;
    }
    case "cancel-draft":
      confirmCancelDraft(p);
      break;
    case "publish":
      publish(p);
      break;
    case "add-score":
      openScore(p);
      break;
    case "edit-focus":
      openFocus(p);
      break;
    case "edit-reply": {
      const text = state.replies[el.dataset.id];
      delete state.replies[el.dataset.id];
      save();
      render();
      const ta = document.querySelector(`#reply-${el.dataset.id}`);
      if (ta) {
        ta.value = text;
        ta.focus();
      }
      break;
    }
    case "show-ex":
      openExerciseInfo(el.dataset.ex);
      break;
    case "new-ex":
      openNewExercise();
      break;
    case "reset":
      openModal(
        `<div class="modal-head"><h2>Reset the prototype?</h2><button class="close-x" aria-label="Close">×</button></div>
      <p class="muted">All drafts, answers and published plans go back to the start.</p>
      <div class="btn-row" style="margin-top:1.25rem"><button class="btn danger" id="do-reset">Reset</button><button class="btn ghost" data-close-modal>Keep my changes</button></div>`,
        (m) => {
          m.querySelector("#do-reset").onclick = () => {
            state = freshState();
            save();
            location.hash = "#/home";
            render();
            toast("Prototype reset.");
          };
        },
        "sm",
      );
      break;
  }
});

document.addEventListener("change", (e) => {
  const el = e.target;
  const { parts } = parseHash();
  const p = parts[0] === "patient" ? getPatient(parts[1]) : null;
  if (!p) return;
  if (el.dataset.action === "toggle-must") {
    getDraft(p).items[+el.dataset.i].must = el.checked;
    save();
    render();
  } else if (el.dataset.action === "next-visit") {
    getDraft(p).nextVisit = el.value;
    save();
  }
});

document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.dataset.action !== "why") return;
  const { parts } = parseHash();
  const p = getPatient(parts[1]);
  if (!p) return;
  getDraft(p).why = el.value;
  save();
  // Once they type, the red message goes away
  if (el.value.trim() !== "") {
    el.classList.remove("invalid");
    const err = $("#why-error");
    if (err) err.hidden = true;
  }
});

document.addEventListener("submit", (e) => {
  const f = e.target;
  if (f.dataset.action === "save-reply") {
    e.preventDefault();
    const text = f.reply.value.trim();
    if (!text) {
      f.reply.focus();
      toast("Write an answer first.");
      return;
    }
    state.replies[f.dataset.id] = text;
    save();
    render();
    toast("Answer saved. It goes out with the next plan update.");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#modal-root").innerHTML) closeModal();
});
