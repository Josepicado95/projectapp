import AuthCard from "@/components/AuthCard";
import { getRequestMoment } from "@/lib/get-request-moment";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hour?: string }>;
}) {
  const { hour } = await searchParams;
  const theme = await getRequestMoment(hour !== undefined ? parseInt(hour, 10) : undefined);

  return <AuthCard theme={theme} />;
}
