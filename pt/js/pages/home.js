/* ---------- Page: Home ---------- */
function pageHome() {
  const todays = allVisits()
    .filter((v) => v.week === 0 && v.day === TODAY.dayIndex)
    .sort((a, b) => hourOffset(a.time) - hourOffset(b.time));
  const later = allVisits()
    .filter((v) => v.week === 0 && v.day > TODAY.dayIndex)
    .sort((a, b) => a.day - b.day || hourOffset(a.time) - hourOffset(b.time));
  const leftToday = todays.filter((v) => v.status !== "seen");
  const upNextVisit = leftToday[0] || later[0];
  const up = upNextVisit && getPatient(upNextVisit.patient);
  const sub =
    todays.length === 0
      ? "No visits today."
      : leftToday.length === 0
        ? `${todays.length} visit${todays.length > 1 ? "s" : ""} today. All done.`
        : `${todays.length} visit${todays.length > 1 ? "s" : ""} today. ${firstName(up)} is up next.`;

  return `
  <div class="page-head">
    <div><h1>Good morning, <em>Jordan</em></h1><p class="muted">${sub}</p></div>
  </div>
  <div class="grid home-grid">
    <section class="card cal-card" aria-label="Calendar">${calendarHTML()}</section>
    <div class="home-side">
      ${up ? upNextHTML(up, upNextVisit) : `<section class="card tint"><h3>No more visits today</h3><p class="muted small">Check the week view for what's next.</p></section>`}
      <section class="card">
        <div class="card-head"><h3>Later this week</h3><a href="#/patients">All patients</a></div>
        ${
          later.length
            ? `<ul class="people">${later
                .map((v) => {
                  const p = getPatient(v.patient);
                  const n = newCount(p);
                  return `<li><a href="#/patient/${p.id}"><span class="avatar">${p.initials}</span>
            <span class="grow"><strong>${esc(p.name)}</strong><br><small class="muted">${DAY_NAMES[v.day]} · ${niceTime(v.time)}</small></span>
            <small class="${n ? "new-text" : "muted"}">${n ? `${n} new` : "Up to date"}</small></a></li>`;
                })
                .join("")}</ul>`
            : `<p class="muted small">No other visits this week.</p>`
        }
      </section>
    </div>
  </div>`;
}

function upNextHTML(p, v) {
  const published = state.published[p.id];
  const isToday = v.day === TODAY.dayIndex;
  const mins = Math.max(
    0,
    Math.round((hourOffset(v.time) - hourOffset(TODAY.time)) * 60),
  );
  const when = !isToday
    ? DAY_NAMES[v.day].toUpperCase()
    : mins <= 0
      ? "NOW"
      : mins < 60
        ? `IN ${mins} MIN`
        : `IN ${Math.round(mins / 60)} HOUR${mins >= 90 ? "S" : ""}`;
  return `
  <section class="card tint upnext">
    <div class="upnext-top"><span class="eyebrow">UP NEXT</span><span class="when-pill">${when === "NOW" ? "Now" : when.charAt(0) + when.slice(1).toLowerCase()}</span></div>
    <div class="who-row"><span class="avatar">${p.initials}</span><span><strong class="big-name">${esc(p.name)}</strong><br><small class="muted">${isToday ? "Today" : DAY_NAMES[v.day]} · ${niceTime(v.time)}</small></span></div>
    <hr>
    <p class="eyebrow">NEW SINCE LAST VISIT</p>
    <dl class="kv">
      <div><dt>Daily moments</dt><dd>${countKind(p, "moment")}</dd></div>
      <div><dt>Questions</dt><dd>${countKind(p, "question")}</dd></div>
      <div><dt>Days with exercises</dt><dd>${p.stats.daysWithEx.replace("/", " of ")}</dd></div>
    </dl>
    
    <a class="btn block" href="#/patient/${p.id}">Open ${esc(firstName(p))} ›</a>
  </section>`;
}

function calendarHTML() {
  const w = state.calWeek;
  const week = WEEKS[String(w)];
  const hours = [
    "9:00",
    "10:00",
    "11:00",
    "12:00",
    "1:00",
    "2:00",
    "3:00",
    "4:00",
    "5:00",
  ];
  const visits = allVisits().filter((v) => v.week === w);
  const isThisWeek = w === 0;
  const months = w < 0 ? "Oct" : "Nov";
  const cols = DAY_NAMES.map((d, i) => {
    const today = isThisWeek && i === TODAY.dayIndex;
    const items = visits
      .filter((v) => v.day === i)
      .map((v) => {
        const p = getPatient(v.patient);
        const n = newCount(p);
        const status =
          v.status === "seen"
            ? "Seen"
            : v.status === "booked"
              ? "Booked"
              : n
                ? `${n} new`
                : "Up to date";
        const top = hourOffset(v.time);
        return `<a class="appt ${v.status}" style="top:calc(var(--row) * ${top})" href="#/patient/${p.id}" title="${esc(p.name)}, ${niceTime(v.time)}">
        <strong class="${v.status === "seen" ? "cross" : ""}">${esc(p.name)}</strong><small><span class="${v.status === "seen" ? "cross" : ""}">${niceTime(v.time)}</span> · ${status}</small></a>`;
      })
      .join("");
    const nowLine = today
      ? `<span class="now-line" style="top:calc(var(--row) * ${hourOffset(TODAY.time)})" aria-hidden="true"></span>`
      : "";
    return `<div class="cal-col ${today ? "today" : ""}">${nowLine}${items}</div>`;
  }).join("");

  return `
  <div class="card-head">
    <h3 class="cal-title">${week.label}${isThisWeek ? `<span class="tag green">This week</span>` : ""}</h3>
    <div class="btn-row">
      ${w !== 0 ? `<button class="btn ghost small" data-action="cal-today">This week</button>` : ""}
      <button class="icon-btn sm" data-action="cal-prev" aria-label="Previous week" ${w <= -1 ? "disabled" : ""}>‹</button>
      <button class="icon-btn sm" data-action="cal-next" aria-label="Next week" ${w >= 2 ? "disabled" : ""}>›</button>
    </div>
  </div>
  <div class="cal">
    <div class="cal-head"><span></span>${DAY_NAMES.map((d, i) => `<span class="${isThisWeek && i === TODAY.dayIndex ? "today" : ""}">${d.toUpperCase()}<b>${week.days[i]}</b></span>`).join("")}</div>
    <div class="cal-body">
      <div class="cal-hours">${hours.map((h) => `<span>${h}</span>`).join("")}</div>
      ${cols}
    </div>
  </div>
  ${visits.length === 0 ? `<p class="muted small" style="margin-top:.75rem">No visits booked for ${week.label.replace(" to ", "–")} ${months}.</p>` : ""}`;
}
