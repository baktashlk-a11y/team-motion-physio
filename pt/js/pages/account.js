/* ---------- Page: Account ---------- */
function pageAccount() {
  return `
  <div class="page-head"><div><h1>Your account</h1><p class="muted">Jordan Lee · Physiotherapist</p></div></div>
  <div class="grid half">
    <section class="card">
      <h3 class="small-title">Profile</h3>
      <dl class="summary"><dt>NAME</dt><dd>Jordan Lee</dd><dt>CLINIC</dt><dd>${CLINIC}</dd><dt>PATIENTS</dt><dd>${state.patients.length}</dd></dl>
    </section>
    <section class="card">
      <h3 class="small-title">What patients share with you</h3>
      <p class="small muted">Patients choose this in their app under Settings › Privacy. By default you see daily moments, check-ins and questions. Buddies never see any of these.</p>
    </section>
    <section class="card">
      <h3 class="small-title">Prototype</h3>
      <p class="small muted">Reset brings back the starting data, for the next test user.</p>
      <button class="btn danger" style="margin-top:.75rem" data-action="reset">Reset prototype data</button>
    </section>
  </div>`;
}
