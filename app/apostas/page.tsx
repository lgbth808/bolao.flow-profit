import { PublicPool } from "@/components/public-pool";
import { getPublicPoolData } from "@/lib/pool-data";

export const dynamic = "force-dynamic";

export default async function BetsPage({
  searchParams
}: {
  searchParams?: { poolId?: string };
}) {
  const data = await getPublicPoolData(undefined, {
    poolId: searchParams?.poolId
  });

  return <PublicPool initialData={data} />;
}
