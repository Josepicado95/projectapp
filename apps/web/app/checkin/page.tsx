import { redirect } from "next/navigation";
import { auth }     from "@/auth";
import { prisma }   from "@/lib/prisma";
import CheckInBody  from "@/components/CheckInBody";

export default async function CheckInPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);

  const startOfDay = new Date(); startOfDay.setUTCHours(0,  0,  0,   0);
  const endOfDay   = new Date(); endOfDay.setUTCHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [todayCheckIn, recentCheckIns] = await Promise.all([
    prisma.checkIn.findFirst({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
      select: { energy: true, mood: true, stress: true, sleep: true },
    }),
    prisma.checkIn.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: "asc" },
      select: { date: true, energy: true, mood: true, stress: true, sleep: true },
    }),
  ]);

  const recentWeek = recentCheckIns.map(c => ({
    date:   c.date.toISOString().slice(0, 10),
    energy: c.energy,
    mood:   c.mood,
    stress: c.stress,
    sleep:  c.sleep,
  }));

  const userName = session.user.name ?? session.user.email ?? "tú";

  return (
    <CheckInBody
      today={todayCheckIn ?? undefined}
      recentWeek={recentWeek}
      userName={userName}
    />
  );
}
