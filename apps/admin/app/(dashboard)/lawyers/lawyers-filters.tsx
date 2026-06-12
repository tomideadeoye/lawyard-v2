'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition, useEffect, useState } from 'react'

export function LawyersFilters({
  initialStatus,
  initialSearch,
}: {
  initialStatus: string
  initialSearch: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchTerm, setSearchTerm] = useState(initialSearch)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== initialSearch) {
        updateFilters(initialStatus, searchTerm)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  function updateFilters(statusValue: string, searchValue: string) {
    const params = new URLSearchParams(searchParams?.toString() || '')
    
    if (statusValue && statusValue !== 'all') {
      params.set('status', statusValue)
    } else {
      params.delete('status')
    }

    if (searchValue) {
      params.set('search', searchValue)
    } else {
      params.delete('search')
    }
    
    params.delete('page')

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      marginBottom: '24px', 
      alignItems: 'center', 
      opacity: isPending ? 0.6 : 1, 
      transition: 'opacity 0.15s ease' 
    }}>
      <select
        name="status"
        value={initialStatus}
        onChange={(e) => updateFilters(e.target.value, searchTerm)}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          color: '#0F172A',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
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
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="rejected">Rejected</option>
      </select>

      <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
        <input
          name="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search..."
          style={{
            width: '100%',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#0F172A',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            outline: 'none',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
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
        />
        {isPending && (
          <span style={{ 
            position: 'absolute', 
            right: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            fontSize: '0.75rem', 
            color: '#64748B' 
          }}>
            Loading...
          </span>
        )}
      </div>
    </div>
  )
}
