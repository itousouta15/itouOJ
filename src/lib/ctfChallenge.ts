import { cache } from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfPublicSelect } from "@/lib/ctf";
import { ctfIdSchema } from "@/lib/ctfSchema";

// Both the standalone page and intercepted modal use the same authorized,
// explicitly selected data. Never serialize the complete challenge model.
export const getCtfChallenge = cache(async (rawId: string) => {
  const id = ctfIdSchema.safeParse(rawId);
  if (!id.success) return null;
  const session = await getSession();
  const challenge = await prisma.ctfChallenge.findFirst({
    where: { id: id.data, ...(session?.role === "ADMIN" ? {} : { isPublic: true }) },
    select: {
      ...ctfPublicSelect,
      _count: { select: { solves: true } },
      attachments: { select: { id: true, filename: true, sizeBytes: true }, orderBy: { id: "asc" } },
      solves: { where: { userId: session?.userId ?? "" }, select: { solvedAt: true } },
    },
  });
  return challenge ? { challenge, session } : null;
});

export type CtfChallengeDetail = NonNullable<Awaited<ReturnType<typeof getCtfChallenge>>>;
