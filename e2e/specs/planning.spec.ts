import { e2eData } from "../fixtures/test-data";
import { connectToDesktopApp, closeDesktopApp } from "../helpers/app";
import { selectors } from "../helpers/selectors";

export async function planningSpec() {
  const app = await connectToDesktopApp();

  try {
    await app.$(selectors.nav.planning).click();
    await app.$('input[placeholder="Budget name"]').setValue(e2eData.budgetName);
    await app.$('input[placeholder="Amount"]').setValue("500");
    await app.$("aria/Create Monthly Budget").click();

    await app.$('input[placeholder="Goal name"]').setValue(e2eData.savingsGoalName);
    await app.$('input[placeholder="Target amount"]').setValue("1000");
    await app.$("aria/Create Savings Goal").click();

    await app.$('input[placeholder="Bill name"]').setValue(e2eData.recurringBillName);
    await app.$("aria/Add Recurring Bill").click();
  } finally {
    await closeDesktopApp(app);
  }
}
