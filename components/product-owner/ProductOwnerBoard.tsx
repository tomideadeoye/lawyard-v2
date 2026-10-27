'use client'

import { useState } from 'react'

interface Question {
  id: string
  question_key: string
  title: string
  body: string | null
  options: string[]
}

export function ProductOwnerBoard({
  token,
  initialOpen,
  initialAnswered,
}: {
  token: string
  initialOpen: Question[]
  initialAnswered: Array<Question & { answer_text: string | null; answer_choice: string | null; status: string }>
}) {
  const [open, setOpen] = useState(initialOpen)
  const [answered, setAnswered] = useState(initialAnswered)
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [insight, setInsight] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function post(body: Record<string, unknown>) {
    const res = await fetch('/api/product-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-po-token': token },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed')
  }

  async function answer(q: Question) {
    const choice = choices[q.question_key]
    const text = texts[q.question_key]?.trim()
    if (!choice && !text) return
    setBusy(q.question_key)
    try {
      await post({ action: 'answer', question_key: q.question_key, answer_choice: choice, answer_text: text })
      const updated = { ...q, answer_choice: choice, answer_text: text || null, status: 'answered' } as const
      setOpen((prev) => prev.filter((x) => x.question_key !== q.question_key))
      setAnswered((prev) => [updated, ...prev])
      setToast('Answered — thank you.')
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  async function dumpInsight() {
    if (!insight.trim()) return
    setBusy('insight')
    try {
      await post({ action: 'insight', answer_text: insight })
      setInsight('')
      setToast('Saved. Tomide will pick it up.')
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-xl font-bold text-neutral-900">Product questions for Tobi</h1>
          <p className="text-sm text-neutral-500">
            Click an option or type an answer — saved instantly. Anything else you want done, dump it in the box below.
          </p>
        </header>

        {open.length === 0 && (
          <p className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            No open questions right now.
          </p>
        )}

        {open.map((q) => (
          <section key={q.question_key} className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-neutral-900">{q.title}</h2>
            {q.body && <p className="text-sm text-neutral-600">{q.body}</p>}
            {q.options.length > 0 && (
              <div className="flex flex-col gap-2">
                {q.options.map((opt) => (
                  <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm hover:border-neutral-400">
                    <input
                      type="radio"
                      name={q.question_key}
                      value={opt}
                      checked={choices[q.question_key] === opt}
                      onChange={() => setChoices((c) => ({ ...c, [q.question_key]: opt }))}
                      className="accent-neutral-900"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            <textarea
              value={texts[q.question_key] || ''}
              onChange={(e) => setTexts((t) => ({ ...t, [q.question_key]: e.target.value }))}
              placeholder={q.options.length > 0 ? 'Optional — expand or add figures (e.g. exact ₦ amounts)' : 'Your answer…'}
              rows={2}
              className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={busy === q.question_key || (!choices[q.question_key] && !texts[q.question_key]?.trim())}
              onClick={() => answer(q)}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {busy === q.question_key ? 'Saving…' : 'Save answer'}
            </button>
          </section>
        ))}

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-3">
          <h2 className="font-semibold text-neutral-900">Anything else — ideas, complaints, notes</h2>
          <textarea
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            rows={3}
            placeholder='Dump it here. E.g. "Make the homepage hero a search box first"…'
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={busy === 'insight' || !insight.trim()}
            onClick={dumpInsight}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {busy === 'insight' ? 'Saving…' : 'Save'}
          </button>
        </section>

        {answered.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-neutral-500">Already answered</h2>
            {answered.map((q) => (
              <div key={q.id} className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
                <span className="font-medium text-neutral-900">{q.title}</span>
                <span className="text-neutral-500">
                  {' '}
                  → {q.answer_choice || ''}
                  {q.answer_text ? ` · ${q.answer_text}` : ''}
                </span>
              </div>
            ))}
          </section>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </main>
  )
}
