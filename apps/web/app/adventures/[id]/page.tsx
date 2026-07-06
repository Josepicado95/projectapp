import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getRequestMoment } from "@/lib/get-request-moment";
import AdventureDetailBody from "@/components/AdventureDetailBody";

export default async function AdventureDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hour?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const adventureId = Number(id);
  if (isNaN(adventureId)) notFound();

  const { hour } = await searchParams;
  const theme = await getRequestMoment(hour !== undefined ? parseInt(hour, 10) : undefined);

  return <AdventureDetailBody adventureId={adventureId} theme={theme} />;
}
