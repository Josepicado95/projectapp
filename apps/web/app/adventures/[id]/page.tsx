import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getRequestMoment } from "@/lib/get-request-moment";
import AdventureDetailBody from "@/components/AdventureDetailBody";

export default async function AdventureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const adventureId = Number(id);
  if (isNaN(adventureId)) notFound();

  const theme = await getRequestMoment();

  return <AdventureDetailBody adventureId={adventureId} momentKey={theme.key} />;
}
