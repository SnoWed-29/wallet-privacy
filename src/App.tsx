import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout, navigationItems } from "./components/layout";
import { ToastProvider } from "./components/ui";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { ManageWalletPage } from "./features/manage-wallet/pages/ManageWalletPage";
import { PlanningPage } from "./features/planning/pages/PlanningPage";
import { ReportsPage } from "./features/reports/pages/ReportsPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { TransactionsRoutePage } from "./features/transactions/pages/TransactionsRoutePage";
import { OnboardingGate } from "./features/onboarding/components/OnboardingGate";
import { UnlockPage } from "./features/security/pages/UnlockPage";
import { useWalletSecurity } from "./features/security/hooks/useWalletSecurity";
import { WalletAppProvider } from "./features/wallet/WalletAppContext";
import "./styles/globals.css";

function App() {
  return (
    <ToastProvider>
      <WalletShell />
    </ToastProvider>
  );
}

function WalletShell() {
  const security = useWalletSecurity();

  if (security.isChecking || !security.status) {
    return (
      <main className="wallet-app-bg grid min-h-screen place-items-center p-6">
        <div className="glass-surface-strong rounded-app p-6 text-sm font-semibold text-app-muted">
          Preparing your local wallet...
        </div>
      </main>
    );
  }

  if (security.status.passwordConfigured && !security.status.isUnlocked) {
    return (
      <UnlockPage
        hasLegacyDatabase={security.status.hasLegacyDatabase}
        onUnlock={async (password) => {
          await security.unlock(password);
        }}
      />
    );
  }

  return (
    <WalletAppProvider enabled={security.status.isUnlocked}>
      <OnboardingGate security={security}>
        <AppLayout
          eyebrow="Privacy-first desktop finance"
          navigationItems={navigationItems}
          status="Local data only"
          title="Wallet"
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsRoutePage />} />
            <Route path="/manage" element={<ManageWalletPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage security={security} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </OnboardingGate>
    </WalletAppProvider>
  );
}

export default App;