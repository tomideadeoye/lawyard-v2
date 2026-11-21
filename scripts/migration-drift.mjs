#!/usr/bin/env node
/**
 * Migration-drift check — fails when local migration files have not been
 * applied to the linked Supabase project (or vice versa).
 *
 * Background: on 2026-10-18 seven migrations written across two sessions had
 * never been pushed; nothing in the workflow noticed because the files
 * existed locally. This script makes that drift a hard, visible failure.
 *
 * Two local checks run first, before the CLI is touched:
 *   1. Duplicate versions. Two sessions writing `20261121000002_a.sql` and
 *      `20261121000002_b.sql` merge cleanly in git, and `supabase migration
 *      list` prints a single row for the version — so one file becomes
 *      invisible and the drift check reports "clean". That happened on
 *      2026-11-21; uniqueness is the one thing the CLI cannot tell you about.
 *   2. Filenames Supabase will silently ignore, because a migration that never
 *      applies is the same failure with no error message.
 *
 * Usage:  node scripts/migration-drift.mjs
 * Exit:   0 = no drift · 1 = drift, duplicate versions, or a bad filename
 */

import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations')

// The version is the 14-digit prefix; the slug after it is for humans.
const VERSIONED = /^(\d{14})_.+\.sql$/

const byVersion = new Map()
const ignored = []

for (const file of readdirSync(migrationsDir)) {
  const match = file.match(VERSIONED)
  if (!match) {
    ignored.push(file)
    continue
  }
  const files = byVersion.get(match[1]) ?? []
  files.push(file)
  byVersion.set(match[1], files)
}

const duplicates = [...byVersion.entries()].filter(([, files]) => files.length > 1)

if (duplicates.length > 0) {
  console.error('migration-drift: DUPLICATE MIGRATION VERSIONS\n')
  for (const [version, files] of duplicates) {
    console.error(`Version ${version} is claimed by ${files.length} files:`)
    for (const file of files) console.error(`  - supabase/migrations/${file}`)
    console.error('')
  }
  console.error('Only one file can hold a version. `supabase migration list` prints one row')
  console.error('per version, so the other file is invisible to this check and to `db push`.')
  console.error('')
  console.error('Fix: rename the file that is NOT applied yet, using a free version —')
  console.error('     `supabase migration new <name>` stamps a fresh timestamp.')
  console.error('     Never rename an applied migration: the remote row is keyed to its version.')
  process.exit(1)
}

if (ignored.length > 0) {
  console.error('migration-drift: UNRECOGNISED FILES IN supabase/migrations\n')
  for (const file of ignored) console.error(`  - ${file}`)
  console.error('\nSupabase only applies files named <14-digit version>_<name>.sql.')
  console.error('Anything else is skipped silently, which is drift with no error message.')
  process.exit(1)
}

const res = spawnSync('supabase', ['migration', 'list', '--linked'], {
  cwd: repoRoot,
  encoding: 'utf8',
  timeout: 120_000,
})

const stdout = res.stdout ?? ''
const stderr = res.stderr ?? ''

if (res.status !== 0 && !/^\s*\d{14}\s*\|/m.test(stdout)) {
  console.error('migration-drift: `supabase migration list` failed.')
  if (stderr.trim()) console.error(stderr.trim())
  process.exit(1)
}

const unapplied = []
const remoteOnly = []
const seen = new Set()

for (const line of stdout.split('\n')) {
  const m = line.match(/^\s*(\d{14})?\s*\|\s*(\d{14})?\s*\|/)
  if (!m) continue
  const [, local, remote] = m
  if (local && remote) {
    if (seen.has(local)) continue
    seen.add(local)
    continue
  }
  if (local && !remote) unapplied.push(local)
  if (remote && !local) remoteOnly.push(remote)
}

if (unapplied.length === 0 && remoteOnly.length === 0) {
  console.log(`migration-drift: clean — ${seen.size} migrations, all in sync.`)
  process.exit(0)
}

console.error('migration-drift: DRIFT DETECTED\n')

if (unapplied.length > 0) {
  console.error(`${unapplied.length} local migration file(s) NOT applied to the linked project:`)
  for (const id of unapplied) console.error(`  - supabase/migrations/${id}*.sql`)
  console.error('\nFix: pnpm run migrations:push   (then re-run this check)\n')
}

if (remoteOnly.length > 0) {
  console.error(`${remoteOnly.length} migration(s) exist remotely but have no local file:`)
  for (const id of remoteOnly) console.error(`  - ${id}`)
  console.error('\nSomeone pushed a migration this checkout has never seen.')
  console.error('Fix: git pull (or accept the remote-only row if it was hand-applied).\n')
}

process.exit(1)
