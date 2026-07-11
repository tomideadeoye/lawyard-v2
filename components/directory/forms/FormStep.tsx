'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Step {
  label: string
  description: string
}

interface FormStepProps {
  steps: Step[]
  children: (step: number) => React.ReactNode
  onStepChange?: (step: number) => void
  submitLabel?: string
  loading?: boolean
}

export default function FormStep({
  steps,
  children,
  onStepChange,
  submitLabel = 'Submit',
  loading = false,
}: FormStepProps) {
  const [step, setStep] = useState(0)

  const isFirst = step === 0
  const isLast = step === steps.length - 1

  function goNext() {
    if (isLast) return
    const next = step + 1
    setStep(next)
    onStepChange?.(next)
  }

  function goBack() {
    if (isFirst) return
    const prev = step - 1
    setStep(prev)
    onStepChange?.(prev)
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < step
                      ? 'bg-accent text-white'
                      : i === step
                      ? 'bg-accent/20 text-accent border-2 border-accent'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                    i === step ? 'text-accent' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 mt-[-1rem] ${
                    i < step ? 'bg-accent' : 'bg-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      {children(step)}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={isFirst}
          className="gap-1.5 text-muted-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        <span className="text-xs text-muted-foreground">
          {step + 1} / {steps.length}
        </span>

        {isLast ? (
          <Button
            type="submit"
            disabled={loading}
            className="gap-1.5 glow-primary"
          >
            {loading ? 'Processing...' : submitLabel}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={goNext}
            className="gap-1.5"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
