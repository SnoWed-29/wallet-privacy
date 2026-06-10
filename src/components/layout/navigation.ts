import { type NavigationItem } from "./Sidebar";
import {
  ChartNoAxesColumnIncreasing,
  LayoutDashboard,
  ListChecks,
  Settings,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: ListChecks },
  { label: "Planning", href: "/planning", icon: SlidersHorizontal },
  { label: "Manage Wallet", href: "/manage", icon: WalletCards },
  { label: "Reports", href: "/reports", icon: ChartNoAxesColumnIncreasing },
  { label: "Settings", href: "/settings", icon: Settings },
];
