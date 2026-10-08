import { prisma } from "../src/lib/db.ts";
import { submitCtfAttempt } from "../src/lib/ctfAttempt.ts";

process.send("ready");
process.once("message", async ({ userId, challengeId, flag }) => {
  try { process.send({ result: await submitCtfAttempt(prisma, userId, challengeId, flag) }); }
  catch (error) { process.send({ error: error.message, code: error.code }); }
  finally { await prisma.$disconnect(); process.disconnect(); }
});
