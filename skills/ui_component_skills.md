# UI Component Patterns

## Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **UI Library**: Custom shadcn-style components (not CLI-installed)
- **Icons**: `lucide-react`
- **Class merging**: `clsx` + `tailwind-merge` via `cn()` in `lib/utils.ts`

## Component Structure

### shadcn-style Primitives
Located in `components/ui/`. Hand-rolled (not from shadcn CLI). Each component:
- Uses `cn()` for class merging
- Accepts standard HTML props + custom variants
- Follows Radix-like patterns where applicable

Current primitives: `button`, `card`, `badge`, `dialog`, `tabs`, `input`, `checkbox`, `label`, `select`, `field`, `separator`, `popover`

### Feature Components
Located in `components/` or `components/{feature}/`. Each feature component:
- Is a client component (`'use client'`)
- Handles its own state internally
- Communicates via props/callbacks
- Uses lucide-react for icons

## Modal Pattern (Dialog)

```tsx
const [open, setOpen] = useState(false)

// Render at bottom of page (outside main flow)
{open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
      {/* header, body, footer */}
    </div>
  </div>
)}
```

## Card Pattern (Tier/Pricing)

```tsx
// Interactive selection card
<button type="button" onClick={onClick}
  className={`rounded-2xl border-2 p-6 transition-all ${
    isSelected
      ? 'border-[#a77c5c] bg-[#a77c5c]/5 shadow-lg scale-[1.01]'
      : 'border-border/60 hover:border-[#a77c5c]/50 hover:-translate-y-1'
  }`}
>
  {/* Recommended badge */}
  {recommended && <span className="absolute -top-3.5 right-6 bg-gradient-to-r from-[#a77c5c] to-[#c59a78] text-white text-[10px] font-extrabold uppercase rounded-full px-3.5 py-1.5">Recommended</span>}
  
  {/* Features with check/x icons */}
  {features.map(f => {
    const isNegative = f.toLowerCase().startsWith('no ')
    return isNegative ? <X /> : <Check />
  })}
</button>
```

## Form Section Pattern

```tsx
<section className="space-y-5">
  <h2 className="text-lg font-bold border-b border-border pb-3">Section Title</h2>
  
  <div>
    <label className="block text-sm font-bold mb-1.5">Field Label *</label>
    <input className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
  </div>
</section>
```

## Grid Layouts Used

| Use Case | Grid Class |
|----------|------------|
| 3-column pricing cards | `grid grid-cols-1 md:grid-cols-3 gap-6` |
| Form + Sidebar | `grid grid-cols-1 lg:grid-cols-3 gap-8 gap-12` |
| Article grid | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` |
| 3 payment methods | `grid grid-cols-1 sm:grid-cols-3 gap-3` |

## Design Tokens

| Token | Usage |
|-------|-------|
| `bg-background` | Page background |
| `bg-card` | Card background |
| `border-border` | Borders |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary text |
| `text-accent` / `bg-accent` | Accent color (#a77c5c brown/gold) |
| `rounded-xl` | Card/input border radius |
| `rounded-2xl` | Large card border radius |
| `font-black` | Headings (900 weight) |
| `font-bold` | Labels/subheadings |
