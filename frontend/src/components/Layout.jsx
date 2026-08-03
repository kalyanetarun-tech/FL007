import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, MessageSquare, Gamepad2, PartyPopper, Receipt,
  UserCheck, Users, Megaphone, Settings as SettingsIcon, LogOut, Menu, X, Contact, CalendarCheck, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard", perm: "dashboard" },
  { to: "/prebookings", label: "Prebookings", icon: CalendarCheck, testid: "nav-prebookings", perm: "prebookings" },
  { to: "/inquiries", label: "Inquiries", icon: MessageSquare, testid: "nav-inquiries", perm: "inquiries" },
  { to: "/visit", label: "New Bill", icon: Receipt, testid: "nav-visit", perm: "visit" },
  { to: "/bills", label: "Bills", icon: Receipt, testid: "nav-bills", perm: "bills" },
  { to: "/customers", label: "Customers", icon: Contact, testid: "nav-customers", perm: "customers" },
  { to: "/games", label: "Items / Activities", icon: Gamepad2, testid: "nav-games", perm: "games" },
  { to: "/packages", label: "Packages", icon: PartyPopper, testid: "nav-packages", perm: "packages" },
  { to: "/attendance", label: "Attendance", icon: UserCheck, testid: "nav-attendance", perm: "attendance" },
  { to: "/staff", label: "Staff", icon: Users, testid: "nav-staff", perm: "staff", adminOnly: true },
  { to: "/marketing", label: "Marketing", icon: Megaphone, testid: "nav-marketing", perm: "marketing", adminOnly: true },
  { to: "/reports", label: "Reports", icon: BarChart3, testid: "nav-reports", perm: "reports", adminOnly: true },
  { to: "/settings", label: "Settings", icon: SettingsIcon, testid: "nav-settings", perm: "settings", adminOnly: true },
];

export default function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const perms = user?.permissions || [];
  const items = NAV.filter((n) => isAdmin ? true : perms.includes(n.perm) && !n.adminOnly);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-white">
        <BrandHeader />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((n) => <NavItem key={n.to} item={n} current={loc.pathname === n.to} />)}
        </nav>
        <UserFooter user={user} onLogout={logout} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)}>
          <aside className="w-72 h-full bg-white flex flex-col animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <BrandHeader onClose={() => setOpen(false)} />
            <nav className="flex-1 px-3 py-4 space-y-1">
              {items.map((n) => <NavItem key={n.to} item={n} current={loc.pathname === n.to} onClick={() => setOpen(false)} />)}
            </nav>
            <UserFooter user={user} onLogout={logout} />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-white sticky top-0 z-30">
          <button data-testid="mobile-menu-btn" onClick={() => setOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-muted"><Menu className="h-6 w-6" /></button>
          <div className="font-black text-lg tracking-tight">
            <span className="text-accent">Fun</span><span className="text-secondary">land</span>
          </div>
          <div className="w-10" />
        </header>
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

function BrandHeader({ onClose }) {
  return (
    <div className="h-20 px-6 flex items-center justify-between border-b border-border">
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="Funland" className="w-10 h-10 rounded-xl border border-border object-contain bg-white shadow-sm" />
        <div>
          <div className="font-black text-lg leading-none tracking-tight">
            <span className="text-accent">Fun</span><span className="text-secondary">land</span>
          </div>
          <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Indore CRM</div>
        </div>
      </div>
      {onClose && <button onClick={onClose} data-testid="mobile-menu-close" className="p-2 rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>}
    </div>
  );
}

function NavItem({ item, current, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} onClick={onClick} data-testid={item.testid}
      className={`group flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${current ? "bg-accent text-accent-foreground shadow-sm" : "text-foreground hover:bg-muted hover:text-secondary"}`}>
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </NavLink>
  );
}

function UserFooter({ user, onLogout }) {
  return (
    <div className="border-t border-border p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black">
        {user?.name?.[0]?.toUpperCase() || "U"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate" data-testid="current-user-name">{user?.name}</div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{user?.role}</div>
      </div>
      <Button variant="ghost" size="icon" onClick={onLogout} data-testid="logout-btn"><LogOut className="h-5 w-5" /></Button>
    </div>
  );
}
