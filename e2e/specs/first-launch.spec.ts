import { connectToDesktopApp, closeDesktopApp } from "../helpers/app";
import { selectors } from "../helpers/selectors";

export async function firstLaunchSpec() {
  const app = await connectToDesktopApp();

  try {
    await app.$(selectors.sidebar).waitForDisplayed();
    await app.$(selectors.nav.dashboard).waitForDisplayed();
    await app.$(selectors.nav.transactions).waitForDisplayed();
    await app.$(selectors.nav.planning).waitForDisplayed();
    await app.$(selectors.nav.manageWallet).waitForDisplayed();
    await app.$(selectors.nav.reports).waitForDisplayed();
    await app.$(selectors.nav.settings).waitForDisplayed();
  } finally {
    await closeDesktopApp(app);
  }
}
