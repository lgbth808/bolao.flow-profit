import { AdminPanel } from "@/components/admin-panel";
import { getAdminPoolData } from "@/lib/pool-data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminPoolData();

  return <AdminPanel initialData={data} />;
}
