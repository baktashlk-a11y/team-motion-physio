"use strict";
/* The address after # decides the screen, for example #/log/new.
   Because every screen has its own address, the bottom nav, the back
   arrows and the phone's own back gesture all work from anywhere. */

const ROUTES = [
  ["/", "home"],
  ["/home", "home"],
  ["/exercises", "exercises"],
  ["/session", "session"],
  ["/checkin", "checkin"],
  ["/done", "done"],
  ["/log", "log"],
  ["/log/new", "logNew"],
  ["/log/saved", "logSaved"],
  ["/log/:id", "logDetail"],
  ["/progress", "progress"],
  ["/visit/:id", "visit"],
  ["/prep", "prep"],
  ["/prep/note", "prepNote"],
  ["/prep/note/:index", "prepNote"],
  ["/inbox", "inbox"],
  ["/inbox/:id", "message"],
  ["/profile", "profile"],
  ["/ask", "askAny"],
  ["/plan/:id", "plan"],
  ["/plan/:id/edit", "planEdit"],
  ["/buddy/add", "addBuddy"],
  ["/buddy/:id", "buddy"],
  ["/buddy/:id/ask", "ask"],
  ["/buddy/:id/sent", "sent"],
  ["/settings", "settings"],
  ["/settings/notifications", "notifications"],
  ["/settings/credits", "credits"],
  ["/settings/privacy", "privacy"],
  ["/settings/privacy/pt", "privacyPt"],
  ["/settings/privacy/buddies", "privacyBuddies"],
];

const app = document.getElementById("app");
let cleanups = [];
const onCleanup = (fn) => cleanups.push(fn);

function currentPath() {
  return location.hash.replace(/^#/, "") || "/home";
}

function matchRoute(path) {
  const parts = path.split("/");
  for (const [pattern, page] of ROUTES) {
    const want = pattern.split("/");
    if (want.length !== parts.length) continue;
    const params = {};
    const ok = want.every((part, i) => {
      if (part.startsWith(":")) {
        params[part.slice(1)] = decodeURIComponent(parts[i]);
        return true;
      }
      return part === parts[i];
    });
    if (ok) return { page, params };
  }
  return { page: "home", params: {} };
}

/* Go to a route. replace: true skips history, so Back won't return to a finished form. */
function go(path, { replace = false } = {}) {
  const hash = `#${path}`;
  if (location.hash === hash) render();
  else if (replace) {
    history.replaceState(null, "", hash);
    render();
  } else location.hash = hash;
}

function render({ keepScroll = false } = {}) {
  const { page, params } = matchRoute(currentPath());
  const def = PAGES[page];
  const redirect = def.guard && def.guard(params);
  if (redirect) {
    go(redirect, { replace: true });
    return;
  }
  const oldBody = $(".screen-body", app);
  const top = keepScroll && oldBody ? oldBody.scrollTop : 0;
  cleanups.forEach((fn) => fn());
  cleanups = [];
  app.innerHTML = def.render(params) + (def.tab ? bottomNav(def.tab) : "");
  app.dataset.page = page;
  const body = $(".screen-body", app);
  if (body) body.scrollTop = top;
  if (def.mount) def.mount(params);
  if (!keepScroll) app.focus({ preventScroll: true });
}

/* Redraw the same screen after a change, without jumping to the top. */
function rerender() {
  render({ keepScroll: true });
}

window.addEventListener("hashchange", () => render());
