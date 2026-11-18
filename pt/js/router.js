/* ---------- Router ---------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query));
  return { parts, params };
}

let renderedHash = null;

function render() {
  const samePage = renderedHash === location.hash;
  const scrollPosition = { left: window.scrollX, top: window.scrollY };
  const focused = document.activeElement;
  const focusAttributes = focused
    ? ["data-action", "data-id", "data-i", "data-ex", "aria-label"]
        .filter((name) => focused.hasAttribute(name))
        .map((name) => [name, focused.getAttribute(name)])
    : [];
  const { parts, params } = parseHash();
  const [section, id, sub] = parts;
  let html = "";
  let nav = section || "home";

  try {
    if (!section || section === "home") {
      nav = "home";
      html = pageHome();
    } else if (section === "patients") html = pagePatients(params);
    else if (section === "patient") {
      nav = "patients";
      const p = getPatient(id);
      if (!p)
        html = notFound(
          "We couldn't find that patient.",
          "#/patients",
          "Go to patients",
        );
      else if (!sub) html = pagePatient(p);
      else if (sub === "review") html = pageReview(p, params);
      else if (sub === "edit") html = pageEdit(p);
      else if (sub === "preview") html = pagePreview(p);
      else if (sub === "published") html = pagePublished(p);
      else
        html = notFound(
          "That page doesn't exist.",
          `#/patient/${p.id}`,
          `Back to ${firstName(p)}`,
        );
    } else if (section === "library") html = pageLibrary(params);
    else if (section === "account") html = pageAccount();
    else {
      nav = "";
      html = notFound("That page doesn't exist.", "#/home", "Go home");
    }
  } catch (err) {
    // If a page breaks, show the error on screen (not only in the Console)
    console.error(err);
    html = errorPage(err);
  }

  const main = $("#main");
  main.innerHTML = html;
  document
    .querySelectorAll("[data-nav]")
    .forEach((a) => a.classList.toggle("active", a.dataset.nav === nav));
  $("#side-profile").classList.toggle("active", nav === "account");
  closeModal();
  clearSearch();
  afterRender();
  renderedHash = location.hash;
  if (samePage) {
    const replacement = focused?.isConnected
      ? focused
      : focused?.id
        ? document.getElementById(focused.id)
        : focusAttributes.some(([name]) => name === "data-action")
          ? Array.from(main.querySelectorAll("[data-action]")).find(
              (el) =>
                el.tagName === focused.tagName &&
                focusAttributes.every(([name, value]) => el.getAttribute(name) === value),
            )
          : null;
    (replacement || main).focus({ preventScroll: true });
    window.scrollTo(scrollPosition);
  } else {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}

/* Empty the top-bar search when the page changes, so old text doesn't stay behind. */
function clearSearch() {
  const box = $("#global-search");
  const list = $("#search-results");
  if (box) box.value = "";
  if (list) list.hidden = true;
}

/* Shown when a page breaks, so testers never get a silent "nothing happens". */
function errorPage(err) {
  return `<div class="empty-state">
    <h3>Something went wrong on this page</h3>
    <p>Try resetting the prototype data. If that doesn't help, send this message to the team:</p>
    <pre class="error-text"><strong>${esc(err && err.message ? err.message : String(err))}</strong>
${esc(err && err.stack ? err.stack : "")}</pre>
    <p class="btn-row center" style="margin-top:1rem">
      <button class="btn" data-action="reset">Reset prototype data</button>
      <a class="btn ghost" href="#/home">Go home</a>
    </p>
  </div>`;
}

function notFound(msg, href, label) {
  return `<div class="empty-state"><h3>Page not found</h3><p>${esc(msg)}</p><p style="margin-top:1rem"><a class="btn" href="${href}">${esc(label)}</a></p></div>`;
}

/* Small hooks that need live DOM (search boxes, sliders). */
function afterRender() {
  const ps = $("#patient-search");
  if (ps) {
    ps.addEventListener("input", () => {
      filterPatientRows();
    });
    filterPatientRows(); // apply the filter chip (All / Visit this week / Has new updates) right away
  }
  const ls = $("#lib-search");
  if (ls) ls.addEventListener("input", () => filterLibrary());
}
