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
            className={`flex min-w-fit items-center gap-2 rounded-full border px-3.5 py-2 font-semibold transition motion-reduce:transition-none ${
              isActive
                ? "border-app-primary/24 bg-app-primary/10 text-app-text shadow-app-soft"
                : isComplete
                  ? "border-app-peach/28 bg-white/58 text-app-primary"
                  : "border-[rgba(60,38,52,0.08)] bg-white/42 text-app-muted"
            }`}
            key={step}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-caption font-semibold ${
                isActive || isComplete
                  ? "bg-app-primary text-white"
                  : "bg-white/72 text-app-muted"
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
