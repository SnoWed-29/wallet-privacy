import type { OnboardingStepId } from "../types/onboarding.types";

const stepLabels: Record<OnboardingStepId, string> = {
  welcome: "Welcome",
  account: "Account",
  categories: "Categories",
  budget: "Budget",
  recurring: "Bills",
  complete: "Done",
};

export const onboardingSteps = Object.keys(stepLabels) as OnboardingStepId[];

export function OnboardingProgress({ currentStep }: { currentStep: OnboardingStepId }) {
  const currentIndex = onboardingSteps.indexOf(currentStep);

  return (
    <ol
      aria-label="Onboarding progress"
      className="flex gap-3 overflow-x-auto pb-1 text-sm max-sm:-mx-2 max-sm:px-2"
    >
      {onboardingSteps.map((step, index) => {
        const isActive = step === currentStep;
        const isComplete = index < currentIndex;

        return (
          <li
            aria-current={isActive ? "step" : undefined}
            className={`flex min-w-fit items-center gap-2 rounded-full border px-3.5 py-2 font-extrabold transition motion-reduce:transition-none ${
              isActive
                ? "border-app-primary bg-emerald-50 text-app-text shadow-app-soft"
                : isComplete
                  ? "border-emerald-200 bg-white text-emerald-800"
                  : "border-app-border bg-white text-app-muted"
            }`}
            key={step}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                isActive || isComplete ? "bg-app-primary text-white" : "bg-slate-100 text-app-muted"
              }`}
            >
              {index + 1}
            </span>
            {stepLabels[step]}
          </li>
        );
      })}
    </ol>
  );
}
