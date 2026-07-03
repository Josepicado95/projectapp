import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { getMoment } from "@/lib/theme";
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

  const reqHeaders = await headers();
  const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
    10,
  );
  const theme = getMoment(localHour);

  return <AdventureDetailBody adventureId={adventureId} momentKey={theme.key} />;
}
