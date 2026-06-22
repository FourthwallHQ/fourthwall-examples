import { Dashboard } from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

/**
 * / — the links dashboard.
 *
 * A product-first links admin: every row is a real Fourthwall product the app
 * creates through the Add-a-product wizard. The brand is deliberately blank —
 * the channel-api integration, not the chrome, is the takeaway. The client
 * (Dashboard) only ever calls the app's own /api/* routes; the channel
 * credential lives server-side and is attached there.
 */
export default function DashboardPage() {
  return <Dashboard />;
}
