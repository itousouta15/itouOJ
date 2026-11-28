// 用 sharp 把 itouOJ.svg 渲染成 Android 各密度的 launcher / round / foreground 圖示。
// 執行：node android/scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const resDir = join(repo, "android", "app", "src", "main", "res");

const DENSITIES = [
  { name: "mdpi", scale: 1 },
  { name: "hdpi", scale: 1.5 },
  { name: "xhdpi", scale: 2 },
  { name: "xxhdpi", scale: 3 },
  { name: "xxxhdpi", scale: 4 },
];

// 母檔 1024px
const master = await sharp(join(repo, "public", "brand", "itouOJ.svg")).resize(1024, 1024).png().toBuffer();

for (const d of DENSITIES) {
  const dir = join(resDir, `mipmap-${d.name}`);
  mkdirSync(dir, { recursive: true });

  const legacySize = Math.round(48 * d.scale);
  const fgCanvas = Math.round(108 * d.scale);
  const logoSize = Math.round(72 * d.scale); // 安全區 66.6%，四周留透明

  // 傳統 launcher / round：LOGO 直接填滿
  await sharp(master).resize(legacySize, legacySize).png().toFile(join(dir, "ic_launcher.png"));
  await sharp(master).resize(legacySize, legacySize).png().toFile(join(dir, "ic_launcher_round.png"));

  // adaptive foreground：LOGO 置中縮在安全區，透明背景
  const logo = await sharp(master).resize(logoSize, logoSize).png().toBuffer();
  const pad = Math.round((fgCanvas - logoSize) / 2);
  await sharp({
    create: {
      width: fgCanvas,
      height: fgCanvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, left: pad, top: pad }])
    .png()
    .toFile(join(dir, "ic_launcher_foreground.png"));

  console.log(`mipmap-${d.name}: launcher ${legacySize}px, foreground ${fgCanvas}px (logo ${logoSize}px)`);
}
console.log("done");
