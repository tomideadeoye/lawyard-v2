import Link from 'next/link'
import {
  LEGISLATIONS,
  ALPHABET,
  getLettersWithContent,
  type Legislation,
} from '@/lib/legislations'

export const metadata = {
  title: 'Legislations – Lawyard',
  description: 'Browse Nigerian legislation acts — purchase and download PDF copies of all Nigerian laws and acts.',
}

export default function LegislationsPage() {
  const lettersWithContent = getLettersWithContent()
  const grouped: Record<string, Legislation[]> = {}
  for (const letter of ALPHABET) {
    const acts = LEGISLATIONS.filter((l) =>
      l.title.toUpperCase().startsWith(letter),
    )
    if (acts.length > 0) grouped[letter] = acts
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-3">Legislations</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Browse the complete catalogue of Nigerian legislation acts. Purchase
          and download PDF copies for your legal library.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-12 pb-6 border-b border-border/40">
        {ALPHABET.map((letter) => {
          const hasContent = lettersWithContent.includes(letter)
          return (
            <a
              key={letter}
              href={hasContent ? `#letter-${letter}` : undefined}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors no-underline ${
                hasContent
                  ? 'text-foreground hover:bg-accent/20 hover:text-accent'
                  : 'text-muted-foreground/30 cursor-default'
              }`}
            >
              {letter}
            </a>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
        {Object.entries(grouped).map(([letter, acts]) => (
          <div key={letter} id={`letter-${letter}`}>
            <h2 className="text-2xl font-black mb-4 text-accent">
              {letter}
            </h2>
            <ul className="space-y-2.5">
              {acts.map((act) => (
                <li key={act.id}>
                  <Link
                    href={`/legislations/${act.slug}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors leading-relaxed block no-underline"
                  >
                    {act.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
