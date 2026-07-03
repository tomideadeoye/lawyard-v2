# Standalone Chamber Listing — Archived Approach

> Preserved for potential revert if project owner insists chambers must be standalone entities.

## Context

The directory was refactored to follow the industry-standard model where:
- **Individual lawyers** are the primary searchable entity
- **Chambers** are container/firm profiles that aggregate their member lawyers
- Chamber detail page showcases lawyers prominently with their specialties
- Search surfaces lawyers first (chambers appear as context)

## What Changed

### Before (Standalone Chamber)
- Chamber listing was a self-contained profile with its own description, contact, and lawyers
- The chamber page listed lawyers in a minimal grid
- Lawyers showed chamber name in their Quick Info sidebar
- Chamber add-listing form collected 14 sections of standalone data

### After (Industry Standard)
- Chamber page is a full firm profile with:
  - Gradient hero banner
  - Stats row (lawyer count, practice areas, verified count)
  - Aggregated practice areas from all member lawyers
  - Prominent lawyer directory with individual specialties
  - Contact sidebar + Quick Info card
- Lawyers remain individually searchable with chamber context
- Practice areas auto-aggregate from member lawyers' specialties

## Files Changed

### Modified
- `app/directory/chamber/[id]/page.tsx` — Enhanced firm profile

### Unchanged (supports standalone revert)
- `app/directory/add-listing/page.tsx` — Chamber listing creation form (intact)
- `app/directory/dashboard/chamber/page.tsx` — Chamber management in dashboard (intact)
- `app/directory/dashboard/chamber/chamber-form.tsx` — Chamber form component (intact)
- `lib/directory/api.ts` — `getChamberById()` unchanged
- `schema.sql` — `chambers` table unchanged (still has all standalone fields)
- `supabase/migrations/20260622000001_extend_chambers.sql` — Chamber schema intact

## How to Revert to Standalone Chamber Approach

```bash
# Restore the original chamber page
git checkout HEAD~1 -- app/directory/chamber/[id]/page.tsx

# Delete this preservation doc
rm docs/preserved/standalone-chambers.md
```

Or restore from commit history:
```bash
git log --oneline -- app/directory/chamber/[id]/page.tsx
git checkout <commit-hash> -- app/directory/chamber/[id]/page.tsx
```

## Rationale for the Change

Industry research showed that top legal directories (Avvo, Justia, Martindale-Hubbell, FindLaw, Chambers & Partners) all follow this pattern:
1. Individual lawyers are the primary entity
2. Law firms/chambers are containers that aggregate lawyer profiles
3. Firm pages prominently list all attorneys with their specialties
4. Search results surface individual lawyers tagged with firm context

Chambers & Partners uses a "ranked practice area" model where the firm's practice area rankings lead, followed by listing the key lawyers in each area.
