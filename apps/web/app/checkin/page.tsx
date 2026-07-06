import { redirect } from "next/navigation";
import { auth }     from "@/auth";
import CheckInBody  from "@/components/CheckInBody";
import { getRequestMoment } from "@/lib/get-request-moment";

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ hour?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { hour } = await searchParams;
  const theme = await getRequestMoment(hour !== undefined ? parseInt(hour, 10) : undefined);

  const userName = session.user.name ?? session.user.email ?? "tú";

  return <CheckInBody userName={userName} theme={theme} />;
}
