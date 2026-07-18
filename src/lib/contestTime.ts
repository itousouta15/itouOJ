// 全站時間顯示固定用 Asia/Taipei（跟其他頁面 toLocaleString 的慣例一致），
// 這裡把比賽起訖時間的 <input type="datetime-local"> 字串跟 Date 互轉，
// 不依賴瀏覽器或伺服器主機的系統時區，避免兩邊時區不一致造成誤差。
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

export function toTaipeiInputValue(date: Date): string {
  return new Date(date.getTime() + TAIPEI_OFFSET_MS).toISOString().slice(0, 16);
}

export function fromTaipeiInputValue(value: string): string {
  return new Date(`${value}:00+08:00`).toISOString();
}
