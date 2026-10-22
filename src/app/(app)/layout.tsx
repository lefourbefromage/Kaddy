import { RequireHousehold } from "@/components/RequireHousehold";

// Every screen of a signed-in household. The shared shell (nav bars) arrives in step 3.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <RequireHousehold>{children}</RequireHousehold>;
}
