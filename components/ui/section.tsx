import { cn } from '@/lib/utils'

interface SectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function Section({ title, children, className }: SectionProps) {
  return (
    <section className={cn('rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-6', className)}>
      {title && <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground mb-4">{title}</h2>}
      {children}
    </section>
  )
}
