import { expect, test } from "vitest";
import { renderWithProviders, screen } from "../../../test/test-utils";
import { OnboardingLayout } from "../components/OnboardingLayout";

test("onboarding layout uses responsive and reduced-motion-safe classes", () => {
  renderWithProviders(
    <OnboardingLayout currentStep="welcome">
      <div>Step content</div>
    </OnboardingLayout>,
  );

  const stepContent = screen.getByText("Step content");
  const card = stepContent.parentElement;

  expect(screen.getByLabelText("Onboarding progress")).toBeVisible();
  expect(card?.className).toContain("max-w-4xl");
  expect(card?.className).toContain("motion-safe:animate-[walletStepIn_180ms_ease-out]");
});
