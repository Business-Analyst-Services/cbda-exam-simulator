#!/usr/bin/env node
/* Validates the JSON data files and embeds them into index.html.
 *
 *   node build.js
 *
 * questions.json            the 75-item blueprint-weighted exam bank (required)
 * technique-questions.json  technique drill bank (optional)
 * techniques.json           technique reference used by the learn view (optional)
 * studyplan.json            weekly running order (optional)
 * scenario.json             one engagement worked end to end (optional)
 *
 * A missing optional file is embedded as an empty bank and its mode stays off
 * the start screen. Edit the JSON, run this, commit both. The generated block
 * in index.html sits between the two sentinels below and must not be hand-edited.
 */
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const HTML = path.join(dir, "index.html");
const OPEN = "/* === generated data — see build.js, do not edit by hand === */";
const CLOSE = "/* === end generated data === */";

const read = (f, fallback) => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) {
    if (fallback === undefined) { console.error(`build failed: ${f} is missing`); process.exit(1); }
    return fallback;
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
};
const questions = read("questions.json");
const techniques = read("techniques.json", []);
const techQuestions = read("technique-questions.json", []);
const scenario = read("scenario.json", { steps: [] });
const plan = read("studyplan.json", { weeks: [] });

/* ---- the blueprint: six domains, their weights, items and tasks ----
   Weights are the published IIBA-CBDA blueprint. Items are those weights applied
   to 75 by largest remainder. Task names follow the Guide to Business Data
   Analytics and are cited by name only: the Guide's chapter numbering and the
   blueprint's competency numbering do not match. */
const DOMAINS = {
  1: { name: "Identify the Research Questions", weight: 20, items: 15, tasks: [
    "Define Business Problem or Opportunity", "Identify and Understand the Stakeholders", "Assess Current State",
    "Define Future State", "Formulate Research Questions", "Plan Business Data Analytics Approach"] },
  2: { name: "Source Data", weight: 15, items: 11, tasks: [
    "Plan Data Collection", "Determine the Data Sets", "Collect Data", "Validate Data"] },
  3: { name: "Analyze Data", weight: 16, items: 12, tasks: [
    "Develop Data Analysis Plan", "Prepare Data", "Explore Data", "Perform Data Analysis",
    "Assess the Analytics and System Approach Taken"] },
  4: { name: "Interpret and Report Results", weight: 20, items: 15, tasks: [
    "Validate Understanding of Stakeholders", "Plan Stakeholder Communication",
    "Determine Communication Needs of Stakeholders", "Derive Insights from Data",
    "Document and Communicate Findings from Completed Analysis"] },
  5: { name: "Use Results to Influence Business Decision Making", weight: 20, items: 15, tasks: [
    "Recommend Actions", "Develop Implementation Plan", "Manage Change"] },
  6: { name: "Guide Organization-level Strategy for Business Analytics", weight: 9, items: 7, tasks: [
    "Organizational Strategy", "Talent Strategy", "Data Strategy"] }
};
const EXAM_ITEMS = 75;

const TRAPS = [
  "Jumping to data or modelling before the research question is framed",
  "Treating a stakeholder's stated want as the research question",
  "Answering an easier or different question than the one asked",
  "Wrong analytics type for the question",
  "Technique mismatched to the data or the outcome type",
  "Choosing the most sophisticated technique when a simpler one answers it",
  "Treating correlation as causation",
  "Mistaking statistical significance for business significance",
  "Ignoring data quality, bias, sampling or privacy because the result looks interesting",
  "Right action, wrong stage",
  "Technically correct output for the wrong audience or the wrong decision",
  "Stopping at insight without recommendation, implementation or change",
  "Treating a governance or data management problem as a modelling choice",
  "Doing data science or data engineering work instead of the analysis role",
  "Choosing the most thorough option when the scenario constrains time or access",
  "Choosing a technically correct but not BEST answer",
  "Being led by an irrelevant detail planted in the scenario",
  "Skipping a stakeholder whose decision or data the work depends on",
  "Misreading what an output or measure actually shows",
  "none"
];

/* ---- checks that must hold before anything is written ---- */
const errors = [];
const keys = new Set(techniques.map(t => t.n + " " + t.name));
const words = s => String(s).trim().split(/\s+/).length;

if (questions.length !== EXAM_ITEMS) errors.push(`exam bank is ${questions.length} items, expected ${EXAM_ITEMS}`);

