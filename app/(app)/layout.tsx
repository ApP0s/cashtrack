import { requireUser } from "@/lib/auth";
import { getTheme } from "@/lib/locale";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { TimezoneSync } from "@/components/timezone-sync";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, theme] = await Promise.all([requireUser(), getTheme()]);
  const userName = user.name || user.email;

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Sidebar userName={userName} theme={theme} />
      {/* pb on phones keeps content clear of the fixed bottom tab bar */}
      <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:p-8">
        {children}
      </main>
      <MobileNav userName={userName} />
      <TimezoneSync />
    </div>
  );
}
