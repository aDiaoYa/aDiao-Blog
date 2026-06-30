/**
 * 将 public/images/ 下的 PNG 转换为 WebP，大幅减小体积。
 * 要求：sharp 已作为 next 的依赖安装。
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const IMAGES_DIR = path.join(__dirname, "..", "public", "images");
const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith(".png"));

async function main() {
  for (const file of files) {
    const input = path.join(IMAGES_DIR, file);
    const output = path.join(IMAGES_DIR, file.replace(/\.png$/, ".webp"));
    const { size: pngSize } = fs.statSync(input);
    await sharp(input)
      .webp({ quality: 85 })
      .toFile(output);
    const { size: webpSize } = fs.statSync(output);
    const pct = ((1 - webpSize / pngSize) * 100).toFixed(1);
    console.log(`${file} → ${file.replace('.png', '.webp')}  ${(pngSize / 1024).toFixed(1)}KB → ${(webpSize / 1024).toFixed(1)}KB (${pct}%)`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
