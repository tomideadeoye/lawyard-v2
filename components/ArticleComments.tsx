'use client'

import * as React from "react"

interface Comment {
  id: string
  author: string
  date: string
  content: string
}

export default function ArticleComments({ articleSlug }: { articleSlug: string }) {
  const [comments, setComments] = React.useState<Comment[]>([])
  const [author, setAuthor] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [content, setContent] = React.useState("")
  const [saveDetails, setSaveDetails] = React.useState(false)

  // Initialize with some mock comments based on slug
  React.useEffect(() => {
    const defaultComments: Record<string, Comment[]> = {
      "african-development-bank-approves-usd-125-million-investment-to-expand-risk-insurance-capacity": [
        {
          id: "c-1",
          author: "Barrister Segun Alao",
          date: "June 12, 2026",
          content: "This is a timely and critical intervention by the AfDB. ATIDI needs this capital injection to properly de-risk infrastructure investments across West Africa. Excellent coverage."
        },
        {
          id: "c-2",
          author: "Chinyere Nduka",
          date: "June 12, 2026",
          content: "Interesting to see AfDB expanding equity instead of debt financing. This supports the Sovereign credit rating of many regional members by avoiding direct state guarantees."
        }
      ],
      "federal-high-court-jails-five-for-2025-papiri-school-terror-attack": [
        {
          id: "c-1",
          author: "Justice Bello R.",
          date: "June 12, 2026",
          content: "A landmark judgment that sends a clear message. School safety must be protected under national security frameworks."
        }
      ],
      "lagos-court-jails-279-hoodlums-after-safety-agency-raid": [
        {
          id: "c-1",
          author: "Oluwaseun Daniels",
          date: "June 12, 2026",
          content: "Lagos Task Force needs to balance safety sweeps with human rights safeguards. Restorative community service options would reduce court congestion."
        }
      ]
    }

    const initial = defaultComments[articleSlug] || [
      {
        id: "c-default",
        author: "Lawyer Opeyemi",
        date: "June 12, 2026",
        content: "A well-written and insightful summary of the current legal landscape. Looking forward to more briefs on this case."
      }
    ]
    setComments(initial)

    // Load saved details from localStorage
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("comment_author")
      const savedEmail = localStorage.getItem("comment_email")
      if (savedName && savedEmail) {
        setAuthor(savedName)
        setEmail(savedEmail)
        setSaveDetails(true)
      }
    }
  }, [articleSlug])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !content.trim()) return

    const newComment: Comment = {
      id: `c-new-${Date.now()}`,
      author,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      content
    }

    setComments((prev) => [...prev, newComment])
    setContent("")

    // Save details if requested
    if (typeof window !== "undefined") {
      if (saveDetails) {
        localStorage.setItem("comment_author", author)
        localStorage.setItem("comment_email", email)
      } else {
        localStorage.removeItem("comment_author")
        localStorage.removeItem("comment_email")
      }
    }
  }

  return (
    <section className="border-t border-border/10 pt-12 mt-16 space-y-12">
      <h3 className="text-xl font-bold font-serif uppercase tracking-wider text-foreground">
        Comments ({comments.length})
      </h3>

      {/* List of Comments */}
      {comments.length > 0 ? (
        <div className="space-y-8 divide-y divide-border/10">
          {comments.map((comment, idx) => (
            <div key={comment.id} className={`flex items-start gap-4 ${idx > 0 ? 'pt-8' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground uppercase shrink-0 border border-border select-none">
                {comment.author.substring(0, 2)}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">{comment.author}</h4>
                  <span className="text-[9px] text-muted-foreground/60 font-semibold">{comment.date}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed font-normal whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No comments posted yet. Be the first to comment.</p>
      )}

      {/* Leave a Comment Form */}
      <div className="bg-muted/10 border border-border/20 rounded-lg p-6 sm:p-8 space-y-6">
        <h4 className="text-base font-bold font-serif uppercase tracking-wider text-foreground">
          Leave a comment
        </h4>
        <p className="text-xs text-muted-foreground">
          Your email address will not be published. Required fields are marked *
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Comment *
            </label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Name *
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-border px-4 py-2.5 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-[#111129] dark:focus:ring-white text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-xs font-semibold text-foreground/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveDetails}
              onChange={(e) => setSaveDetails(e.target.checked)}
              className="rounded border-border text-[#111129] focus:ring-[#111129]"
            />
            <span>Save my name and email in this browser for the next time I comment.</span>
          </label>

          <button
            type="submit"
            className="bg-[#111129] hover:bg-[#1e1e4a] text-white font-extrabold text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-sm shadow-sm transition-colors"
          >
            Post Comment
          </button>
        </form>
      </div>
    </section>
  )
}
