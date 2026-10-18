#!/usr/bin/env node
/**
 * Migration-drift check — fails when local migration files have not been
 * applied to the linked Supabase project (or vice versa).
 *
 * Background: on 2026-10-18 seven migrations written across two sessions had
 * never been pushed; nothing in the workflow noticed because the files
 * existed locally. This script makes that drift a hard, visible failure.
 *
 * Usage:  node scripts/migration-drift.mjs
 * Exit:   0 = no drift · 1 = drift (or the check itself failed)
 */

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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