/* The answer key: balanced to within one, no letter twice running, no cycle. */
const spread = [0, 0, 0, 0];
questions.forEach(q => spread[q.answer]++);
if (Math.max(...spread) - Math.min(...spread) > 1) errors.push(`exam answer key is ${spread.join("/")}, which is not balanced`);
for (let i = 1; i < questions.length; i++) {
  if (questions[i].answer === questions[i - 1].answer) errors.push(`items ${i} and ${i + 1} share an answer letter`);
  if (questions[i].ka === questions[i - 1].ka) errors.push(`items ${i} and ${i + 1} share a domain`);
}
const key = questions.map(q => q.answer);
[2, 4].forEach(p => {
  for (let i = 0; i + 2 * p <= key.length; i++) {
    const a = key.slice(i, i + p).join(""), b = key.slice(i + p, i + 2 * p).join("");
    if (a === b) { errors.push(`answer key repeats with period ${p} from item ${i + 1}`); break; }
  }
});

/* Blueprint allocation. */
const perDomain = {};
questions.forEach(q => perDomain[q.ka] = (perDomain[q.ka] || 0) + 1);
Object.keys(DOMAINS).forEach(k => {
  if ((perDomain[k] || 0) !== DOMAINS[k].items) errors.push(`domain ${k} has ${perDomain[k] || 0} items, blueprint allocation is ${DOMAINS[k].items}`);
});
if (Object.values(DOMAINS).reduce((s, d) => s + d.items, 0) !== EXAM_ITEMS) errors.push("blueprint allocation does not sum to the exam length");

/* Exhibits appear on questions and inside technique explainers, so check them in one place. */
const EXHIBIT_TYPES = ["table", "dashboard", "tree", "matrix", "flow", "canvas",
  "swimlane", "usecase", "state", "sequence", "dfd"];
const DFD_KINDS = ["external", "process", "store"];
function checkExhibit(x, where) {
  if (!EXHIBIT_TYPES.includes(x.type)) { errors.push(`${where}: exhibit type "${x.type}" (expected ${EXHIBIT_TYPES.join(", ")})`); return; }
  if (x.type === "tree") {
    if (!x.nodes || !x.nodes.length) { errors.push(`${where}: tree has no nodes`); return; }
    let deepest = 0;
    (function walk(ns, d) {
      deepest = Math.max(deepest, d);
      ns.forEach(n => {
        if (!n.label) errors.push(`${where}: tree node at depth ${d} has no label`);
        if (n.children) walk(n.children, d + 1);
      });
    })(x.nodes, 1);
    if (x.levels && x.levels.length !== deepest) errors.push(`${where}: tree names ${x.levels.length} levels but is ${deepest} deep`);
  }
  if (x.type === "matrix") {
    if (!x.cols || !x.rows || !x.cells) { errors.push(`${where}: matrix missing cols, rows or cells`); return; }
    if (x.cells.length !== x.rows.length) errors.push(`${where}: matrix has ${x.cells.length} cell rows for ${x.rows.length} row labels`);
    x.cells.forEach((r, i) => { if (r.length !== x.cols.length) errors.push(`${where}: matrix row ${i + 1} has ${r.length} cells for ${x.cols.length} columns`); });
  }
  if (x.type === "flow") {
    if (!x.steps || !x.steps.length) { errors.push(`${where}: flow has no steps`); return; }
    x.steps.forEach((s, i) => { if (!s.label) errors.push(`${where}: flow step ${i + 1} has no label`); });
    (x.branches || []).forEach((b, i) => {
      if (!b.from || !b.label) errors.push(`${where}: branch ${i + 1} missing from or label`);
      else if (!x.steps.some(s => s.label === b.from)) errors.push(`${where}: branch ${i + 1} points at "${b.from}", which is not a step`);
    });
  }
  if (x.type === "canvas") {
    if (!x.panels || !x.panels.length) { errors.push(`${where}: canvas has no panels`); return; }
    x.panels.forEach((p, i) => { if (!p.label) errors.push(`${where}: canvas panel ${i + 1} has no label`); });
    if (x.layout === "bmc" && x.panels.length !== 9)
      errors.push(`${where}: bmc layout needs exactly 9 panels, has ${x.panels.length}`);
  }
  // Diagram types: every index must point at something that exists, or the SVG
  // silently draws an arrow to NaN.
  const idx = (v, arr, what) => {
    if (typeof v !== "number" || v < 0 || v >= arr.length) errors.push(`${where}: ${what} index ${v} is out of range (0..${arr.length - 1})`);
  };
  if (x.type === "swimlane") {
    if (!x.lanes || !x.lanes.length) { errors.push(`${where}: swimlane has no lanes`); return; }
    if (!x.steps || !x.steps.length) { errors.push(`${where}: swimlane has no steps`); return; }
    x.steps.forEach((s, i) => {
      if (typeof s.lane !== "number" || s.lane < 0 || s.lane >= x.lanes.length) errors.push(`${where}: step ${i + 1} sits in lane ${s.lane}, which does not exist`);
      if (s.label === undefined) errors.push(`${where}: step ${i + 1} has no label`);
    });
    (x.flows || []).forEach(f => { idx(f.from, x.steps, "flow from"); idx(f.to, x.steps, "flow to"); });
  }
  if (x.type === "usecase") {
    if (!x.actors || !x.actors.length) { errors.push(`${where}: usecase has no actors`); return; }
    if (!x.cases || !x.cases.length) { errors.push(`${where}: usecase has no cases`); return; }
    (x.links || []).forEach(l => { idx(l.actor, x.actors, "link actor"); idx(l.case, x.cases, "link case"); });
    (x.rels || []).forEach(r => { idx(r.from, x.cases, "rel from"); idx(r.to, x.cases, "rel to"); });
  }
  if (x.type === "state") {
    if (!x.states || !x.states.length) { errors.push(`${where}: state model has no states`); return; }
    (x.transitions || []).forEach(tr => { idx(tr.from, x.states, "transition from"); idx(tr.to, x.states, "transition to"); });
  }
  if (x.type === "sequence") {
    if (!x.participants || x.participants.length < 2) { errors.push(`${where}: sequence needs at least two participants`); return; }
    (x.messages || []).forEach(m => {
      idx(m.from, x.participants, "message from"); idx(m.to, x.participants, "message to");
      if (m.from === m.to) errors.push(`${where}: a message goes from a participant to itself`);
    });
  }
  if (x.type === "dfd") {
    if (!x.nodes || !x.nodes.length) { errors.push(`${where}: dfd has no nodes`); return; }
    x.nodes.forEach((n, i) => { if (!DFD_KINDS.includes(n.kind)) errors.push(`${where}: node ${i + 1} kind "${n.kind}" (expected ${DFD_KINDS.join(", ")})`); });
    (x.flows || []).forEach(f => { idx(f.from, x.nodes, "flow from"); idx(f.to, x.nodes, "flow to"); });
  }
  if (x.type === "table") {
    if (!x.cols || !x.rows) { errors.push(`${where}: table exhibit missing cols or rows`); return; }
    x.rows.forEach((r, i) => {
      if (r.length !== x.cols.length) errors.push(`${where}: table row ${i + 1} has ${r.length} cells, header has ${x.cols.length}`);
    });
    if (x.align && x.align.length !== x.cols.length) errors.push(`${where}: align has ${x.align.length} entries, header has ${x.cols.length}`);
  }
  if (x.type === "dashboard") {
    if (!x.tiles && !x.bars) { errors.push(`${where}: dashboard exhibit is empty`); return; }
    (x.tiles || []).forEach((t, i) => {
      if (!t.label || t.value === undefined) errors.push(`${where}: tile ${i + 1} missing label or value`);
      if (t.dir && !["up", "down", "flat"].includes(t.dir)) errors.push(`${where}: tile ${i + 1} has dir "${t.dir}" (expected up, down or flat)`);
    });
    (x.bars || []).forEach((b, i) => {
      if (!b.label) errors.push(`${where}: bar ${i + 1} missing label`);
      if (typeof b.value !== "number") errors.push(`${where}: bar ${i + 1} value is not a number`);
      if (b.max !== undefined && typeof b.max !== "number") errors.push(`${where}: bar ${i + 1} max is not a number`);
    });
  }
}

