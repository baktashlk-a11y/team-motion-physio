/* ---------- Start ---------- */
$("#today-date").textContent = TODAY.label.toUpperCase();
window.addEventListener("hashchange", render);
if (!location.hash) location.replace("#/home");
render();
