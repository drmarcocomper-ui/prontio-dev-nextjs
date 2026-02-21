"use client";

const STEPS = [
  { number: 1, label: "Consultório" },
  { number: 2, label: "Profissional" },
  { number: 3, label: "Horários" },
];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step.number < currentStep
                  ? "bg-primary-600 text-white"
                  : step.number === currentStep
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {step.number < currentStep ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span
              className={`hidden text-sm font-medium sm:inline ${
                step.number <= currentStep ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-8 sm:w-12 ${
                step.number < currentStep ? "bg-primary-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
