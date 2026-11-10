#!/usr/bin/env node
/**
 * docs.mjs — the gate for Lawyard's living docs.
 *
 * docs/data/{features,changeset,defects,questions,changelog,timeline}.json are
 * the source of truth. docs/FEATURE-STATUS.md, docs/TOBI-12SEP-CHANGES.md,
 * CHANGELOG.md and TIMELINE.md are BUILD ARTIFACTS, rendered from that JSON.
 * Never edit them by hand: `render --check` fails if the markdown and the data
 * disagree, so the page a human (or Tobi) reads can never silently drift from
 * the data that holds the truth.
 *
 * Shape is declared, not remembered: docs/data/schema/<registry>.schema.json
 * holds the JSON Schema for each file, and every data file points at its schema
 * via `$schema`, so an editor autocompletes the fields and flags typos, wrong
 * enums and over-length strings as you type. This script runs the same schemas
 * through ajv and then adds what a schema cannot see — duplicate ids,
 * cross-file references, and evidence paths checked against the filesystem.
 *
 * Evidence pointers in the CURRENT-state registries (features/changeset/defects)
 * are checked against the real filesystem — a dead row fails the gate. The
 * historical logs (changelog/timeline) record what happened, so deleted paths
 * are expected there; they are checked for shape and cross-references instead,
 * and every row carries a machine-readable date so it can be graphed.
 *
 * `graph` emits docs/data/graph.json (nodes + edges across sessions, changes,
 * features, defects, changeset items and questions) and a self-contained
 * docs/graph.html viewer. Same data, three projections: JSON → markdown → graph.
 *
 * Commands:
 *   node scripts/docs.mjs render          regenerate the four markdown files
 *   node scripts/docs.mjs render --check  validate, then fail if md ≠ fresh render
 *   node scripts/docs.mjs graph           regenerate graph.json + graph.html
 *   node scripts/docs.mjs graph --check   fail if the graph artifacts are stale
 *   node scripts/docs.mjs ask             print unanswered questions
 *   node scripts/docs.mjs stats           counts by status
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

// DOCS_ROOT lets the test suite point the gate at a fixture tree instead of the
// real repo, so a failing registry can be exercised without touching real data.
const ROOT = path.resolve(
  process.env.DOCS_ROOT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
);
const DATA = path.join(ROOT, "docs", "data");
const OUT = {
  features: path.join(ROOT, "docs", "FEATURE-STATUS.md"),
  changeset: path.join(ROOT, "docs", "TOBI-12SEP-CHANGES.md"),
  changelog: path.join(ROOT, "CHANGELOG.md"),
  timeline: path.join(ROOT, "TIMELINE.md"),
};
const GRAPH = {
  json: path.join(DATA, "graph.json"),
  html: path.join(ROOT, "docs", "graph.html"),
};

const load = (name) => JSON.parse(fs.readFileSync(path.join(DATA, `${name}.json`), "utf8"));

let failures = 0;
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  failures++;
};
const warn = (msg) => console.warn(`! ${msg}`);
const ok = (msg) => console.log(`✓ ${msg}`);

const STATUS_ICON = {
  shipped: "✅",
  partial: "🟡",
  scaffolded: "🟦",
  not_started: "🔴",
  specd: "💬",
  remove: "🗑",
  verify: "❓",
  parked: "⏸",
};
const STATUSES = Object.keys(STATUS_ICON);
const CHANGE_TYPE_ORDER = ["added", "changed", "fixed", "docs", "removed"];


/* ── validation ─────────────────────────────────────────────────────────── */
//
// Shape, enums and length caps live in docs/data/schema/*.schema.json. That is
// the source of truth: it is what gives an editor autocomplete and red
// squiggles while the data is being written, and this script just runs it.
// Checks that need other files or the filesystem stay in code: duplicate ids,
// cross-references, evidence paths, and the few semantic rules a schema cannot
// express ("answered" needs an answer, a session must record something).

const ajv = new Ajv({ allErrors: true, strict: false });

function validateRegistry(name, data) {
  const schemaPath = path.join(DATA, "schema", `${name}.schema.json`);
  const validate = ajv.compile(JSON.parse(fs.readFileSync(schemaPath, "utf8")));
  if (validate(data)) return;
  for (const err of validate.errors ?? []) {
    const at = err.instancePath || "(root)";
    const params = err.params && Object.keys(err.params).length ? ` ${JSON.stringify(err.params)}` : "";
    fail(`${name}${at}: ${err.message}${params}`);
  }
}

function pathExists(pointer) {
  const clean = pointer
    .replace(/:\d+(-\d+)?$/, "")
    .replace(/\/$/, "");
  if (clean.includes("*")) {
    return fs.existsSync(path.join(ROOT, clean.slice(0, clean.indexOf("*"))));
  }
  return fs.existsSync(path.join(ROOT, clean));
}

function checkEvidence(row, label) {
  if (!Array.isArray(row.evidence) || row.evidence.length === 0) {
    // A not-started feature has no code to point at — the absence IS the record.
    if (row.status === "not_started") return;
    fail(`${label} ${row.id}: needs at least one evidence pointer`);
    return;
  }
  for (const pointer of row.evidence) {
    if (!pathExists(pointer)) fail(`${label} ${row.id}: evidence path does not exist → ${pointer}`);
  }
}

