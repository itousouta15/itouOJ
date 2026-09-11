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
