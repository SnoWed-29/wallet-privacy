import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout, navigationItems } from "./components/layout";
import { ToastProvider } from "./components/ui";
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { ManageWalletPage } from "./features/manage-wallet/pages/ManageWalletPage";
import { PlanningPage } from "./features/planning/pages/PlanningPage";
import { ReportsPage } from "./features/reports/pages/ReportsPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { TransactionsRoutePage } from "./features/transactions/pages/TransactionsRoutePage";
import { WalletAppProvider } from "./features/wallet/WalletAppContext";
import "./styles/globals.css";

function App() {
  return (
    <ToastProvider>
      <WalletAppProvider>
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
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </WalletAppProvider>
    </ToastProvider>
  );
}

export default App;
