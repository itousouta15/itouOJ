import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfCreateSchema } from "@/lib/ctfSchema";
import { hashCtfFlag } from "@/lib/ctfFlag";
import { encryptCtfLabFlag } from "@/lib/ctfLabFlag";
import { CTF_METADATA_MAX_BYTES, readCtfJson, ctfErrorResponse } from "@/lib/ctfAttachment";
import { getCtfChallenges } from "@/lib/ctf";

// 管理後台（itouOJ-admin）讀取 CTF 題目列表（含隱藏題）。
export async function GET(request: Request) {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const raw = Number(new URL(request.url).searchParams.get("page"));
  const page = Number.isSafeInteger(raw) && raw > 0 && raw <= 50000 ? raw : 1;
  const { challenges, total, page: current } = await getCtfChallenges({}, page);
  return Response.json(
    {
      total,
      page: current,
      challenges: challenges.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        points: c.points,
        isPublic: c.isPublic,
        solveCount: c._count.solves,
        attachmentCount: c._count.attachments,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  try {
    const parsed = ctfCreateSchema.safeParse(await readCtfJson(request, CTF_METADATA_MAX_BYTES));
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const { flag, ...data } = parsed.data;
    const hashed = await hashCtfFlag(flag);
    const challenge = await prisma.ctfChallenge.create({
      data: { ...data, ...hashed, labFlagCiphertext: data.labType ? encryptCtfLabFlag(flag, hashed.flagHash) : null }, select: { id: true },
    });
    return Response.json(challenge, { status: 201 });
  } catch (error) { return ctfErrorResponse(error); }
}
