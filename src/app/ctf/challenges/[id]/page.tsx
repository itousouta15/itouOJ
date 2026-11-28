// Keep /ctf/<id> deep links working while modal navigation uses a scoped path.
export { default, generateMetadata } from "../../[id]/page";
export const dynamic = "force-dynamic";
