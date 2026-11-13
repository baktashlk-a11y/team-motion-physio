/* ---------- Patient search (top bar) ----------
   Type a name or condition → a list drops down → click a patient (or press Enter for the first one). */

const searchInput = $("#global-search");
const searchList = $("#search-results");
let searchIndex = 0; // which result is highlighted (for arrow keys)

function searchMatches() {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return [];
  return state.patients.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.condition.toLowerCase().includes(q),
  );
}

function showSearch() {
  const q = searchInput.value.trim();
  if (!q) {
    hideSearch();
    return;
  }
  const list = searchMatches();
  searchIndex = Math.min(searchIndex, Math.max(0, list.length - 1));
  searchList.innerHTML = list.length
    ? list
        .map(
          (
            p,
            i,
          ) => `<li><a href="#/patient/${p.id}" class="${i === searchIndex ? "focus" : ""}">
        <span class="avatar">${p.initials}</span>
        <span><strong>${esc(p.name)}</strong><br><small>${esc(p.condition)} · ${esc(nextVisitOf(p))}</small></span></a></li>`,
        )
        .join("")
    : `<li class="empty">No patient called “${esc(q)}”.</li>`;
  searchList.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

function hideSearch() {
  searchList.hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
}

function goToPatient(p) {
  searchInput.value = "";
  hideSearch();
  location.hash = `#/patient/${p.id}`;
}

searchInput.addEventListener("input", () => {
  searchIndex = 0;
  showSearch();
});
searchInput.addEventListener("focus", showSearch);

searchInput.addEventListener("keydown", (e) => {
  const list = searchMatches();
  if (e.key === "ArrowDown") {
    e.preventDefault();
    searchIndex = Math.min(searchIndex + 1, list.length - 1);
    showSearch();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    searchIndex = Math.max(searchIndex - 1, 0);
    showSearch();
  } else if (e.key === "Enter" && list.length) {
    e.preventDefault();
    goToPatient(list[searchIndex]);
  } else if (e.key === "Escape") {
    searchInput.value = "";
    hideSearch();
    searchInput.blur();
  }
});

// Click a result: clear the box. Click anywhere else: close the list.
document.addEventListener("click", (e) => {
  if (e.target.closest("#search-results a")) {
    searchInput.value = "";
    hideSearch();
    return;
  }
  if (!e.target.closest(".search")) hideSearch();
});