function checkRefs(ids, refs, label) {
  for (const ref of refs ?? []) {
    if (!ids.has(ref)) fail(`${label}: references unknown ${ref}`);
  }
}

function uniqueIds(rows, label) {
  const ids = new Set();
  for (const row of rows) {
    if (ids.has(row.id)) fail(`${label}: duplicate id ${row.id}`);
    ids.add(row.id);
  }
  return ids;
}

const features = load("features");
const changeset = load("changeset");
const defects = load("defects");
const questions = load("questions");
const changelog = load("changelog");
const timeline = load("timeline");

for (const [name, data] of Object.entries({ features, changeset, defects, questions, changelog, timeline })) {
  validateRegistry(name, data);
}

const featureIds = uniqueIds(features.features, "features");
const changeIds = uniqueIds(changeset.items, "changeset");
const defectIds = uniqueIds(defects.defects, "defects");
const questionIds = uniqueIds(questions.questions, "questions");

for (const f of features.features) {
  checkEvidence(f, "features");
  checkRefs(changeIds, f.changes, `features ${f.id} changes`);
  checkRefs(defectIds, f.defects, `features ${f.id} defects`);
}

for (const c of changeset.items) {
  checkRefs(featureIds, c.features, `changeset ${c.id} features`);
  checkRefs(defectIds, c.defects, `changeset ${c.id} defects`);
  checkRefs(questionIds, c.questions, `changeset ${c.id} questions`);
}

for (const d of defects.defects) {
  checkEvidence(d, "defects");
  checkRefs(changeIds, d.changes, `defects ${d.id} changes`);
  checkRefs(featureIds, d.features, `defects ${d.id} features`);
}

for (const q of questions.questions) {
  if (q.status === "answered" && !q.answer) fail(`questions ${q.id}: answered without an answer`);
  checkRefs(changeIds, q.from, `questions ${q.id} from`);
}

for (const row of features.launch_checklist) {
  checkRefs(defectIds, row.defects, `launch_checklist "${row.item}"`);
}

for (const c of changelog.changelog) {
  checkRefs(changeIds, c.changeset, `changelog ${c.id} changeset`);
  checkRefs(defectIds, c.defects, `changelog ${c.id} defects`);
}

for (const s of timeline.sessions) {
  const hasBody = Boolean(s.focus) || (s.whatChanged ?? []).length > 0 || (s.blockers ?? []).length > 0;
  if (!hasBody) fail(`timeline ${s.id}: session records nothing (no focus, changes or blockers)`);
  checkRefs(changeIds, s.changeset, `timeline ${s.id} changeset`);
  checkRefs(defectIds, s.defects, `timeline ${s.id} defects`);
}

const sessionDates = new Set(timeline.sessions.map((s) => s.date));
for (const c of changelog.changelog) {
  if (!sessionDates.has(c.date)) warn(`changelog ${c.id}: date ${c.date} has no timeline session`);
}

if (failures > 0) {
  console.error(`\n${failures} problem(s) — docs not rendered.`);
  process.exit(1);
}
ok("data valid: schema, ids, cross-references, filesystem pointers");

/* ── render helpers ─────────────────────────────────────────────────────── */

