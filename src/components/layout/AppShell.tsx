import type { ReactNode } from "react";
import { ArrowLeft, Home } from "lucide-react";
import type { PageKey } from "../../types";

type AppShellProps = {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
};

export function AppShell({ currentPage, onNavigate, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="background-rails" aria-hidden="true" />
      {currentPage !== "dashboard" && (
        <button className="return-home-button" onClick={() => onNavigate("dashboard")} aria-label="Return to dashboard">
          <ArrowLeft size={18} />
          <Home size={18} />
          <span>Dashboard</span>
        </button>
      )}
      <main className="page-shell">{children}</main>
    </div>
  );
}
