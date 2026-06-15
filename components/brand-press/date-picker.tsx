'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isBefore, startOfDay, setHours, setMinutes, setMonth, setYear } from 'date-fns'

const TIMEZONES = [
  'Africa/Lagos',
  'Africa/Abuja',
  'Africa/Cairo',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Africa/Accra',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
]

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type ViewMode = 'days' | 'months' | 'years'

interface DatePickerProps {
  selected: Date | undefined
  timezone: string
  hour: number
  minute: number
  isPM: boolean
  onSelect: (date: Date | undefined) => void
  onTimezoneChange: (tz: string) => void
  onHourChange: (h: number) => void
  onMinuteChange: (m: number) => void
  onPeriodChange: (pm: boolean) => void
}

export function DatePicker({
  selected, timezone, hour, minute, isPM,
  onSelect, onTimezoneChange, onHourChange, onMinuteChange, onPeriodChange,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [use24h, setUse24h] = useState(false)
  const [view, setView] = useState<ViewMode>('days')
  const [yearOffset, setYearOffset] = useState(0)

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const today = startOfDay(new Date())
  const baseYear = currentMonth.getFullYear()
  const displayYear = baseYear + yearOffset
  const yearRange = Array.from({ length: 12 }, (_, i) => displayYear - 5 + i)

  function prev() {
    if (view === 'days') setCurrentMonth((m) => subMonths(m, 1))
    else if (view === 'months') setCurrentMonth((m) => subMonths(m, 12))
    else setYearOffset((o) => o - 12)
  }

  function next() {
    if (view === 'days') setCurrentMonth((m) => addMonths(m, 1))
    else if (view === 'months') setCurrentMonth((m) => addMonths(m, 12))
    else setYearOffset((o) => o + 12)
  }

  function selectDay(day: Date) {
    onSelect(isSelected(day) ? undefined : day)
  }

  function selectMonth(month: number) {
    setCurrentMonth((m) => setMonth(m, month))
    setView('days')
  }

  function selectYear(year: number) {
    setCurrentMonth((m) => setYear(m, year))
    setYearOffset(0)
    setView('months')
  }

  function isSelected(day: Date) {
    return selected && isSameDay(day, selected)
  }

  function isPast(day: Date) {
    return isBefore(day, today)
  }

  function isToday(day: Date) {
    return isSameDay(day, today)
  }

  function headerLabel() {
    if (view === 'days') return format(currentMonth, 'MMMM yyyy')
    if (view === 'months') return String(displayYear)
    return `${yearRange[0]} – ${yearRange[yearRange.length - 1]}`
  }

  function onHeaderClick() {
    if (view === 'days') setView('months')
    else if (view === 'months') { setYearOffset(0); setView('years') }
  }

  return (
    <div>
      <label className="block text-sm font-bold mb-1.5">Schedule Publish Date</label>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
          <button type="button" onClick={prev} className="p-1 rounded-md hover:bg-muted transition-colors shrink-0">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onHeaderClick}
            className="text-sm font-bold hover:text-accent transition-colors"
          >
            {headerLabel()}
          </button>
          <button type="button" onClick={next} className="p-1 rounded-md hover:bg-muted transition-colors shrink-0">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days View */}
        {view === 'days' && (
          <div className="grid grid-cols-7 gap-px bg-border/50">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-center py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background">
                {d}
              </div>
            ))}
            {days.map((day) => {
              const isCurrent = isSameMonth(day, currentMonth)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isPast(day) && !isToday(day)}
                  onClick={() => selectDay(day)}
                  className={`py-1.5 text-xs font-medium transition-colors bg-background
                    ${!isCurrent ? 'text-muted-foreground/30' : ''}
                    ${isPast(day) && !isToday(day) ? 'text-muted-foreground/20 cursor-not-allowed' : 'hover:bg-accent/10 cursor-pointer'}
                    ${isSelected(day) ? 'bg-accent text-accent-foreground hover:bg-accent' : ''}
                    ${isToday(day) && !isSelected(day) ? 'text-accent font-bold' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        )}

        {/* Months View */}
        {view === 'months' && (
          <div className="grid grid-cols-4 gap-1.5 p-3">
            {MONTHS.map((month, i) => (
              <button
                key={month}
                type="button"
                onClick={() => selectMonth(i)}
                className={`py-2.5 text-xs font-medium rounded-xl transition-all ${
                  currentMonth.getMonth() === i
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-muted/50 text-foreground hover:bg-accent/15 hover:scale-105'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        )}

        {/* Years View */}
        {view === 'years' && (
          <div className="grid grid-cols-4 gap-1.5 p-3">
            {yearRange.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => selectYear(year)}
                className={`py-2.5 text-xs font-medium rounded-xl transition-all ${
                  baseYear === year
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-muted/50 text-foreground hover:bg-accent/15 hover:scale-105'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}

        {/* Time picker (only when date selected) */}
        {selected && (
          <div className="flex items-center gap-2 p-3 border-t border-border bg-muted/10">
            <select
              value={hour}
              onChange={(e) => onHourChange(parseInt(e.target.value))}
              className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
              ))}
            </select>
            <span className="text-xs font-bold text-muted-foreground">:</span>
            <select
              value={minute}
              onChange={(e) => onMinuteChange(parseInt(e.target.value))}
              className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
              ))}
            </select>
            {!use24h && (
              <div className="flex rounded-lg border border-border overflow-hidden ml-1">
                <button
                  type="button"
                  onClick={() => onPeriodChange(false)}
                  className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${!isPM ? 'bg-accent text-accent-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => onPeriodChange(true)}
                  className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors ${isPM ? 'bg-accent text-accent-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                >
                  PM
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setUse24h(!use24h)}
              className="ml-auto text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              {use24h ? '12h' : '24h'}
            </button>
          </div>
        )}
      </div>

      {selected && view === 'days' && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Scheduled: {format(
            setMinutes(setHours(selected, isPM ? (hour === 12 ? 12 : hour + 12) : hour === 12 ? 0 : hour), minute),
            'MMM d, yyyy h:mm a'
          )}
        </p>
      )}

      <div className="mt-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">Timezone</span>
        </div>
        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
