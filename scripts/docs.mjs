#!/usr/bin/env node
/**
 * docs.mjs — the gate for Lawyard's living docs.
 *
 * docs/data/{features,changeset,defects,questions}.json are the source of truth.
 * docs/FEATURE-STATUS.md and docs/TOBI-12SEP-CHANGES.md are BUILD ARTIFACTS,
 * rendered from that JSON. Never edit them by hand: `render --check` fails if
 * the markdown and the data disagree, so the page a human (or Tobi) reads can
 * never silently drift from the data that holds the truth.
 *
 * Every evidence pointer is checked against the real filesystem. A row whose
 * code doesn't exist is a dead row and the validator says so — fewer claims
 * written, not more. Cross-references are checked both ways (a feature may not
 * cite a change or defect that doesn't exist).
 *
 * Commands:
 *   node scripts/docs.mjs render          regenerate both markdown files
 *   node scripts/docs.mjs render --check  validate, then fail if md ≠ fresh render
 *   node scripts/docs.mjs ask             print unanswered questions
 *   node scripts/docs.mjs stats           counts by status
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "docs", "data");
const OUT = {
  features: path.join(ROOT, "docs", "FEATURE-STATUS.md"),
  changeset: path.join(ROOT, "docs", "TOBI-12SEP-CHANGES.md"),
};

const load = (name) => JSON.parse(fs.readFileSync(path.join(DATA, `${name}.json`), "utf8"));

let failures = 0;
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  failures++;
};
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
const SEVERITIES = ["high", "medium", "low"];
const DECISION_TYPES = ["build", "park", "reject", "confirm", "done"];
const QUESTION_STATUSES = ["open", "answered", "parked"];

const LIMITS = { name: 120, title: 120, note: 400, gap: 400, impact: 240, fix: 240 };

/* ── validation ─────────────────────────────────────────────────────────── */

function pathExists(pointer) {
  const clean = pointer
    .replace(/:\d+(-\d+)?$/, "")
    .replace(/\/$/, "");
  if (clean.includes("*")) {
    return fs.existsSync(path.join(ROOT, clean.slice(0, clean.indexOf("*"))));
  }
  return fs.existsSync(path.join(ROOT, clean));
}

