import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CheckInForm from "@/components/CheckInForm";
import CheckInHistory from "@/components/CheckInHistory";

export default async function CheckInPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  const todayCheckIn = await prisma.checkIn.findFirst({
    where: { userId, date: { gte: startOfDay, lte: endOfDay } },
  });

  const recentCheckIns = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 7,
  });

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/" className="text-indigo-500 text-sm mb-4 inline-block">
        ← Volver al Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-6">Check-in diario</h1>

      <CheckInForm
        today={
          todayCheckIn
            ? {
                energy: todayCheckIn.energy,
                mood: todayCheckIn.mood,
                stress: todayCheckIn.stress,
                sleep: todayCheckIn.sleep,
              }
            : undefined
        }
      />

      <CheckInHistory checkIns={recentCheckIns} />
    </main>
  );
}
