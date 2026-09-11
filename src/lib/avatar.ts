// 頭像網址解析：有本地上傳（avatarUpdatedAt 有值）就優先用站內 API，否則
// 用 Google/Discord 帶回來的 avatarUrl。查詢時只要 select avatarUpdatedAt
// 就能判斷，不用把 avatarData 這個 BLOB 一起撈出來。
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
