import { AppShell } from "./AppShell";

/** Every signed-in page shares the sidebar shell. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <AppShell>{children}</AppShell>;
}
