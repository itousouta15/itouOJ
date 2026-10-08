// Node's native test runner, with the project's TypeScript aliases and Prisma
// generated imports resolved using the already-installed TypeScript compiler.
import { register } from "node:module";
register("./lib/ctf-test-hooks.mjs", import.meta.url);