const all = questions.concat(techQuestions);
let longest = 0;
all.forEach((q, i) => {
  const where = `item ${q.n}`;
  const dom = DOMAINS[q.ka];
  if (!dom) { errors.push(`${where}: domain ${q.ka} does not exist`); return; }
  if (q.kaName !== dom.name) errors.push(`${where}: kaName "${q.kaName}" does not match domain ${q.ka}`);
  if (!dom.tasks.includes(q.task)) errors.push(`${where}: task "${q.task}" is not a task of domain ${q.ka}`);
  if (!TRAPS.includes(q.trap)) errors.push(`${where}: trap "${q.trap}" is not in the trap library`);
  if (!q.options || q.options.length !== 4) { errors.push(`${where}: ${q.options ? q.options.length : 0} options`); return; }
  if (!(q.answer >= 0 && q.answer < 4)) { errors.push(`${where}: answer out of range`); return; }
  if (q.options.some(o => !o.text || !o.verdict)) errors.push(`${where}: option missing text or verdict`);
  ["stem", "why"].forEach(f => { if (!q[f]) errors.push(`${where}: missing ${f}`); });
  if (q.stem) {
    const w = words(q.stem);
    if (w < 40 || w > 110) errors.push(`${where}: stem is ${w} words, expected 40 to 110`);
    if (!/\?\s*$/.test(q.stem)) errors.push(`${where}: stem does not end on the question`);
  }
  q.options.forEach(o => {
    if (/\b(always|never|all of the above|none of the above)\b/i.test(o.text || "")) errors.push(`${where}: option uses an absolute ("${o.text.slice(0, 40)}…")`);
  });
  /* Length must not give the answer away, item by item or across the bank. */
  const lens = q.options.map(o => (o.text || "").length);
  const others = lens.filter((_, j) => j !== q.answer);
  if (lens[q.answer] > 1.2 * Math.max(...others)) errors.push(`${where}: the correct option is conspicuously the longest (${lens.join("/")})`);
  if (lens[q.answer] > Math.max(...others)) longest++;
  (q.techniques || []).forEach(k => { if (!keys.has(k)) errors.push(`${where}: unknown technique "${k}"`); });
  if (q.exhibit) checkExhibit(q.exhibit, where);
});
if (longest > Math.ceil(all.length * 0.35))
  errors.push(`the correct option is the longest in ${longest} of ${all.length} items — length is giving the answer away`);
