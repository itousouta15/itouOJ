"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

const TARGET_SIZE = 256;

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    // 手機拍的 JPG 常有 EXIF 旋轉，from-image 讓瀏覽器先轉正再畫
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
}

// 先在瀏覽器把圖片置中裁成正方形並縮到 256px 再上傳：手機原圖動輒 5MB，
// 直接存進 SQLite 太浪費，站內也只需要顯示到 64px 左右。
async function resizeAvatar(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, TARGET_SIZE, TARGET_SIZE);
  bitmap.close();

  // WebP 可以保留透明度又比 PNG 小；不支援的瀏覽器退回 JPEG
  const webp = await canvasToBlob(canvas, "image/webp");
  if (webp) return webp;
  const jpeg = await canvasToBlob(canvas, "image/jpeg");
  if (jpeg) return jpeg;
  throw new Error("no blob");
}

export default function AvatarUploader({
  name,
  currentSrc,
  hasLocalAvatar,
}: {
  name: string;
  currentSrc: string | null;
  hasLocalAvatar: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // 清掉 value，這樣重選同一個檔案也會觸發 change
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("請選擇圖片檔案");
      return;
    }

    setError("");
    setBusy(true);
    try {
      const blob = await resizeAvatar(file);
      const form = new FormData();
      form.append(
        "avatar",
        new File([blob], "avatar", { type: blob.type || "image/webp" })
      );
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "上傳失敗");
        return;
      }
      router.refresh();
    } catch {
      setError("無法處理這張圖片，請換一張試試");
    } finally {
      setBusy(false);
    }
  }

  async function removeAvatar() {
    if (!confirm("確定要移除上傳的頭像嗎？")) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "移除失敗");
        return;
      }
      router.refresh();
    } catch {
      setError("移除失敗，請稍後再試");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={name} src={currentSrc} size={72} />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "處理中…" : "上傳新頭像"}
          </button>
          {hasLocalAvatar && (
            <button
              type="button"
              className="text-sm text-[#ff6b6b] hover:underline"
              disabled={busy}
              onClick={removeAvatar}
            >
              移除頭像
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-[#ff6b6b]">{error}</p>}
      <p className="mt-3 text-xs leading-relaxed text-mute">
        支援 JPG / PNG / WebP，會自動置中裁成正方形並縮圖；移除後會恢復成
        Google / Discord 的頭像或名字首字。
      </p>
    </div>
  );
}
