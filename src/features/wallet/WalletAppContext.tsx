import { createContext, ReactNode, useContext } from "react";
import { useWalletApp, type WalletAppState } from "../../hooks/useWalletApp";

const WalletAppContext = createContext<WalletAppState | null>(null);

type WalletAppProviderProps = { children: ReactNode };

export function WalletAppProvider({ children }: WalletAppProviderProps) {
  const wallet = useWalletApp();

  return (
    <WalletAppContext.Provider value={wallet}>
      {children}
    </WalletAppContext.Provider>
  );
}

export function useWalletAppContext() {
  const context = useContext(WalletAppContext);

  if (!context) {
    throw new Error("useWalletAppContext must be used within WalletAppProvider");
  }

  return context;
}
