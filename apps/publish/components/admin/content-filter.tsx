'use client'

import { useRouter } from 'next/navigation'

export function ContentFilter({
  tab,
  status,
}: {
  tab: string
  status: string
}) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams()
    params.set('tab', tab)
    params.set('status', e.target.value)
    router.push(`/content?${params.toString()}`)
  }

  return (
    <select
      name="status"
      defaultValue={status}
      onChange={handleChange}
      style={{
        background: '#FFFFFF', border: '1px solid #E2E8F0',
        color: '#0F172A', padding: '8px 14px', borderRadius: '8px',
        fontSize: '0.85rem', fontFamily: 'inherit', cursor: 'pointer',
        outline: 'none', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--primary)';
        e.target.style.boxShadow = '0 0 0 3px rgba(30, 58, 95, 0.08)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#E2E8F0';
        e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02)';
      }}
    >
      <option value="all">All Status</option>
      <option value="published">Published</option>
      <option value="draft">Draft</option>
      <option value="archived">Archived</option>
    </select>
  )
}
