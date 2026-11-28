import { randomBytes } from "node:crypto";
import { deflateSync } from "node:zlib";
import JSZip from "jszip";

function newFlag() {
  return `flag{${randomBytes(8).toString("hex")}}`;
}

function attachment(filename, content) {
  return { filename, data: Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8") };
}

function pngChunk(type, data) {
  const name = Buffer.from(type, "ascii");
  let crc = 0xffffffff;
  for (const byte of Buffer.concat([name, data])) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, data.length + 8);
  return chunk;
}

function tinyPng() {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 2; // 8-bit RGB, one pixel, no interlace.
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(Buffer.from([0, 47, 72, 109]))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

export async function createBeginnerCtfChallenges() {
  const webFlag = newFlag();
  const cryptoFlag = newFlag();
  const reverseFlag = newFlag();
  const forensicsFlag = newFlag();
  const miscFlag = newFlag();
  const gateBytes = randomBytes(4);
  const gate = gateBytes.readUInt32LE();
  const pwnFlag = `flag{${Buffer.concat([Buffer.alloc(8, 0x41), gateBytes]).toString("hex")}}`;
  const mask = 0x37;
  const encoded = [...Buffer.from(reverseFlag)].map((byte, index) => ((byte ^ mask) + index) & 255).reverse();
  const zip = new JSZip();
  zip.file("tickets/03.txt", miscFlag.slice(14) + "\n");
  zip.file("tickets/01.txt", miscFlag.slice(0, 7) + "\n");
  zip.file("tickets/02.txt", miscFlag.slice(7, 14) + "\n");
  zip.file("README.txt", "票號由小到大排列，移除每張票最後的換行，再把內容接在一起。\n");

  return [
    {
      title: "[入門] 看不見的留言", category: "Web", flag: webFlag,
      description: `## 題目描述

社團做了一張歡迎網頁。畫面只顯示普通的招呼，但製作者說：「有一段留言留給願意多看一眼的人。」

下載 \`welcome.html\`，在自己的瀏覽器開啟，找出藏在網頁裡的 Flag。

## 作答方式

提交完整的 \`flag{...}\`，不要額外加引號。

## 小提示

瀏覽器顯示的是 HTML 渲染後的結果。試試「檢視網頁原始碼」，或直接用文字編輯器開啟附件。

**練習重點：** HTML 原始碼與註解。`,
      attachments: [attachment("welcome.html", `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><title>歡迎加入社團</title></head>
<body><h1>歡迎加入社團！</h1><p>今天的任務：多看一眼。</p>
<!-- 給好奇的人：${webFlag} -->
</body></html>
`)],
    },
    {
      title: "[入門] 只是換個外衣", category: "Crypto", flag: cryptoFlag,
      description: `## 題目描述

你收到一份只有一行文字的通訊紀錄。寄件者聲稱用了「很厲害的加密」，卻沒有提供任何密鑰。

附件 \`transmission.txt\` 是那份紀錄。觀察文字使用的字元，判斷它是什麼編碼，再還原原始訊息。

## 作答方式

解碼後會得到完整的 \`flag{...}\`，將它提交即可。

## 小提示

字元集中在大小寫英文字母、數字，偶爾會出現 \`+\`、\`/\`，結尾還可能有 \`=\`。編碼與需要密鑰的加密並不是同一件事。

**練習重點：** 辨識及還原 Base64。`,
      attachments: [attachment("transmission.txt", Buffer.from(cryptoFlag).toString("base64") + "\n")],
    },
    {
      title: "[入門] 把驗證器倒過來", category: "Reverse", flag: reverseFlag,
      description: `## 題目描述

這個小程式知道正確答案，卻只肯回覆「通過驗證」或「不正確」。它沒有把答案直接寫在原始碼裡，而是把每個位元組做了幾次變換。

下載 \`verifier.cjs\`，閱讀程式的驗證步驟，從 \`EXPECTED\` 還原能通過驗證的字串。

## 作答方式

還原後的字串就是完整 Flag。若電腦已安裝 Node.js，可以先測試：

~~~sh
node verifier.cjs "你的答案"
~~~

## 小提示

注意 XOR、索引偏移、8-bit 取餘數和反轉陣列的順序；還原時要把步驟倒過來。

**練習重點：** 閱讀驗證程式、逆向資料變換。`,
      attachments: [attachment("verifier.cjs", `// Node.js; no external packages required.
const EXPECTED = ${JSON.stringify(encoded)};
const MASK = 0x37;
const candidate = process.argv[2] ?? "";
const transformed = [...Buffer.from(candidate, "utf8")]
  .map((byte, index) => ((byte ^ MASK) + index) & 255)
  .reverse();
const correct = transformed.length === EXPECTED.length &&
  transformed.every((byte, index) => byte === EXPECTED[index]);
console.log(correct ? "通過驗證" : "不正確");
process.exitCode = correct ? 0 : 1;
`)],
    },
    {
      title: "[入門] 堆疊上的小端序", category: "Pwn", flag: pwnFlag,
      description: `## 題目描述

附件 \`lock.c\` 模擬一把有輸入長度漏洞的門鎖。結構裡有 8 bytes 的名字，後面緊接一個 32-bit 整數。程式把整個結構的長度當成輸入長度，讓後面的門鎖值也能被覆寫。

你的目標是在 **little-endian（小端序）** 環境下，組出剛好 12 bytes 的輸入：前 8 bytes 全是 ASCII 的 \`A\`，後 4 bytes 將門鎖值改成程式中的 \`UNLOCK\`。

## 作答方式

將這 12 bytes 依實際輸入順序轉成 **24 個小寫十六進位字元**，包在 \`flag{...}\` 裡提交。不要把十六進位字元本身當成程式的二進位輸入。

可以閱讀原始碼手算；也可以在自己的 Linux 小端序環境編譯，將二進位輸入送進程式驗證：

~~~sh
gcc -std=c11 -O0 -o lock lock.c
~~~

## 小提示

ASCII \`A\` 是 \`0x41\`。小端序會把整數的最低位元組放在最低位址。

**練習重點：** 緩衝區覆寫、結構排列與整數端序。`,
      attachments: [attachment("lock.c", `// Offline, little-endian teaching challenge.
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

struct Door { unsigned char name[8]; uint32_t gate; };
_Static_assert(sizeof(struct Door) == 12, "This exercise expects a 12-byte structure");
static const uint32_t UNLOCK = 0x${gate.toString(16).padStart(8, "0")};

int main(void) {
  struct Door door;
  memset(&door, 0, sizeof door);
  // Bug: the read includes the gate after the eight-byte name.
  ssize_t received = read(STDIN_FILENO, door.name, sizeof door);
  if (received != 12) { puts("Exactly 12 binary bytes required"); return 1; }
  for (int i = 0; i < 8; i++) if (door.name[i] != 'A') { puts("Name must be eight A bytes"); return 1; }
  if (door.gate != UNLOCK) { puts("Locked"); return 1; }
  const unsigned char *bytes = (const unsigned char *)&door;
  printf("flag{");
  for (unsigned i = 0; i < sizeof door; i++) printf("%02x", bytes[i]);
  puts("}");
  return 0;
}
`)],
    },
    {
      title: "[入門] 圖片結束之後", category: "Forensics", flag: forensicsFlag,
      description: `## 題目描述

你拿到一張非常小的 PNG 圖片。圖片檢視器可以正常開啟，但檔案大小似乎比只存一個像素還要多一點。

下載 \`souvenir.png\`，檢查圖片檔的完整內容，找出被附加的訊息。

## 作答方式

提交檔案中找到的完整 \`flag{...}\`。

## 小提示

圖片檢視器不一定會顯示檔案裡所有的位元組。可以用十六進位檢視器或 \`strings\` 查看可讀字串；也可以查查 PNG 的 \`IEND\` 區塊代表什麼。

**練習重點：** 檔案格式、可讀字串與檔尾附加資料。`,
      attachments: [attachment("souvenir.png", Buffer.concat([tinyPng(), Buffer.from(`\nanalyst-note: ${forensicsFlag}\n`)]))],
    },
    {
      title: "[入門] 把票據排回原位", category: "Misc", flag: miscFlag,
      description: `## 題目描述

一張通關票被拆成三段，分別放進壓縮檔裡。整理的人把檔案放入壓縮檔的順序打亂了，但還好票號還在。

下載並解開 \`tickets.zip\`，按照票號把三段內容拼回去。

## 作答方式

移除每個文字檔最後的換行，再將內容直接連接；拼好的字串就是完整 Flag。段落之間不要加空白或換行。

## 小提示

依 \`01\`、\`02\`、\`03\` 的票號排序，而不是依壓縮檔中的儲存順序。

**練習重點：** 壓縮檔解包、檔案排序與字串重組。`,
      attachments: [attachment("tickets.zip", await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }))],
    },
  ].map((challenge) => ({ ...challenge, difficulty: "easy", points: 100 }));
}
