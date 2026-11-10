/**
 * Tests for the docs gate (scripts/docs.mjs).
 *
 * The gate is what stops the rendered docs from lying, so it needs its own
 * tests rather than the occasional manual poke. Every case builds a throwaway
 * repo tree (DOCS_ROOT), breaks exactly one thing, and asserts the gate fails
 * with the right message — and that a clean tree passes.
 *
 *   pnpm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, "docs.mjs");
const SCHEMAS = path.join(HERE, "..", "docs", "data", "schema");

const baseFeatures = () => ({
  $schema: "./schema/features.schema.json",
  schema: 1,
  verified: "2026-11-10",
  note: "fixture",
  features: [
    { id: "F-01", name: "Directory", status: "shipped", evidence: ["app/feature.ts"] },
  ],
  launch_checklist: [],
});

const baseDefects = () => ({
  $schema: "./schema/defects.schema.json",
  schema: 1,
  verified: "2026-11-10",
  note: "fixture",
  defects: [
    {
      id: "D1",
      title: "A defect",
      severity: "high",
      status: "open",
      impact: "It hurts",
      fix: "Fix it",
      evidence: ["app/feature.ts"],
      features: ["F-01"],
    },
  ],
});

const baseChangeset = () => ({
  $schema: "./schema/changeset.schema.json",
  schema: 1,
  call_date: "2026-09-12",
  note: "fixture",
  items: [
    {
      id: "C01",
      title: "A change",
      status: "specd",
      decision_type: "build",
      requested: "Do the thing",
      decision: "Build it",
      features: ["F-01"],
      defects: ["D1"],
      questions: ["Q1"],
    },
  ],
  out_of_scope: [],
});

const baseQuestions = () => ({
  $schema: "./schema/questions.schema.json",
  schema: 1,
  note: "fixture",
  questions: [{ id: "Q1", question: "What price?", status: "open", from: ["C01"] }],
});

const baseChangelog = () => ({
  $schema: "./schema/changelog.schema.json",
  schema: 1,
  note: "fixture",
  changelog: [
    {
      id: "CH-001",
      date: "2026-11-10",
      type: "fixed",
      title: "Something",
      detail: "Details",
      changeset: ["C01"],
      defects: ["D1"],
    },
  ],
});

const baseTimeline = () => ({
  $schema: "./schema/timeline.schema.json",
  schema: 1,
  note: "fixture",
  sessions: [
    {
      id: "S-2026-11-10-01",
      date: "2026-11-10",
      label: "A session",
      labelStyle: "dash",
      focus: "Do the work",
      whatChanged: [{ title: "Change", detail: "What happened" }],
      rationale: ["Because."],
      files: ["app/feature.ts"],
      changeset: ["C01"],
      defects: ["D1"],
    },
  ],
});

function makeRepo(mutate = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lawyard-docs-"));
  fs.mkdirSync(path.join(root, "docs", "data", "schema"), { recursive: true });
  fs.mkdirSync(path.join(root, "app"), { recursive: true });
  fs.writeFileSync(path.join(root, "app", "feature.ts"), "export const x = 1;\n");

  for (const file of fs.readdirSync(SCHEMAS)) {
    fs.copyFileSync(path.join(SCHEMAS, file), path.join(root, "docs", "data", "schema", file));
  }

  const registries = {
    features: baseFeatures(),
    changeset: baseChangeset(),
    defects: baseDefects(),
    questions: baseQuestions(),
    changelog: baseChangelog(),
    timeline: baseTimeline(),
  };

  for (const [name, data] of Object.entries(registries)) {
    const value = mutate[name] ? mutate[name](structuredClone(data)) : data;
    fs.writeFileSync(
      path.join(root, "docs", "data", `${name}.json`),
      JSON.stringify(value, null, 2)
    );
  }

  return root;
}

function run(root, args = ["render", "--check"]) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    env: { ...process.env, DOCS_ROOT: root },
    encoding: "utf8",
  });
  return {
    code: result.status,
    out: `${result.stdout || ""}${result.stderr || ""}`,
  };
}

function expectFailure(mutate, pattern) {
  const root = makeRepo(mutate);
  const { code, out } = run(root);
  assert.equal(code, 1, `expected the gate to fail, got exit ${code}:\n${out}`);
  assert.match(out, pattern);
  assert.equal(/render artifacts in sync/.test(out), false, "gate claimed success while failing");
}

test("a clean tree passes validation and the render check", () => {
  const root = makeRepo();
  const rendered = run(root, ["render"]);
  assert.equal(rendered.code, 0, rendered.out);
  assert.match(rendered.out, /data valid/);

  const { code, out } = run(root, ["render", "--check"]);
  assert.equal(code, 0, out);
  assert.match(out, /render artifacts in sync/);
});

test("rejects an unknown property (typo in a field name)", () => {
  expectFailure(
    {
      defects: (d) => {
        d.defects[0].severty = "high";
        return d;
      },
    },
    /must NOT have additional properties.*severty/
  );
});

test("rejects a value outside the enum", () => {
  expectFailure(
    {
      defects: (d) => {
        d.defects[0].status = "done";
        return d;
      },
    },
    /status: must be equal to one of the allowed values/
  );
});

test("rejects a field over its length cap", () => {
  expectFailure(
    {
      defects: (d) => {
        d.defects[0].impact = "x".repeat(241);
        return d;
      },
    },
    /impact: must NOT have more than 240 characters/
  );
});

test("rejects a malformed id", () => {
  expectFailure(
    {
      defects: (d) => {
        d.defects[0].id = "DEF-1";
        return d;
      },
    },
    /id: must match pattern/
  );
});

test("rejects a duplicate id", () => {
  expectFailure(
    {
      defects: (d) => {
        d.defects.push({ ...structuredClone(d.defects[0]) });
        return d;
      },
    },
    /duplicate id D1/
  );
});

test("rejects a dangling cross-reference", () => {
  expectFailure(
    {
      defects: (d) => {
        d.defects[0].features = ["F-99"];
        return d;
      },
    },
    /references unknown F-99/
  );
});

test("rejects evidence that no longer exists on disk", () => {
  expectFailure(
    {
      defects: (d) => {
        d.defects[0].evidence = ["app/deleted.ts"];
        return d;
      },
    },
    /evidence path does not exist .*app\/deleted\.ts/
  );
});

test("rejects an answered question with no answer", () => {
  expectFailure(
    {
      questions: (q) => {
        q.questions[0].status = "answered";
        return q;
      },
    },
    /answered without an answer/
  );
});

test("rejects a session that records nothing", () => {
  expectFailure(
    {
      timeline: (t) => {
        delete t.sessions[0].focus;
        t.sessions[0].whatChanged = [];
        return t;
      },
    },
    /session records nothing/
  );
});

test("fails render --check when the markdown drifts from the data", () => {
  const root = makeRepo();
  const rendered = run(root, ["render"]);
  assert.equal(rendered.code, 0, rendered.out);

  const md = path.join(root, "docs", "FEATURE-STATUS.md");
  fs.writeFileSync(md, `${fs.readFileSync(md, "utf8")}\nhand-edited line\n`);

  const { code, out } = run(root, ["render", "--check"]);
  assert.equal(code, 1, out);
  assert.match(out, /out of date with docs\/data/);
});

test("fails graph --check when the graph artifacts are stale", () => {
  const root = makeRepo();
  assert.equal(run(root, ["render"]).code, 0);
  assert.equal(run(root, ["graph"]).code, 0);

  // Add a node the graph indexes, after the graph was written.
  const changesetPath = path.join(root, "docs", "data", "changeset.json");
  const changeset = JSON.parse(fs.readFileSync(changesetPath, "utf8"));
  changeset.items.push({
    id: "C02",
    title: "A second change",
    status: "specd",
    decision_type: "park",
    requested: "Do another thing",
    decision: "Parked",
  });
  fs.writeFileSync(changesetPath, JSON.stringify(changeset, null, 2));

  const { code, out } = run(root, ["graph", "--check"]);
  assert.equal(code, 1, out);
  assert.match(out, /out of date/);
});
