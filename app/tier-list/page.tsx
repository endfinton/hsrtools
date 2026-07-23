import { auth } from "../../auth";
import { getTierListSnapshot } from "../../src/features/tier-list/db";
import { TierList } from "../../src/features/tier-list/tier-list";

export default async function TierListPage() {
  const [session, snapshot] = await Promise.all([auth(), getTierListSnapshot()]);

  return <TierList initialSnapshot={snapshot} isAdmin={Boolean(session?.user)} />;
}
