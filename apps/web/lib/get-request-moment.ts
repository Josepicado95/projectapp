import { headers } from "next/headers";
import { getMoment, type MomentTheme } from "./theme";

export async function getRequestMoment(overrideHour?: number): Promise<MomentTheme> {
  if (
    process.env.NODE_ENV === "development" &&
    overrideHour !== undefined &&
    !Number.isNaN(overrideHour) &&
    overrideHour >= 0 &&
    overrideHour <= 23
  ) {
    return getMoment(overrideHour);
  }

  const reqHeaders = await headers();
  const tz = reqHeaders.get("x-vercel-ip-timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour = parseInt(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()),
    10
  );
  return getMoment(localHour);
}
