import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardBody from "@/components/DashboardBody";
import { getRequestMoment } from "@/lib/get-request-moment";

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const firstName = session.user.name?.split(" ")[0] ?? session.user.name;
  const initial = (session.user.name?.[0] ?? "?").toUpperCase();

  const theme = await getRequestMoment();

  return <DashboardBody theme={theme} firstName={firstName ?? ""} initial={initial} />;
}
