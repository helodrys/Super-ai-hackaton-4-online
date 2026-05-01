import { CarTaxiFront, Compass, Menu, Route, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import type { PageKey } from "../../types";

const navItems: Array<{ key: PageKey; label: string; icon: typeof Compass }> = [
  { key: "dashboard", label: "Dashboard", icon: Compass },
  { key: "taxi", label: "Taxi Checker", icon: CarTaxiFront },
  { key: "planner", label: "Trip Planner", icon: Sparkles },
  { key: "itinerary", label: "My Route", icon: Route }
];

type TopNavProps = {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
};

export function TopNav({ currentPage, onNavigate }: TopNavProps) {
  const [open, setOpen] = useState(false);

  const go = (page: PageKey) => {
    onNavigate(page);
    setOpen(false);
  };

  return (
    <header className="top-nav-wrap">
      <nav className="top-nav" aria-label="Primary">
        <button className="brand-mark" onClick={() => go("dashboard")} aria-label="Go to dashboard">
          <span className="brand-icon"><ShieldCheck size={20} /></span>
          <span>
            <strong>SafeFlow</strong>
            <small>Thailand</small>
          </span>
        </button>

        <div className={`nav-links ${open ? "nav-links-open" : ""}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`nav-link ${currentPage === item.key ? "nav-link-active" : ""}`}
                onClick={() => go(item.key)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="nav-actions">
          <button className="primary-pill" onClick={() => go("planner")}>
            Plan my trip
            <Sparkles size={16} />
          </button>
          <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </nav>
    </header>
  );
}
