// OC 展示页的媒体读取工具（构建/请求时在 Node 端运行）。
// 读取 public/oc 下的图片与视频文件夹。
//
// 标题规则：只有文件名里含有【中文】时才显示标题，其余只显示画面本身。
//   想要标题就把文件命名成：  [序号_]中文_English.ext
//   例： 01_竹林温泉_Bamboo hot spring.jpg
//   普通相机文件名（IMG_xxxx、数字等）不会显示标题。
import fs from "node:fs";
import path from "node:path";

const OC_DIR = path.resolve("public/oc");
const IMG_RE = /\.(png|jpe?g|webp|gif|avif)$/i;
const VID_RE = /\.(mp4|webm|mov|m4v)$/i;

export type OcItem = {
	src: string;
	cap: string;
	en: string;
	type: "image" | "video";
};

function meta(file: string): { cap: string; en: string } {
	const noExt = file.replace(/\.[^.]+$/, ""); // 去扩展名
	const noOrder = noExt.replace(/^\d+[\s._-]+/, ""); // 去掉开头排序序号
	// 没有中文 → 视为普通文件名，不生成标题
	if (!/[一-鿿]/.test(noOrder)) return { cap: "", en: "" };
	const parts = noOrder.split("_");
	const cap = (parts[0] || "").trim();
	const en = parts.slice(1).join(" ").trim();
	return { cap, en };
}

/** 列出某个子文件夹（相对 public/oc）下的图片与视频，返回根绝对 URL（/oc/...）。 */
export function listDir(rel: string): OcItem[] {
	const dir = path.join(OC_DIR, rel);
	let files: string[] = [];
	try {
		files = fs.readdirSync(dir).filter((f) => IMG_RE.test(f) || VID_RE.test(f));
	} catch {
		/* 文件夹不存在时返回空数组 */
	}
	files.sort((a, b) => a.localeCompare(b, "zh", { numeric: true }));
	return files.map((f) => {
		const { cap, en } = meta(f);
		return {
			src: `/oc/${rel}/${encodeURIComponent(f)}`,
			cap,
			en,
			type: VID_RE.test(f) ? "video" : "image",
		};
	});
}

/** 取某个分类（art / fursuit）的精选、折叠与全部媒体。 */
export function getCategory(name: "art" | "fursuit"): {
	featured: OcItem[];
	more: OcItem[];
	all: OcItem[];
} {
	const featured = listDir(`${name}/featured`);
	const more = listDir(`${name}/more`);
	return { featured, more, all: [...featured, ...more] };
}