questions.forEach((q, i) => { if (q.n !== i + 1) errors.push(`item at position ${i + 1} is numbered ${q.n}`); });

/* ---- optional banks ---- */
const domainKeys = new Set(Object.keys(DOMAINS).map(Number));
(plan.weeks || []).forEach((w, i) => {
  const where = `plan week ${w.week}`;
  if (w.week !== i + 1) errors.push(`${where}: out of sequence (position ${i + 1})`);
  ["title", "chapter", "focus", "watch"].forEach(f => { if (!w[f]) errors.push(`${where}: missing ${f}`); });
  (w.kas || []).forEach(k => { if (!domainKeys.has(k)) errors.push(`${where}: unknown domain ${k}`); });
  (w.techniques || []).forEach(k => { if (!keys.has(k)) errors.push(`${where}: unknown technique "${k}"`); });
});
(scenario.steps || []).forEach((st, i) => {
  const where = `scenario step ${st.seq}`;
  if (st.seq !== i + 1) errors.push(`${where}: out of sequence (position ${i + 1})`);
  if (!keys.has(st.technique)) errors.push(`${where}: unknown technique "${st.technique}"`);
  ["question", "takes", "gives"].forEach(f => { if (!st[f]) errors.push(`${where}: missing ${f}`); });
  if (!st.artefact) errors.push(`${where}: no artefact`); else checkExhibit(st.artefact, where);
});
techniques.forEach(t => {
  const where = `technique ${t.n}`;
  ["name", "group", "purpose", "use", "confused"].forEach(f => { if (!t[f]) errors.push(`${where}: missing ${f}`); });
  if (!Array.isArray(t.tasks) || !Array.isArray(t.kas)) errors.push(`${where}: tasks and kas must be lists`);
  if (t.visual) checkExhibit(t.visual, `${where} visual`);
  if (t.template) checkExhibit(t.template, `${where} template`);
});
techQuestions.forEach(q => {
  if (!q.techniques || !q.techniques.length) errors.push(`technique item ${q.n}: no techniques tagged`);
});
if (techniques.length) {
  const primary = new Set(techQuestions.map(q => q.techniques && q.techniques[0]));
  const orphan = [...keys].filter(k => !primary.has(k));
  if (orphan.length) errors.push(`${orphan.length} technique(s) have no item of their own: ${orphan.join(", ")}`);
}

if (errors.length) {
  console.error("build failed:\n" + errors.map(e => "  - " + e).join("\n"));
  process.exit(1);
}

/* ---- write ---- */
const block = [
  OPEN,
  "const QUESTIONS = " + JSON.stringify(questions, null, 1) + ";",
  "",
  "const TECHNIQUES = " + JSON.stringify(techniques, null, 1) + ";",
  "",
  "const TECHNIQUE_QUESTIONS = " + JSON.stringify(techQuestions, null, 1) + ";",
  "",
  "const SCENARIO = " + JSON.stringify(scenario, null, 1) + ";",
  "",
  "const CONCEPT_QUESTIONS = [];",
  "",
  "const STUDY_PLAN = " + JSON.stringify(plan, null, 1) + ";",
  CLOSE
].join("\n");

let html = fs.readFileSync(HTML, "utf8");
const start = html.indexOf(OPEN);
const end = html.indexOf(CLOSE, start);
if (start === -1 || end === -1) { console.error("build failed: cannot find the generated-data sentinels in index.html"); process.exit(1); }
html = html.slice(0, start) + block + html.slice(end + CLOSE.length);
fs.writeFileSync(HTML, html);

const exhibits = all.filter(q => q.exhibit).length;
console.log("index.html written");
console.log(`  exam bank        ${questions.length} items, key ${spread.join("/")}, ${exhibits} with data exhibits`);
console.log(`  by domain        ${Object.keys(DOMAINS).map(k => perDomain[k]).join("/")}`);
console.log(`  correct longest  ${longest} of ${all.length} items`);
console.log(`  technique bank   ${techQuestions.length} items, ${techniques.length} techniques`);
console.log(`  study plan       ${(plan.weeks || []).length} weeks`);
console.log(`  scenario         ${(scenario.steps || []).length} steps`);