function checkIds(rows, pattern, label) {
  const seen = new Set();
  for (const row of rows) {
    if (!pattern.test(row.id)) fail(`${label}: bad id "${row.id}" (expected ${pattern})`);
    if (seen.has(row.id)) fail(`${label}: duplicate id ${row.id}`);
    seen.add(row.id);
  }
  return seen;
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

function checkLength(row, field, label) {
  const value = row[field];
  if (value && value.length > LIMITS[field]) {
    fail(`${label} ${row.id}: ${field} is ${value.length} chars (max ${LIMITS[field]})`);
  }
}

function checkRefs(ids, refs, label) {
  for (const ref of refs ?? []) {
    if (!ids.has(ref)) fail(`${label} ${ids.name}: references unknown ${ref}`);
  }
}

const features = load("features");
const changeset = load("changeset");
const defects = load("defects");
const questions = load("questions");

const featureIds = checkIds(features.features, /^F-\d{2}$/, "features");
const changeIds = checkIds(changeset.items, /^C\d{2}$/, "changeset");
const defectIds = checkIds(defects.defects, /^D\d$/, "defects");
const questionIds = checkIds(questions.questions, /^Q\d+$/, "questions");

for (const f of features.features) {
  if (!STATUSES.includes(f.status)) fail(`features ${f.id}: unknown status "${f.status}"`);
  checkLength(f, "name", "features");
  checkLength(f, "note", "features");
  checkLength(f, "gap", "features");
  checkEvidence(f, "features");
  checkRefs(changeIds, f.changes, `features ${f.id} changes`);
  checkRefs(defectIds, f.defects, `features ${f.id} defects`);
}

for (const c of changeset.items) {
  if (!STATUSES.includes(c.status)) fail(`changeset ${c.id}: unknown status "${c.status}"`);
  if (!DECISION_TYPES.includes(c.decision_type)) {
    fail(`changeset ${c.id}: unknown decision_type "${c.decision_type}"`);
  }
  for (const field of ["title", "requested", "decision"]) {
    if (!c[field]) fail(`changeset ${c.id}: missing ${field}`);
  }
  checkLength(c, "title", "changeset");
  for (const alt of c.alternatives ?? []) {
    if (!alt.option || !alt.why_rejected) {
      fail(`changeset ${c.id}: every alternative needs option + why_rejected`);
      continue;
    }
    if (alt.option.length > 80) fail(`changeset ${c.id}: alternative option too long`);
    if (alt.why_rejected.length > 200) fail(`changeset ${c.id}: alternative why_rejected too long`);
  }
  checkRefs(featureIds, c.features, `changeset ${c.id} features`);
  checkRefs(defectIds, c.defects, `changeset ${c.id} defects`);
  checkRefs(questionIds, c.questions, `changeset ${c.id} questions`);
}

for (const d of defects.defects) {
  if (!SEVERITIES.includes(d.severity)) fail(`defects ${d.id}: unknown severity "${d.severity}"`);
  if (!["open", "fixed", "wontfix"].includes(d.status)) {
    fail(`defects ${d.id}: unknown status "${d.status}"`);
  }
  for (const field of ["title", "impact", "fix"]) {
    if (!d[field]) fail(`defects ${d.id}: missing ${field}`);
  }
  checkLength(d, "title", "defects");
  checkLength(d, "impact", "defects");
  checkLength(d, "fix", "defects");
  checkEvidence(d, "defects");
  checkRefs(changeIds, d.changes, `defects ${d.id} changes`);
  checkRefs(featureIds, d.features, `defects ${d.id} features`);
}

for (const q of questions.questions) {
  if (!QUESTION_STATUSES.includes(q.status)) fail(`questions ${q.id}: unknown status "${q.status}"`);
  if (!q.question) fail(`questions ${q.id}: missing question`);
  if (q.status === "answered" && !q.answer) fail(`questions ${q.id}: answered without an answer`);
  checkRefs(changeIds, q.from, `questions ${q.id} from`);
}

for (const row of features.launch_checklist) {
  if (!STATUSES.includes(row.status)) fail(`launch_checklist "${row.item}": unknown status`);
  checkRefs(defectIds, row.defects, `launch_checklist "${row.item}"`);
}

if (failures > 0) {
  console.error(`\n${failures} problem(s) — docs not rendered.`);
  process.exit(1);
}
ok("data valid: ids, statuses, cross-references, filesystem pointers");

/* ── render helpers ─────────────────────────────────────────────────────── */

const icon = (status) => STATUS_ICON[status] ?? status;
const code = (s) => `\`${s}\``;
const table = (headers, rows) =>
  [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ].join("\n");

const evidenceText = (row) => (row.evidence ?? []).map(code).join(" · ");
const withNote = (row, extra) =>
  [evidenceText(row), row.note ? `— ${row.note}` : "", extra ?? ""].filter(Boolean).join(" ");

const byId = (rows) => new Map(rows.map((r) => [r.id, r]));
const featureById = byId(features.features);
const changeById = byId(changeset.items);
const defectById = byId(defects.defects);
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
  process.exit(0);
}

if (command !== "render") {
  console.error(`unknown command "${command}" — use render | render --check | ask | stats`);
  process.exit(1);
}

const rendered = {
  features: renderFeatures(),
  changeset: renderChangeset(),
};

let drifted = 0;
for (const [key, content] of Object.entries(rendered)) {
  const target = OUT[key];
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (check) {
    if (current !== content) {
      const firstDiff = current
        .split("\n")
        .findIndex((line, i) => line !== content.split("\n")[i]);
      fail(
        `${path.relative(ROOT, target)} is out of date with docs/data (first difference at line ${
          firstDiff + 1
        }) — run \`pnpm run docs:render\``,
      );
      drifted++;
    } else {
      ok(`${path.relative(ROOT, target)} matches docs/data`);
    }
  } else {
    fs.writeFileSync(target, content);
    ok(`rendered ${path.relative(ROOT, target)}`);
  }
}

if (check && drifted === 0) ok("docs in sync");
process.exit(failures > 0 ? 1 : 0);
