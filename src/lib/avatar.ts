// 頭像網址解析：有本地上傳（avatarUpdatedAt）就用站內 API，否則用
// Google/Discord 的 avatarUrl；查詢時只要 select avatarUpdatedAt，不用撈 BLOB。
export interface AvatarSource {
  username: string;
  avatarUrl?: string | null;
  avatarUpdatedAt?: Date | null;
}

export function avatarSrc(user: AvatarSource): string | null {
  if (user.avatarUpdatedAt) {
    return `/api/users/${encodeURIComponent(user.username)}/avatar?v=${user.avatarUpdatedAt.getTime()}`;
  }
  return user.avatarUrl ?? null;
}

// 檔頭 magic bytes 驗證：file.type 只是客戶端自己填的字串，不能當作
// 「內容真的是圖片」的證據。認不得就回 null，呼叫端拒絕上傳。
export function sniffImageMime(data: Uint8Array): string | null {
  if (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  ) {
    return "image/png";
  }
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    data.length >= 12 &&
    data[0] === 0x52 && // R
    data[1] === 0x49 && // I
    data[2] === 0x46 && // F
    data[3] === 0x46 && // F
    data[8] === 0x57 && // W
    data[9] === 0x45 && // E
    data[10] === 0x42 && // B
    data[11] === 0x50 // P
  ) {
    return "image/webp";
  }
  return null;
}
