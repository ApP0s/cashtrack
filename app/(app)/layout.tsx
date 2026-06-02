import { requireUser } from "@/lib/auth";
import { getTheme } from "@/lib/locale";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, theme] = await Promise.all([requireUser(), getTheme()]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar userName={user.name || user.email} theme={theme} />
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
    </div>
  );
}