const icon = (status) => STATUS_ICON[status] ?? status;
const code = (s) => `\`${s}\``;
const table = (headers, rows) =>
  [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");

// "**Title**: rest" vs "**Title**, rest" vs "**Title** — rest": the source used
// different separators, and re-adding a colon where there was a comma reads wrong.
const joinHead = (head, rest) => {
  if (!rest) return head;
  if (/^[,.;:]/.test(rest)) return `${head}${rest}`;
  if (/^[—–-]/.test(rest)) return `${head} ${rest}`;
  return `${head}: ${rest}`;
};

const evidenceText = (row) => (row.evidence ?? []).map(code).join(" · ");
const withNote = (row, extra) =>
  [evidenceText(row), row.note ? `— ${row.note}` : "", extra ?? ""].filter(Boolean).join(" ");

const byId = (rows) => new Map(rows.map((r) => [r.id, r]));
const featureById = byId(features.features);
const questionById = byId(questions.questions);

const refText = (ids, map, fallback = "") =>
  ids?.length ? ids.map((id) => map.get(id)?.title ? `${id} (${map.get(id).title})` : id).join(" · ") : fallback;

/* ── FEATURE-STATUS.md ──────────────────────────────────────────────────── */

function renderFeatures() {
  const shipped = features.features.filter((f) => f.status === "shipped");
  const partial = features.features.filter((f) => f.status === "partial");
  const scaffolded = features.features.filter((f) => f.status === "scaffolded");
  const notStarted = features.features.filter((f) => f.status === "not_started");

  const openChanges = changeset.items.filter((c) => c.status !== "shipped");
  const openQuestions = questions.questions.filter((q) => q.status === "open");
  const openDefects = defects.defects.filter((d) => d.status === "open");

  const parts = [];
  parts.push(`# Lawyard v2 — Feature Status Board

> **GENERATED FILE — do not edit by hand.** Source of truth: \`docs/data/features.json\`, \`docs/data/defects.json\`,
> \`docs/data/changeset.json\`, \`docs/data/questions.json\`.
> Regenerate: \`pnpm run docs:render\` · Gate: \`pnpm run docs:check\`.
>
> Reconciled from README §Status, \`CHANGELOG.md\`, \`docs/features.md\`, \`HANDOFF.md\` §6 (12 Sep decisions).
> **Re-verified against the codebase: ${features.verified}** — after the 12 Sep changeset shipped (\`164510d\`).
> Replaces the README status table and \`docs/features.md\` as the source of truth for "is it built?".

## Legend

${table(
  ["Mark", "Meaning"],
  [
    ["✅", "Shipped — verified present + wired in code"],
    ["🟡", "Partial — exists but incomplete (URL-only, hardcoded, missing piece)"],
    ["🟦", "Scaffolded — route/dir exists but empty (stub)"],
    ["🔴", "Not started"],
    ["💬", "Spec'd only — agreed in the 12 Sep call, not built"],
    ["🗑", "Built but marked for removal (12 Sep decision)"],
    ["❓", "Needs verification / confirm with Tobi"],
    ["⏸", "Parked — decided not to build"],
  ],
)}
`);

  parts.push(`## 1. Shipped ✅

${table(
  ["Feature", "Evidence / notes"],
  shipped.map((f) => [f.name, withNote(f)]),
)}
`);

  parts.push(`## 2. Partial 🟡

${table(
  ["Feature", "Gap"],
  partial.map((f) => [
    f.name,
    [f.gap, f.defects?.length ? `See ${f.defects.join(", ")}.` : ""].filter(Boolean).join(" "),
  ]),
)}
`);

  parts.push(`## 3. Scaffolded but empty 🟦

Route directories exist but contain **no \`page.tsx\`**. Confirmed ${features.verified} that no nav link points at them.

${table(
  ["Feature", "Path", "Note"],
  scaffolded.map((f) => [f.name, evidenceText(f), f.gap ?? ""]),
)}
`);

  parts.push(`## 4. Not started 🔴

${table(
  ["Feature", "Tier", "Notes"],
  notStarted.map((f) => [f.name, f.tier ?? "—", f.gap ?? ""]),
)}
`);

  parts.push(`## 5. 12 Sep call — what's still open

Agreed with Tobi on ${changeset.call_date}. Full context: \`HANDOFF.md\` §6. Item-by-item walkthrough: [\`docs/TOBI-12SEP-CHANGES.md\`](TOBI-12SEP-CHANGES.md).

**Built and verified:** ${changeset.items.filter((c) => c.status === "shipped").length} of ${changeset.items.length} changeset items fully shipped · ${changeset.items.filter((c) => c.status === "partial").length} partial — tier ladder, featured ranking, post caps + paid extras, insights surfacing, premium intro video, Lens courses, chamber parity, private pricing, service requests + paid bookings, no Calendly (UI), chamber admin + PR publishing, dashboard cleanup, NGN formatting, law-firm labels.

${table(
  ["#", "Item", "Status", "What's blocking it"],
  openChanges.map((c) => [
    c.id,
    c.title,
    icon(c.status),
    c.questions?.length
      ? c.questions.map((q) => `${q} — ${questionById.get(q).question}`).join("<br>")
      : c.decision,
  ]),
)}
`);

  parts.push(`## 6. Known defects (${openDefects.length} open)

Found by the ${defects.verified} code verification. Security findings are **not** duplicated here — see [\`docs/AUDIT-2026-10-20.md\`](AUDIT-2026-10-20.md).

${table(
  ["#", "Defect", "Severity", "Impact", "Evidence"],
  defects.defects.map((d) => [d.id, d.title, d.severity, d.impact, evidenceText(d)]),
)}

**Fix notes**

${defects.defects.map((d) => `- **${d.id}** — ${d.fix}`).join("\n")}
`);

  parts.push(`## 7. Must-do before public launch

${table(
  ["Item", "Status"],
  features.launch_checklist.map((row) => [row.item, icon(row.status)]),
)}
`);

  parts.push(`## 8. Open questions (blocking)

${openQuestions.length === 0 ? "_None open._" : openQuestions.map((q) => `- **${q.id}** — ${q.question} *(from ${q.from.join(", ")})*`).join("\n")}

> Accumulating list: [\`docs/TOBI-12SEP-CHANGES.md\`](TOBI-12SEP-CHANGES.md) § *Questions for Tobi*.

---

## Maintenance

- **Never edit this file.** Add or change a row in \`docs/data/*.json\`, then run \`pnpm run docs:render\`.
- **Never trust the docs alone:** re-verify 🟡/🟦 rows against code before flipping a status, and set \`verified\` in \`features.json\`.
- \`pnpm run docs:check\` fails if this file and the JSON disagree, if an id is duplicated, if a cross-reference dangles, or if an evidence path no longer exists.
- Superseded by this system: the \`README.md\` §Status table and \`docs/features.md\`.
`);

  return parts.join("\n");
}

/* ── TOBI-12SEP-CHANGES.md ──────────────────────────────────────────────── */

function renderChangeset() {
  const parts = [];
  const shipped = changeset.items.filter((c) => c.status === "shipped");
  const open = changeset.items.filter((c) => c.status !== "shipped");

  parts.push(`# Tobi's Requested Changes — 12 Sep 2026

> **GENERATED FILE — do not edit by hand.** Source of truth: \`docs/data/changeset.json\`,
> \`docs/data/questions.json\`, \`docs/data/defects.json\`.
> Regenerate: \`pnpm run docs:render\` · Gate: \`pnpm run docs:check\`.
>
> Working checklist. One decision per item, recorded here, then built.
> Created 2026-10-16 from the decoded 12 Sep call transcript.

## Sources (session anchors)

${table(
  ["What", "Path"],
  [
    ["**Transcript** (source of truth for requests)", code(changeset.transcript)],
    ["**Feature status board**", code("docs/FEATURE-STATUS.md")],
    ["**Session handoff**", code("HANDOFF.md")],
    ["**Changelog / timeline**", code("CHANGELOG.md") + " · " + code("TIMELINE.md")],
  ],
)}

## How to use

For each item: read the request → note the current status → record a **Decision** (\`build\` / \`park\` / \`reject\` / \`confirm-with-Tobi\`) → tick \`reviewed\`.
Status marks: ✅ shipped · 🟡 partial · 🟦 scaffolded · 🔴 not started · 💬 spec'd-only · 🗑 remove · ❓ verify · ⏸ parked.

---

## Index

${table(
  ["#", "Change", "Status", "Decision"],
  changeset.items.map((c) => [c.id, c.title, icon(c.status), c.decision_type.toUpperCase()]),
)}

> **Build pass: ${shipped.length} of ${changeset.items.length} shipped.** Still open: ${open.map((c) => `${c.id} (${c.status})`).join(" · ")}.

---

## Items
`);

  for (const c of changeset.items) {
    parts.push(`
## ${c.id} — ${c.title}
- **Requested:** ${c.requested}
- **Transcript:** ${c.transcript}
- **Status:** ${icon(c.status)} ${c.status.replace("_", " ")}${c.build_note ? ` — ${c.build_note}` : ""}
- **Decision:** ${c.decision}${c.reviewed ? " · [x] reviewed" : ""}
${c.alternatives?.length ? `- **Alternatives:** ${c.alternatives.map((a) => `${a.option} — rejected: ${a.why_rejected}`).join(" · ")}` : ""}
${c.features?.length ? `- **Features:** ${refText(c.features, featureById)}` : ""}
${c.questions?.length ? `- **Questions:** ${c.questions.join(", ")}` : ""}
${c.defects?.length ? `- **Defects:** ${c.defects.join(", ")}` : ""}`);
  }

  parts.push(`
---

## Build outcome (2026-10-16 → 2026-10-18)

${table(
  ["#", "What shipped"],
  shipped.filter((c) => c.build_note).map((c) => [c.id, c.build_note]),
)}

**Not built (deliberate):** ${open.map((c) => `${c.id} — ${c.decision_type === "confirm" ? "needs Tobi" : c.decision_type}`).join(" · ")}.

### Post-build verification — ${defects.verified}

Re-verified every shipped item against the code after the changeset deployed (\`164510d\`). The gaps that survived are recorded as defects rather than remembered:

${table(
  ["Defect", "Change", "Gap"],
  defects.defects
    .filter((d) => d.status === "open")
    .map((d) => [
      d.id,
      (d.changes ?? []).join(", ") || "—",
      d.title,
    ]),
)}

Full detail, severity and fix notes: [\`docs/FEATURE-STATUS.md\`](FEATURE-STATUS.md) §6.

---

## Questions for Tobi

${table(
  ["#", "Question", "From", "Status"],
  questions.questions.map((q) => [
    q.id,
    q.question,
    q.from.join(", ") || "pre-existing",
    q.status === "answered" ? `✅ ${q.answer}` : q.status === "parked" ? "⏸ parked" : "⚠ open",
  ]),
)}

---

## Out of scope (mentioned, not a Tobi request)
${changeset.out_of_scope.map((line) => `- ${line}`).join("\n")}
`);

  return parts.join("\n");
}

/* ── CHANGELOG.md ───────────────────────────────────────────────────────── */

function renderChangelog() {
  const rows = [...changelog.changelog].sort(
    (a, b) => b.date.localeCompare(a.date) || CHANGE_TYPE_ORDER.indexOf(a.type) - CHANGE_TYPE_ORDER.indexOf(b.type),
  );
  const byDate = new Map();
  for (const row of rows) {
    if (!byDate.has(row.date)) byDate.set(row.date, []);
    byDate.get(row.date).push(row);
  }

  const parts = [];
  parts.push(`# Changelog

> **GENERATED FILE — do not edit by hand.** Source of truth: \`docs/data/changelog.json\`.
> Regenerate: \`pnpm run docs:render\` · Gate: \`pnpm run docs:check\` · Graph: \`pnpm run docs:graph\`.
>
> One row per change. \`date\` and \`type\` are fields, not headings, so the same rows render here
> and appear as nodes in \`docs/data/graph.json\` — nothing is retyped into a second place.
> **Newest first.** Add an entry to the JSON; it lands under the right date by itself.
`);

  for (const [date, entries] of byDate) {
    parts.push(`\n## ${date}\n`);
    for (const type of CHANGE_TYPE_ORDER) {
      const group = entries.filter((e) => e.type === type);
      if (group.length === 0) continue;
      parts.push(`### ${type[0].toUpperCase() + type.slice(1)}\n`);
      for (const e of group) {
        parts.push(`- ${joinHead(`**${e.title}**`, e.detail)}`);
      }
      parts.push("");
    }
  }

  parts.push(`---

## Maintenance

- **Never edit this file.** Add a row to \`docs/data/changelog.json\` (\`id\` = next \`CH-###\`, \`date\`, \`type\`, \`title\`, \`detail\`, optional \`evidence\`/\`commits\`/\`changeset\`/\`defects\`), then run \`pnpm run docs:render\`.
- The whole history is available as data: filter by \`type\`, group by \`date\`, or load it into a graph with \`pnpm run docs:graph\`.
- Dates are ISO (\`YYYY-MM-DD\`). A row whose date has no matching timeline session is flagged by the renderer.
`);
  return parts.join("\n").replace(/\n{3,}/g, "\n\n");
}

/* ── TIMELINE.md ────────────────────────────────────────────────────────── */

function renderTimeline() {
  const parts = [];
  parts.push(`# Timeline

> **GENERATED FILE — do not edit by hand.** Source of truth: \`docs/data/timeline.json\`.
> Regenerate: \`pnpm run docs:render\` · Gate: \`pnpm run docs:check\` · Graph: \`pnpm run docs:graph\`.
>
> One row per session: what was asked, what changed, why, and what is still blocked.
> Changeset items, defects and commit SHAs found in the text are extracted into fields, so the
> same session becomes a node with edges to the work it delivered. Oldest first — read it as history.
`);

  for (const session of timeline.sessions) {
    const heading = `${session.date}${session.label ? (session.labelStyle === "paren" ? ` (${session.label})` : ` — ${session.label}`) : ""}`;
    parts.push(`\n## ${heading}\n`);

    if (session.focus) parts.push(`### Focus\n${session.focus}\n`);

    if (session.whatChanged?.length) {
      const lines = session.whatChanged.map((item) => {
        const head = item.title ? `- ${joinHead(`**${item.title}**`, item.detail)}` : `- ${item.detail}`;
        return [head, ...(item.sub ?? []).map((s) => `  - ${s}`)].join("\n");
      });
      parts.push(`### What Changed\n${lines.join("\n")}\n`);
    }

    if (session.blockers?.length) {
      const lead = session.blockersNote ? `${session.blockersNote}\n\n` : "";
      parts.push(`### Blockers\n${lead}${session.blockers.map((b, i) => `${i + 1}. ${b}`).join("\n")}\n`);
    }
    if (session.nextSteps?.length) {
      parts.push(`### Next Steps\n${session.nextSteps.map((b, i) => `${i + 1}. ${b}`).join("\n")}\n`);
    }
    if (session.verification?.length) {
      parts.push(`### Verification\n${session.verification.map((v) => `- ${v}`).join("\n")}\n`);
    }
    if (session.rationale?.length) {
      const body =
        session.rationale.length === 1 ? session.rationale[0] : session.rationale.map((p) => `- ${p}`).join("\n");
      parts.push(`### Rationale\n${body}\n`);
    }
    if (session.files?.length) {
      parts.push(`### Related Files\n${session.files.map((f) => `- ${f}`).join("\n")}\n`);
    }

    const links = [
      session.changeset?.length ? `changeset ${session.changeset.join(" ")}` : "",
      session.defects?.length ? `defects ${session.defects.join(" ")}` : "",
      session.commits?.length ? `commits ${session.commits.join(" ")}` : "",
    ].filter(Boolean);
    if (links.length) parts.push(`> ${links.join(" · ")}\n`);

    if (session !== timeline.sessions[timeline.sessions.length - 1]) parts.push("---\n");
  }

  parts.push(`---

## Maintenance

- **Never edit this file.** Add or change a session in \`docs/data/timeline.json\`, then run \`pnpm run docs:render\`.
- \`S-YYYY-MM-DD-NN\` ids are stable references; the graph links a session to the changelog entries dated the same day.
- \`changeset\` / \`defects\` / \`commits\` are the edges the graph is built from — keep them as arrays of ids.
`);
  return parts.join("\n").replace(/\n{3,}/g, "\n\n");
}

/* ── graph ──────────────────────────────────────────────────────────────── */

const GRAPH_NODE_TYPES = {
  session: { label: "Session", color: "#8b5cf6" },
  change: { label: "Change", color: "#22c55e" },
  changeset: { label: "Changeset item", color: "#f59e0b" },
  feature: { label: "Feature", color: "#3b82f6" },
  defect: { label: "Defect", color: "#ef4444" },
  question: { label: "Question", color: "#14b8a6" },
};

function buildGraph() {
  const nodes = [];
  const edges = [];
  const seen = new Set();

  const addNode = (node) => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    nodes.push(node);
  };
  const addEdge = (from, to, kind) => {
    if (!seen.has(from) || !seen.has(to)) return;
    edges.push({ from, to, kind });
  };

  for (const s of timeline.sessions) {
    addNode({
      id: s.id,
      type: "session",
      label: s.focus ? (s.focus.length > 90 ? `${s.focus.slice(0, 87)}…` : s.focus) : s.label ?? s.id,
      date: s.date,
      detail: s.label ?? undefined,
    });
  }
  for (const c of changelog.changelog) {
    addNode({
      id: c.id,
      type: "change",
      label: c.title,
      date: c.date,
      detail: c.type,
      status: c.type,
    });
  }
  for (const f of features.features) addNode({ id: f.id, type: "feature", label: f.name, status: f.status });
  for (const d of defects.defects) addNode({ id: d.id, type: "defect", label: d.title, status: d.status, detail: d.severity });
  for (const c of changeset.items) addNode({ id: c.id, type: "changeset", label: c.title, status: c.status, detail: c.decision_type });
  for (const q of questions.questions) addNode({ id: q.id, type: "question", label: q.question, status: q.status });

  const sessionsByDate = new Map();
  for (const s of timeline.sessions) {
    if (!sessionsByDate.has(s.date)) sessionsByDate.set(s.date, []);
    sessionsByDate.get(s.date).push(s.id);
  }
  for (const c of changelog.changelog) {
    for (const sid of sessionsByDate.get(c.date) ?? []) addEdge(c.id, sid, "logged-in");
    for (const ref of c.changeset ?? []) addEdge(c.id, ref, "implements");
    for (const ref of c.defects ?? []) addEdge(c.id, ref, "fixes");
  }
  for (const s of timeline.sessions) {
    for (const ref of s.changeset ?? []) addEdge(s.id, ref, "delivers");
    for (const ref of s.defects ?? []) addEdge(s.id, ref, "found");
  }
  for (const c of changeset.items) {
    for (const ref of c.features ?? []) addEdge(c.id, ref, "delivers");
    for (const ref of c.defects ?? []) addEdge(c.id, ref, "fixes");
    for (const ref of c.questions ?? []) addEdge(c.id, ref, "raises");
  }
  for (const d of defects.defects) {
    for (const ref of d.features ?? []) addEdge(d.id, ref, "affects");
  }
  // Session → feature, but only on an exact file match: the session listed a file
  // that is itself the evidence for that feature. Approximate, so it gets its own
  // edge kind ("touches") instead of being passed off as delivery.
  const backticked = (text) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  for (const s of timeline.sessions) {
    const touched = new Set((s.files ?? []).flatMap(backticked));
    for (const f of features.features) {
      for (const evidence of f.evidence ?? []) {
        if (touched.has(evidence)) {
          addEdge(s.id, f.id, "touches");
          break;
        }
      }
    }
  }

  return {
    schema: 1,
    note: "Generated by scripts/docs.mjs graph. Projection of docs/data/*.json — do not edit.",
    generated_from: ["docs/data/timeline.json", "docs/data/changelog.json", "docs/data/features.json", "docs/data/defects.json", "docs/data/changeset.json", "docs/data/questions.json"],
    node_types: Object.fromEntries(Object.entries(GRAPH_NODE_TYPES).map(([k, v]) => [k, v.label])),
    nodes,
    edges,
  };
}

