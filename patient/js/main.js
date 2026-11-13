"use strict";
/* Starts the app. One listener for each kind of event reads the
   data-action, id or data-submit on the element, and calls the page's handler. */

document.addEventListener("click", (event) => {
  const el = event.target.closest("[data-action]");
  if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
  const handler = ACTIONS[el.dataset.action];
  if (!handler) return;
  event.preventDefault();
  handler(el, event);
});

document.addEventListener("input", (event) => {
  const handler = INPUTS[event.target.id];
  if (handler) handler(event.target, event);
});

/* Switches: data-toggle="notif.daily" saves straight into state. */
document.addEventListener("change", (event) => {
  const path = event.target.dataset && event.target.dataset.toggle;
  if (!path) return;
  setPath(path, event.target.checked);
  save();
  toast("Saved");
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-submit]");
  if (!form) return;
  event.preventDefault();
  const handler = SUBMITS[form.dataset.submit];
  if (handler) handler(form, event);
});

ACTIONS["reset-demo"] = () => {
  openModal({
    title: "Reset the demo?",
    text: "This brings back Maya's starting data and clears everything saved in this browser.",
    confirm: "Reset demo",
    style: "danger",
    onConfirm: () => {
      resetState();
      go("/home");
      toast("Demo reset");
    },
  });
};

/* App name comes from data.js, so it changes in one place. */
document.title = `${APP_NAME} · Patient`;
$("#app-name").textContent = APP_NAME;

/* If the PT's reply was still on its way when the page closed, send it now. */
schedulePtReply();
render();
