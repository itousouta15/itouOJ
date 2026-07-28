import { getSession } from "@/lib/auth";

// 目前登入者。收件程式用瀏覽器登入拿到 token 後，會先打這支確認 token 有效、
// 取得自己的帳號名稱，順便從回應的 Date 標頭校正時鐘。
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }
  return Response.json({
    userId: session.userId,
    username: session.username,
    role: session.role,
  });
}
