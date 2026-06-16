'use client';

interface StepIndicatorProps {
  steps: { label: string; description: string }[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < currentStep
                    ? 'bg-accent text-white'
                    : i === currentStep
                    ? 'bg-accent/20 text-accent border-2 border-accent'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < currentStep ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                  i === currentStep ? 'text-accent' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-3 mt-[-1.25rem] ${
                  i < currentStep ? 'bg-accent' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
