// 比賽時間的 <input type="datetime-local"> 字串與 Date 互轉，固定用
// Asia/Taipei，不依賴瀏覽器或主機的系統時區。
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

export function toTaipeiInputValue(date: Date): string {
  return new Date(date.getTime() + TAIPEI_OFFSET_MS).toISOString().slice(0, 16);
}

export function fromTaipeiInputValue(value: string): string {
  return new Date(`${value}:00+08:00`).toISOString();
}
