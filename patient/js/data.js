"use strict";
/* Demo data for Maya, the patient persona.
   Dates are counted from today, so the demo never looks out of date:
   the plan started 5 days ago and the next visit is in 2 days (one visit a week).
   Exercise names, timings and prescriptions match PT/js/data.js. */

/* App name: change it here and it updates everywhere. */
const APP_NAME = "Recovery Beyond Clinic";
const APP_TAGLINE = "Physio between visits";

const SEVERE = 8; // discomfort of 8 or more alerts the PT

function daysFromToday(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

/* Other outside images or icons, cited in Settings, Image credits. */
const OTHER_CREDITS = [
  {
    what: "Settings gear icon",
    apa: "Lucide Contributors. (n.d.). <em>Settings</em> [Icon]. Lucide. ISC License. https://lucide.dev/icons/settings",
  },
];

const PATIENT = {
  name: "Maya",
  goal: "Carry and play with my daughter again",
  goalQuestion: "How hard is carrying your daughter?",
  goalTarget: 2, // goal: 2 out of 10 or lower (0 = easy, 10 = very hard)
};

const PT = {
  name: "Jordan Lee", // shown only in Profile, so patients can switch PT
  label: "Your PT", // used everywhere else
  role: "Physiotherapist",
  clinic: "Valley Physio",
};

const PLAN = {
  startedOffset: -5, // one clinic visit a week
  nextVisitOffset: 2,
  nextVisitTime: "10:30 am",
};

/* gif = file in Patient/assets/ (names must match exactly, capitals too).
   source = where the GIF came from. cite shows under the GIF,
   apa is the full APA 7 reference in Settings, Image credits. */
const EXERCISES = [
  {
    id: "wallsquat",
    gif: "Wallsquat.gif",
    source: {
      name: "Pinterest",
      url: "https://www.pinterest.com/pin/460282024409651175/",
      cite: "Pinterest, n.d.", // in-text citation, shown under the GIF
      apa: "Pinterest. (n.d.). <em>[Wall squat demonstration]</em> [GIF]. https://www.pinterest.com/pin/460282024409651175/", // APA 7 reference
    },
    name: "Wall squats",
    minutes: 5,
    must: true,
    standard: "3 sets of 10",
    easier: "2 sets of 8 · smaller bend",
    detail: "Back on the wall, slide down slowly.",
    steps: [
      "Stand with your back flat on the wall.",
      "Slide down slowly until your knees bend.",
      "Hold for 2 seconds, then slide back up.",
    ],
  },
  {
    id: "bandrow",
    gif: "seated-row-band.gif",
    source: {
      name: "SELF",
      url: "https://www.self.com/gallery/upper-body-circuit-workout-resistance-bands",
      cite: "SELF, n.d.", // in-text citation, shown under the GIF
      apa: "SELF. (n.d.). <em>[Seated resistance band row demonstration]</em> [GIF]. https://www.self.com/gallery/upper-body-circuit-workout-resistance-bands", // APA 7 reference
    },
    name: "Band rows",
    minutes: 6,
    must: true,
    standard: "3 × 12 · medium band",
    easier: "3 × 10 · light band",
    detail: "Sit tall, band around your feet, pull to your ribs.",
    steps: [
      "Sit with your legs straight and the band around your feet.",
      "Pull your hands to your ribs and squeeze your shoulder blades.",
      "Let go slowly, then repeat.",
    ],
  },
  {
    id: "farmer",
    gif: "Framer_Carry.gif",
    source: {
      name: "Peloton",
      url: "https://www.onepeloton.com/blog/farmers-carry",
      cite: "Sullivan, 2025", // in-text citation, shown under the GIF
      apa: "Sullivan, J. (2025, June 25). <em>The farmer’s carry exercise is the epitome of functional strength. Here’s how to add it to your training</em> [GIF of Peloton instructor Matty Maggiacomo]. The Output by Peloton. https://www.onepeloton.com/blog/farmers-carry", // APA 7 reference
    },
    name: "Farmer hold",
    minutes: 4,
    must: true,
    standard: "4 × 30 seconds",
    easier: "4 × 15 seconds · lighter bags",
    detail: "Hold a weight in each hand and stand tall.",
    steps: [
      "Hold a weight or a full bag in each hand.",
      "Stand tall and keep your shoulders down.",
      "Breathe slowly and hold, or walk slowly.",
    ],
  },
  {
    id: "calf",
    gif: "Calf-raises-1.gif",
    source: {
      name: "OCoach",
      url: "https://blog.ocoach.app/calf-raises/",
      cite: "O’Coach Fitness App, 2023", // in-text citation, shown under the GIF
      apa: "O’Coach Fitness App. (2023, March 23). <em>How to do standing calf raises correctly</em> [GIF]. O’Coach Blog. https://blog.ocoach.app/calf-raises/", // APA 7 reference
    },
    name: "Calf raises",
    minutes: 3,
    must: false,
    standard: "3 sets of 15",
    easier: "2 sets of 10 · hold a chair for balance",
    detail: "Rise onto your toes and lower slowly.",
    steps: [
      "Stand with your feet hip width apart.",
      "Rise onto your toes.",
      "Lower your heels slowly.",
    ],
  },
  {
    id: "hamstring",
    gif: "Lying-hamstring-stretch.gif",
    source: {
      name: "Healthline",
      url: "https://www.healthline.com/health/tight-hamstring",
      cite: "Marcin, 2019", // in-text citation, shown under the GIF
      apa: "Marcin, A. (2019, June 10). <em>How to treat and prevent tight hamstrings</em> [GIF; photos courtesy of Active Body. Creative Mind.]. Healthline. https://www.healthline.com/health/tight-hamstring", // APA 7 reference
    },
    name: "Hamstring stretch",
    minutes: 3,
    must: false,
    standard: "30 seconds each side",
    easier: "20 seconds each side · bend your knee a little",
    detail: "Lie on your back and lift one straight leg.",
    steps: [
      "Lie on your back with both legs straight.",
      "Lift one leg and hold it behind the thigh or with a strap.",
      "Hold for 30 seconds, then switch sides.",
    ],
  },
];

/* Past visits. hard = how hard the goal feels, rated by Maya and her PT together.
   0 = easy, 10 = very hard. Same direction as the discomfort scale: lower is better. */
const VISITS = [
  {
    id: "first",
    offset: -19,
    hard: 7,
    title: "First visit",
    plan: "Wall squats, Farmer hold, Calf raises",
    sessions: "First plan",
    note: "Lifting from the floor is the hardest part for you. We'll start gentle and build up.",
    questions: [],
  },
  {
    id: "second",
    offset: -12,
    hard: 6,
    title: "Check-up",
    plan: "4 exercises · 2 must-dos",
    sessions: "3 of 4",
    note: "Good work on the busy weeks. Keep the must-dos, even when you skip the rest.",
    questions: [
      {
        q: "Can I carry groceries?",
        a: "Yes. Split the bags so both hands carry the same weight.",
      },
    ],
  },
  {
    id: "third",
    offset: -5,
    hard: 4,
    title: "Check-up",
    plan: "5 exercises · 3 must-dos",
    sessions: "4 of 5",
    note: "Big jump this time! I added band rows to help your back when you lift her.",
    questions: [
      {
        q: "Is it OK to lift my daughter on a sore day?",
        a: "Yes, but bend your knees and keep her close. Skip it if pain goes above 5.",
      },
    ],
  },
];

const OUTCOMES = [
  "Felt good",
  "Some discomfort",
  "Needed a pause",
  "Could not finish",
];
const HELP_OPTIONS = ["Took a break", "Bent my knees", "Used the railing"];

function seedMoments() {
  return [
    {
      id: "sample-carrying",
      activity: "Carrying my daughter upstairs",
      at: dateAt(0, "10:30"),
      outcome: "Needed a pause",
      discomfort: 4,
      help: ["Took a break"],
      note: "",
    },
    {
      id: "sample-groceries",
      activity: "Carried groceries from the car",
      at: dateAt(-1, "18:15"),
      outcome: "Felt good",
      discomfort: 1,
      help: [],
      note: "",
    },
    {
      id: "sample-vacuuming",
      activity: "Vacuuming the living room",
      at: dateAt(-6, "16:40"),
      outcome: "Could not finish",
      discomfort: 6,
      help: ["Took a break"],
      note: "My lower back felt tight after.",
    },
  ];
}

function seedMessages() {
  return [
    {
      id: "plan",
      kind: "plan",
      from: PT.label,
      at: dateAt(PLAN.startedOffset, "17:05"),
      title: "Your new plan is ready",
      text: "Hi Maya, here's your plan until our next visit. I added band rows to help your back when you lift your daughter. On busy or sore weeks, the 3 must-dos are enough.",
      read: true,
    },
    {
      id: "alex-joined",
      kind: "buddy",
      from: "Alex",
      at: dateAt(-23, "20:12"),
      title: "Alex is now your buddy",
      text: "Alex accepted your invite. He can see your plan and the sessions you ask him to join. He can't see your pain or notes.",
      read: true,
    },
  ];
}

function seedBuddies() {
  return [
    {
      id: "alex",
      name: "Alex",
      relation: "Partner",
      since: dateAt(-23, "20:12"),
      status: "active",
      sees: { plan: true, sessions: true },
    },
    {
      id: "jamie",
      name: "Jamie",
      relation: "Friend",
      since: dateAt(-9, "13:40"),
      status: "active",
      sees: { plan: true, sessions: true },
    },
  ];
}

function seedRequests() {
  return [
    {
      id: "seed-request",
      buddy: "alex",
      kind: "chore",
      chore: "Bath time with the kids",
      day: dateAt(1, "12:00"),
      slot: "Evening",
      exercises: "must",
      note: "",
      status: "yes",
    },
  ];
}

/* ISO string for a day offset and a "HH:MM" time. */
function dateAt(offset, time) {
  const d = daysFromToday(offset);
  const [h, m] = time.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
