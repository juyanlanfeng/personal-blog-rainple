/**
 * 构建时水印脚本 —— 对 dist/oc 下的相册图片批量加平铺半透明水印。
 *
 * 在 `npm run build` 的最后一步自动运行（见 package.json 的 build 命令）。
 * 只修改构建产物 dist/，public/ 里的原图完全不动。
 *
 * 可调参数都在下面的「配置」区。
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

// ---------- 配置 ----------
const TEXT = "雨枫 rainple"; // 水印文字（若构建后中文缺失/方块，改成纯英文最稳）
const FONT = "'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif"; // 覆盖 Win/mac/Linux 的中文字体
const OPACITY = 0.25; // 文字不透明度 0~1
const ANGLE = -28; // 平铺倾斜角度
const ROOT = path.resolve("dist/oc");
const DIRS = ["art", "fursuit"]; // 只处理这两个相册目录
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]); // gif/视频跳过
const CONCURRENCY = 4;
// --------------------------

function esc(s) {
	return s
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

function* walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(p);
		else if (EXTS.has(path.extname(entry.name).toLowerCase())) yield p;
	}
}

async function watermarkOne(file) {
	const meta = await sharp(file).metadata();
	let { width: w, height: h } = meta;
	if (!w || !h) {
		console.warn(`  跳过（读不到尺寸）: ${file}`);
		return false;
	}
	// EXIF 旋转会交换宽高，.rotate() 归一化后按交换值计算
	if (meta.orientation && meta.orientation >= 5) [w, h] = [h, w];

	const fontSize = Math.max(18, Math.round(w / 26));
	const tileW = fontSize * (TEXT.length + 6);
	const tileH = fontSize * 6;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
	<defs><pattern id="wm" width="${tileW}" height="${tileH}" patternUnits="userSpaceOnUse" patternTransform="rotate(${ANGLE})">
		<text x="0" y="${Math.round(tileH / 2)}" font-family="${FONT.replaceAll("'", "&#39;")}" font-size="${fontSize}" font-weight="600"
			fill="#ffffff" fill-opacity="${OPACITY}" stroke="#000000" stroke-opacity="${OPACITY * 0.4}" stroke-width="1">${esc(TEXT)}</text>
	</pattern></defs>
	<rect width="100%" height="100%" fill="url(#wm)"/>
</svg>`;

	let pipeline = sharp(file)
		.rotate()
		.composite([{ input: Buffer.from(svg) }]);
	const ext = path.extname(file).toLowerCase();
	if (ext === ".jpg" || ext === ".jpeg") pipeline = pipeline.jpeg({ quality: 90 });
	else if (ext === ".webp") pipeline = pipeline.webp({ quality: 90 });

	const buf = await pipeline.toBuffer();
	fs.writeFileSync(file, buf);
	return true;
}

async function main() {
	const files = [];
	for (const d of DIRS) {
		const dir = path.join(ROOT, d);
		if (fs.existsSync(dir)) files.push(...walk(dir));
	}
	if (files.length === 0) {
		console.log("watermark: dist/oc 下没有找到图片，跳过。");
		return;
	}
	console.log(`watermark: 开始处理 ${files.length} 张图片…`);
	let done = 0;
	let ok = 0;
	let failed = 0;
	const queue = [...files];
	async function worker() {
		while (queue.length) {
			const f = queue.shift();
			try {
				if (await watermarkOne(f)) ok++;
			} catch (err) {
				failed++;
				console.warn(`  失败: ${f} → ${err.message}`);
			}
			done++;
			if (done % 50 === 0) console.log(`  进度 ${done}/${files.length}`);
		}
	}
	await Promise.all(Array.from({ length: CONCURRENCY }, worker));
	console.log(`watermark: 加水印 ${ok}/${files.length}${failed ? `（失败 ${failed}）` : ""}`);
}

main().catch((err) => {
	console.error("watermark: 出错", err);
	process.exit(1);
});
