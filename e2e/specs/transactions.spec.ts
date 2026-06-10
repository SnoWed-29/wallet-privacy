import { e2eData } from "../fixtures/test-data";
import { connectToDesktopApp, closeDesktopApp } from "../helpers/app";
import { selectors } from "../helpers/selectors";

export async function transactionsSpec() {
  const app = await connectToDesktopApp();

  try {
    await app.$(selectors.nav.transactions).click();
    await app.$("aria/Add Transaction").click();
    await app.$('input[placeholder="Amount"]').setValue(e2eData.expenseAmount);
    await app.$('input[placeholder="Description"]').setValue("E2E expense");
    await app.$("aria/Add Transaction").click();

    await app.$("aria/Amount").click();
    await app.$('input[placeholder="Search by description or notes"]').setValue("E2E");
    await app.$("aria/Apply filters").click();
  } finally {
    await closeDesktopApp(app);
  }
}
