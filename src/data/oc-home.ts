export const facts = [
	{ k: "中文名 · Name", v: "雨枫" },
	{ k: "英文名 · Latin", v: "rainple" },
	{ k: "物种 · Species", v: "狼龙 Wolfdragon" },
	{ k: "配色 · Palette", v: "天蓝·雪白·奶黄" },
	{ k: "生日 · Birthday", v: "2026.3.1" },
	{ k: "喜欢 · Likes", v: "吃饭，睡觉，喝水" },
] as const;

export const palette = [
	{ name: "天蓝 Sky", hex: "#A9D9F5", use: "主体绒毛 / fur" },
	{ name: "雪白 Snow", hex: "#FFFFFF", use: "胸口与尾尖 / chest & tips" },
	{ name: "奶黄 Cream", hex: "#F5D98A", use: "龙角与肉垫 / horns & paws" },
	{ name: "腮红 Coral", hex: "#F3805A", use: "脸颊与点缀 / blush & accent" },
] as const;

export const features = [
	{
		t: "奶黄龙角",
		d: "额前两对小巧的龙角，奶黄渐变。",
		dot: "#F5D98A",
		glow: "rgba(245,217,138,.3)",
	},
	{
		t: "闪电耳纹",
		d: "耳侧一道金色闪电，情绪激动时会亮。",
		dot: "#F0C152",
		glow: "rgba(240,193,82,.3)",
	},
	{
		t: "蓬松多尾",
		d: "数条柔软的尾巴，尾尖渐变成蓝白。",
		dot: "#A9D9F5",
		glow: "rgba(169,217,245,.35)",
	},
	{
		t: "奶黄肉垫",
		d: "胖乎乎的爪垫，奶黄色软糯触感。",
		dot: "#FBE6BD",
		glow: "rgba(251,230,189,.4)",
	},
	{
		t: "漩涡纹路",
		d: "四肢与身侧的奶黄漩涡花纹。",
		dot: "#EFD08A",
		glow: "rgba(239,208,138,.3)",
	},
	{
		t: "珊瑚腮红",
		d: "圆圆的脸颊两团珊瑚色腮红。",
		dot: "#F3805A",
		glow: "rgba(243,128,90,.28)",
	},
] as const;

export const traits = [
	{ zh: "软萌", en: "SOFT" },
	{ zh: "好奇", en: "CURIOUS" },
	{ zh: "温柔", en: "GENTLE" },
	{ zh: "嘴馋", en: "FOODIE" },
	{ zh: "爱泡澡", en: "BATH LOVER" },
	{ zh: "黏人", en: "CLINGY" },
] as const;

export type SocialLink = {
	name: string;
	handle: string;
	url: string;
	color: string;
	isQr: boolean;
	iconSrc?: string;
	iconText?: string;
	iconColor?: string;
	tag?: string;
};

export const socials: readonly SocialLink[] = [
	{
		name: "Bilibili",
		handle: "@雨枫rainple",
		url: "https://space.bilibili.com/3494354408704722",
		color: "#FB7299",
		iconSrc: "/oc/icons/bilibili.svg",
		isQr: false,
	},
	{
		name: "QQ",
		handle: "@雨枫rainple · 点开扫码加我",
		url: "/oc/icons/qq.jpg",
		color: "#EAF3FF",
		iconSrc: "/oc/icons/qq.svg",
		isQr: true,
	},
	{
		name: "兽频道",
		handle: "fursuit.tv",
		url: "https://fursuit.tv/@juyanlanfeng",
		color: "#111111",
		iconText: "兽",
		iconColor: "#F5C846",
		isQr: false,
	},
	{
		name: "GitHub",
		handle: "@juyanlanfeng",
		url: "https://github.com/juyanlanfeng",
		color: "#181717",
		iconSrc: "/oc/icons/github.svg",
		tag: "龙会敲代码嗷~",
		isQr: false,
	},
	{
		name: "X",
		handle: "@保密",
		url: "https://www.bilibili.com/video/BV1GJ411x7h7/?spm_id_from=333.337.search-card.all.click&vd_source=4d62d1db2ffbd015fc2cf4d93ff88074",
		color: "#000000",
		iconSrc: "/oc/icons/x.svg",
		isQr: false,
	},
];
