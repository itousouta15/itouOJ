import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sniffImageMime } from "@/lib/avatar";

// 前端已把圖片裁成正方形並縮到 256px，正常只有幾十 KB；1MB 是很寬的保險。
const MAX_BYTES = 1024 * 1024;

// 上傳／更換本地上傳的頭像（multipart/form-data，欄位名稱 avatar）。
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("avatar");
  if (!(file instanceof File)) {
    return Response.json({ error: "請選擇圖片" }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "圖片是空的" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "圖片太大，請選擇較小的檔案" },
      { status: 400 }
    );
  }

  const data = new Uint8Array(await file.arrayBuffer());
  // 以實際內容判斷型別，不信 file.type；存下來的 mime 也要用偵測結果，
  // 否則之後回應的 Content-Type 會跟著客戶端亂填的值走。
  const mime = sniffImageMime(data);
  if (!mime) {
    return Response.json(
      { error: "只支援 WebP / JPEG / PNG 圖片" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      avatarData: data,
      avatarMime: mime,
      avatarUpdatedAt: new Date(),
    },
  });
  return Response.json({ ok: true });
}

// 移除本地上傳的頭像，之後會退回 Google/Discord 的頭像或名字首字。
export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }
  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarData: null, avatarMime: null, avatarUpdatedAt: null },
  });
  return Response.json({ ok: true });
}
