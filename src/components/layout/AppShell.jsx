import { Outlet, NavLink } from "react-router-dom";
import { clsx } from "clsx";

/**
 * AppShell — the one responsive navigation pattern for the whole app.
 *
 * Mobile (< md): content fills the viewport, a fixed bottom tab bar
 * provides navigation — the familiar delivery-app pattern.
 *
 * Desktop (>= md): a fixed left sidebar carries navigation and the
 * wordmark; content gets real breathing room instead of being stranded
 * in a narrow column in the middle of a wide screen.
 *
 * navItems: [{ to, icon: LucideComponent, label, badge? }]
 * subtitle: small text under the wordmark in the desktop sidebar (e.g. "Admin Panel")
 * contentMaxWidth: tailwind max-w-* class for the content column (default max-w-3xl)
 */
export default function AppShell({ navItems, subtitle, contentMaxWidth = "max-w-3xl" }) {
  return (
    <div className="min-h-screen bg-navy md:flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-surface-border fixed h-full z-30">
        <div className="p-5 border-b border-surface-border">
          <h1 className="text-xl font-display font-semibold tracking-tight text-ink">
            Fidelx
          </h1>
          {subtitle && <p className="text-slate-muted text-xs mt-0.5">{subtitle}</p>}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive ? "bg-teal/10 text-teal" : "text-slate-muted hover:text-ink hover:bg-navy-light"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              <span className="flex-1">{label}</span>
              {!!badge && (
                <span className="bg-teal text-navy text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 min-h-screen overflow-y-auto pb-20 md:pb-0">
        <div className={clsx("mx-auto", contentMaxWidth)}>
          <Outlet />
        </div>
      </main>

      {/* Bottom tab bar — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-surface-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                "relative flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-150 min-w-0",
                isActive ? "text-teal" : "text-slate-muted"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={clsx("w-[22px] h-[22px] transition-transform duration-150", isActive && "scale-110")} strokeWidth={2} />
                    {!!badge && (
                      <span className="absolute -top-1 -right-1.5 bg-teal text-navy text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
