import { firstLaunchSpec } from "./first-launch.spec";
import { manageWalletSpec } from "./manage-wallet.spec";
import { planningSpec } from "./planning.spec";
import { transactionsSpec } from "./transactions.spec";

export async function fullWorkflowSpec() {
  await firstLaunchSpec();
  await manageWalletSpec();
  await transactionsSpec();
  await planningSpec();
}
