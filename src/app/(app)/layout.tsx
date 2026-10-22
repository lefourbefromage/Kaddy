import { RequireHousehold } from "@/components/RequireHousehold";
import { AppShell } from "@/components/shell/AppShell";

// Every screen of a signed-in household, inside the shared shell.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireHousehold>
      <AppShell>{children}</AppShell>
    </RequireHousehold>
  );
}
