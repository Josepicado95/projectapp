import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import DashboardBody from "@/components/DashboardBody";
import { getMoment } from "@/lib/theme";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const firstName = session.user.name?.split(" ")[0] ?? session.user.name;
  const initial = (session.user.name?.[0] ?? "?").toUpperCase();

  const reqHeaders = await headers();
  const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
    10
  );
  const theme = getMoment(localHour);

  return <DashboardBody theme={theme} firstName={firstName ?? ""} initial={initial} />;
}
