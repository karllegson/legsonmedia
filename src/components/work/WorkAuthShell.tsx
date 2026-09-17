import { BarChart3, ListChecks, Timer } from "lucide-react";

type WorkAuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function WorkAuthShell({ title, subtitle, children }: WorkAuthShellProps) {
  return (
    <div className="wk-auth">
      <aside className="wk-auth-aside">
        <div className="wk-auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" />
          <span>
            <span className="wk-auth-brand-name">Legson Media</span>
            <br />
            <span className="wk-auth-brand-sub">Work Portal</span>
          </span>
        </div>

        <div>
          <h2 className="wk-auth-headline">
            Hey team. <em>Sign in to get to work.</em>
          </h2>
          <p className="wk-auth-copy">
            Private portal for Legson Media — clock time, pick up your tasks, and
            keep client retainers on track.
          </p>

          <ul className="wk-auth-features">
            <li>
              <span className="wk-auth-feature-icon">
                <Timer size={15} strokeWidth={2} aria-hidden />
              </span>
              Clock in against the client you&apos;re working on
            </li>
            <li>
              <span className="wk-auth-feature-icon">
                <ListChecks size={15} strokeWidth={2} aria-hidden />
              </span>
              Your assigned tasks for the week
            </li>
            <li>
              <span className="wk-auth-feature-icon">
                <BarChart3 size={15} strokeWidth={2} aria-hidden />
              </span>
              Hours logged vs. each retainer
            </li>
          </ul>
        </div>

        <p className="wk-auth-foot">
          Legson Media team only &middot; Not a public product
        </p>
      </aside>

      <main className="wk-auth-panel">
        <div className="wk-auth-form">
          <div className="wk-auth-mobile-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" />
            <span>
              <span className="wk-auth-brand-name">Legson Media</span>
              <br />
              <span className="wk-topbar-eyebrow">Work Portal</span>
            </span>
          </div>

          <h1 className="wk-auth-title">{title}</h1>
          <p className="wk-auth-sub">{subtitle}</p>

          {children}
        </div>
      </main>
    </div>
  );
}
