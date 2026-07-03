import { redirect } from "next/navigation";
import { auth }     from "@/auth";
import CheckInBody  from "@/components/CheckInBody";

export default async function CheckInPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userName = session.user.name ?? session.user.email ?? "tú";

  return <CheckInBody userName={userName} />;
}
