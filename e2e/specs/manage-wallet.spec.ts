import { e2eData } from "../fixtures/test-data";
import { connectToDesktopApp, closeDesktopApp } from "../helpers/app";
import { selectors } from "../helpers/selectors";

export async function manageWalletSpec() {
  const app = await connectToDesktopApp();

  try {
    await app.$(selectors.nav.manageWallet).click();
    await app.$("aria/Account name").setValue(e2eData.accountName);
    await app.$("aria/Add Account").click();
    await app.$(`aria/${e2eData.accountName}`).waitForDisplayed();

    await app.$("aria/Category name").setValue(e2eData.expenseCategoryName);
    await app.$("aria/Add Category").click();
    await app.$(`aria/${e2eData.expenseCategoryName}`).waitForDisplayed();
  } finally {
    await closeDesktopApp(app);
  }
}
