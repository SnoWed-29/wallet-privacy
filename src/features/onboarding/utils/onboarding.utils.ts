export const onboardingCompletedStorageKey = "wallet.onboardingCompleted";
export const onboardingUpdatedEventName = "wallet:onboarding-updated";

export function readOnboardingCompleted() {
  const value = window.localStorage.getItem(onboardingCompletedStorageKey);

  if (value === null) {
    return null;
  }

  return value === "true";
}

export function setOnboardingCompleted(value: boolean) {
  window.localStorage.setItem(onboardingCompletedStorageKey, String(value));
  window.dispatchEvent(new Event(onboardingUpdatedEventName));
}