function renderGraphHtml(graph) {
  const data = JSON.stringify(graph);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lawyard — work graph</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0b1020; color: #e8ecf8; font: 13px/1.45 ui-sans-serif, system-ui, -apple-system, sans-serif; overflow: hidden; }
  header { position: fixed; inset: 0 0 auto 0; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 10px 14px; background: rgba(11,16,32,.85); border-bottom: 1px solid #1f2a44; backdrop-filter: blur(6px); z-index: 2; }
  h1 { font-size: 13px; font-weight: 600; margin: 0 8px 0 0; letter-spacing: .02em; }
  .legend { display: flex; gap: 10px; flex-wrap: wrap; }
  .legend label { display: inline-flex; gap: 5px; align-items: center; cursor: pointer; user-select: none; font-size: 12px; color: #aeb9d4; }
  .legend input { accent-color: #4f6ddb; margin: 0; }
  .swatch { width: 9px; height: 9px; border-radius: 3px; }
  #hint { margin-left: auto; color: #6f7d9d; font-size: 12px; }
  canvas { display: block; cursor: grab; }
  canvas:active { cursor: grabbing; }
  #panel { position: fixed; right: 0; top: 0; bottom: 0; width: min(360px, 92vw); padding: 14px; overflow: auto; background: rgba(12,18,36,.96); border-left: 1px solid #1f2a44; transform: translateX(100%); transition: transform .18s ease; z-index: 3; }
  #panel.open { transform: none; }
  #panel h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #7c8bb0; margin: 0 0 6px; }
  #panel .title { font-size: 15px; font-weight: 600; margin: 0 0 8px; }
  #panel .meta { color: #9aa7c7; font-size: 12px; display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  #panel .meta span { background: #16203a; border: 1px solid #223052; border-radius: 999px; padding: 1px 8px; }
  #panel ul { list-style: none; padding: 0; margin: 0; }
  #panel li { padding: 6px 0; border-top: 1px solid #1a2540; color: #cdd6ec; }
  #panel li b { color: #7c8bb0; font-weight: 500; font-size: 11px; text-transform: uppercase; display: block; }
</style>
</head>
<body>
<header>
  <h1>Lawyard — work graph</h1>
  <div class="legend" id="legend"></div>
  <span id="hint">click a node · drag to move · scroll to zoom</span>
</header>
<canvas id="c"></canvas>
<aside id="panel"><h2 id="panel-type"></h2><p class="title" id="panel-title"></p><div class="meta" id="panel-meta"></div><ul id="panel-links"></ul></aside>
<script>
const graph = ${data};
const typeInfo = ${JSON.stringify(GRAPH_NODE_TYPES)};
const canvas = document.getElementById("c"), ctx = canvas.getContext("2d"), panel = document.getElementById("panel");
const legend = document.getElementById("legend"), hint = document.getElementById("hint");
const active = new Set(graph.nodes.map(n => n.type));
const byId = new Map(graph.nodes.map(n => [n.id, n]));
const adj = new Map(graph.nodes.map(n => [n.id, new Set([n.id])]));
for (const e of graph.edges) { adj.get(e.from)?.add(e.to); adj.get(e.to)?.add(e.from); }

for (const [type, info] of Object.entries(typeInfo)) {
  const n = graph.nodes.filter(x => x.type === type).length;
  const el = document.createElement("label");
  el.innerHTML = '<input type="checkbox" checked data-type="' + type + '"><span class="swatch" style="background:' + info.color + '"></span>' + info.label + ' <span style="opacity:.6">' + n + '</span>';
  el.querySelector("input").onchange = (ev) => { ev.target.checked ? active.add(type) : active.delete(type); draw(); };
  legend.appendChild(el);
}

const W = () => innerWidth, H = () => innerHeight;
let dpr = Math.min(devicePixelRatio || 1, 2);
function resize() { canvas.width = W() * dpr; canvas.height = H() * dpr; canvas.style.width = W() + "px"; canvas.style.height = H() + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
resize(); addEventListener("resize", resize);

// deterministic seed layout so the graph is stable between reloads
let seed = 7; const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const nodes = graph.nodes.map(n => ({ ...n, x: (rand() - .5) * Math.min(W(), 1400), y: (rand() - .5) * Math.min(H(), 900), vx: 0, vy: 0, r: 4 }));
const nodeById = new Map(nodes.map(n => [n.id, n]));
const edges = graph.edges.map(e => ({ ...e, a: nodeById.get(e.from), b: nodeById.get(e.to) })).filter(e => e.a && e.b);
for (const n of nodes) n.deg = edges.reduce((d, e) => d + (e.a === n || e.b === n ? 1 : 0), 0);
for (const n of nodes) n.r = 3.5 + Math.min(9, Math.sqrt(n.deg) * 2.1);

let scale = 1, tx = 0, ty = 0, drag = null, moved = false, hover = null, selected = null;

function visible(n) { return active.has(n.type); }

function tick() {
  const vis = nodes.filter(visible);
  const k = 0.012, centerX = W() / 2, centerY = H() / 2;
  for (const n of vis) {
    n.vx += (centerX - (n.x + tx)) * 0.00035;
    n.vy += (centerY - (n.y + ty)) * 0.00035;
  }
  for (let i = 0; i < vis.length; i++) {
    for (let j = i + 1; j < vis.length; j++) {
      const a = vis[i], b = vis[j];
      let dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy || 1;
      if (d2 > 900000) continue;
      const f = Math.min(1400 / d2, 4);
      dx *= f; dy *= f;
      a.vx -= dx; a.vy -= dy; b.vx += dx; b.vy += dy;
    }
  }
  for (const e of edges) {
    if (!visible(e.a) || !visible(e.b)) continue;
    const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y, d = Math.hypot(dx, dy) || 1;
    const f = (d - 120) * k * 0.5 / d;
    e.a.vx += dx * f; e.a.vy += dy * f; e.b.vx -= dx * f; e.b.vy -= dy * f;
  }
  for (const n of vis) {
    n.vx *= 0.86; n.vy *= 0.86;
    n.x += n.vx; n.y += n.vy;
  }
}

function draw() {
  tick();
  ctx.clearRect(0, 0, W(), H());
  ctx.save(); ctx.translate(tx, ty); ctx.scale(scale, scale);
  ctx.lineWidth = 1 / scale;
  for (const e of edges) {
    if (!visible(e.a) || !visible(e.b)) continue;
    const focus = selected && (e.from === selected || e.to === selected);
    const dim = selected && !focus;
    ctx.strokeStyle = focus ? "rgba(120,160,255,.75)" : dim ? "rgba(80,100,150,.06)" : "rgba(90,115,170,.20)";
    ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
  }
  for (const n of nodes) {
    if (!visible(n)) continue;
    const info = typeInfo[n.type];
    const near = selected ? adj.get(selected)?.has(n.id) : true;
    ctx.globalAlpha = near ? 1 : 0.22;
    ctx.fillStyle = info.color;
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    if (n === hover || n.id === selected) {
      ctx.lineWidth = 2 / scale; ctx.strokeStyle = "#fff"; ctx.stroke();
    }
    if (scale > 0.7 && (n.deg > 2 || n.id === selected)) {
      ctx.globalAlpha = near ? 0.9 : 0.15;
      ctx.fillStyle = "#cdd6ec";
      ctx.font = 10 / scale + "px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(n.label.length > 42 ? n.label.slice(0, 40) + "…" : n.label, n.x + n.r + 4, n.y + 3);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

function hit(mx, my) {
  const x = (mx - tx) / scale, y = (my - ty) / scale;
  let best = null;
  for (const n of nodes) {
    if (!visible(n)) continue;
    if ((n.x - x) ** 2 + (n.y - y) ** 2 < (n.r + 6 / scale) ** 2) best = n;
  }
  return best;
}

function describe(n) {
  document.getElementById("panel-type").textContent = typeInfo[n.type].label + (n.status ? " · " + n.status : "");
  document.getElementById("panel-title").textContent = n.label;
  const meta = document.getElementById("panel-meta");
  meta.innerHTML = "";
  for (const [k, v] of Object.entries({ id: n.id, date: n.date, kind: n.detail })) {
    if (!v) continue;
    const s = document.createElement("span"); s.textContent = k + ": " + v; meta.appendChild(s);
  }
  const list = document.getElementById("panel-links"); list.innerHTML = "";
  const links = edges.filter(e => e.from === n.id || e.to === n.id);
  for (const e of links) {
    const other = nodeById.get(e.from === n.id ? e.to : e.from);
    const li = document.createElement("li");
    li.innerHTML = "<b>" + e.kind + "</b>" + other.label;
    list.appendChild(li);
  }
  if (!links.length) list.innerHTML = "<li>No edges yet.</li>";
  panel.classList.add("open");
}

canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, tx, ty }; moved = false; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", (e) => {
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    tx = drag.tx + dx; ty = drag.ty + dy;
  } else {
    hover = hit(e.clientX, e.clientY);
  }
});
canvas.addEventListener("pointerup", (e) => {
  if (drag && !moved) {
    const n = hit(e.clientX, e.clientY);
    if (n) { selected = n.id; describe(n); } else { selected = null; panel.classList.remove("open"); }
  }
  drag = null;
});
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const factor = Math.exp(-e.deltaY * 0.0015);
  const mx = e.clientX, my = e.clientY;
  const wx = (mx - tx) / scale, wy = (my - ty) / scale;
  scale = Math.max(0.15, Math.min(3.5, scale * factor));
  tx = mx - wx * scale; ty = my - wy * scale;
}, { passive: false });
</script>
</body>
</html>
`;
}


/* ── commands ───────────────────────────────────────────────────────────── */

const command = process.argv[2] ?? "render";
const check = process.argv.includes("--check");

if (command === "ask") {
  const open = questions.questions.filter((q) => q.status === "open");
  if (open.length === 0) ok("no open questions");
  for (const q of open) console.log(`${q.id} — ${q.question} (${q.from.join(", ") || "pre-existing"})`);
  process.exit(0);
}

if (command === "stats") {
  const count = (rows) =>
    STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length]).filter(([, n]) => n > 0);
  const tally = (rows) =>
    Object.fromEntries(
      [...new Set(rows.map((r) => r.status))].map((s) => [s, rows.filter((r) => r.status === s).length]),
    );
  console.log("features:", Object.fromEntries(count(features.features)));
  console.log("changeset:", Object.fromEntries(count(changeset.items)));
  console.log("defects:", tally(defects.defects));
  console.log("questions:", tally(questions.questions));
  console.log("changelog:", {
    entries: changelog.changelog.length,
    by_type: tally(changelog.changelog.map((c) => ({ status: c.type }))),
  });
  console.log("timeline:", { sessions: timeline.sessions.length });
  process.exit(0);
}

if (!["render", "graph"].includes(command)) {
  console.error(`unknown command "${command}" — use render | render --check | graph | graph --check | ask | stats`);
  process.exit(1);
}

const artifacts = [];
if (command === "render") {
  artifacts.push([OUT.features, renderFeatures()], [OUT.changeset, renderChangeset()], [OUT.changelog, renderChangelog()], [OUT.timeline, renderTimeline()]);
} else {
  const graph = buildGraph();
  artifacts.push([GRAPH.json, JSON.stringify(graph, null, 2) + "\n"], [GRAPH.html, renderGraphHtml(graph)]);
  ok(`graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
}

let drifted = 0;
for (const [target, content] of artifacts) {
  const rel = path.relative(ROOT, target);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (check) {
    if (current !== content) {
      const firstDiff = current.split("\n").findIndex((line, i) => line !== content.split("\n")[i]);
      fail(`${rel} is out of date with docs/data (first difference at line ${firstDiff + 1}) — run \`pnpm run docs:${command}\``);
      drifted++;
    } else {
      ok(`${rel} matches docs/data`);
    }
  } else {
    fs.writeFileSync(target, content);
    ok(`rendered ${rel}`);
  }
}

if (check && drifted === 0) ok(`${command} artifacts in sync`);
process.exit(failures > 0 ? 1 : 0);
