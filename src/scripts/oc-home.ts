type Cleanup = () => void;

const root = document.getElementById("rainple-root");

if (root) {
	const pageRoot = root;
	const cleanups: Cleanup[] = [];
	let messageTimer: ReturnType<typeof setTimeout> | undefined;

	applyTheme();
	installPseudoStyles();
	buildParticles();
	initReveal();
	initCardReveal();
	initNav();
	initParallax();
	initDialogs();
	initMessageForm();
	initPointerTrail();
	initImageProtection();

	window.addEventListener(
		"pagehide",
		() => {
			for (const cleanup of cleanups) cleanup();
			if (messageTimer) clearTimeout(messageTimer);
		},
		{ once: true },
	);

	function applyTheme() {
		const themes = {
			晴空: {
				grad: "linear-gradient(165deg,#cdeafb 0%,#e9f5fe 42%,#fdf2e0 100%)",
				accent: "#f3805a",
				deep: "#6fb8e8",
			},
			暮色: {
				grad: "linear-gradient(165deg,#dfe1fb 0%,#f1e6f6 45%,#fce3da 100%)",
				accent: "#e98aa8",
				deep: "#9a8fd6",
			},
			竹林: {
				grad: "linear-gradient(165deg,#d6efe0 0%,#eaf7ee 45%,#fdf6df 100%)",
				accent: "#5fae7a",
				deep: "#5aa6c0",
			},
		};
		const current = themes.晴空;
		pageRoot.style.setProperty(
			"--hero-grad",
			`radial-gradient(ellipse at 84% 12%,rgba(255,255,255,.86),transparent 31%),radial-gradient(ellipse at 10% 76%,rgba(255,224,157,.22),transparent 31%),${current.grad}`,
		);
		pageRoot.style.setProperty("--accent", current.accent);
		pageRoot.style.setProperty("--sky-deep", current.deep);
	}

	function installPseudoStyles() {
		const style = document.createElement("style");
		const rules = new Map<string, string>();
		let nextId = 0;

		pageRoot
			.querySelectorAll<HTMLElement>("[style-hover], [style-focus]")
			.forEach((element) => {
				for (const pseudo of ["hover", "focus"] as const) {
					const attribute = `style-${pseudo}`;
					const css = element.getAttribute(attribute);
					if (!css) continue;
					const key = `${pseudo}|${css}`;
					let className = rules.get(key);
					if (!className) {
						className = `scp${(nextId++).toString(36)}`;
						rules.set(key, className);
						style.textContent += `.${className}:${pseudo}{${css}}\n`;
					}
					element.classList.add(className);
					element.removeAttribute(attribute);
				}
			});

		if (style.textContent) document.head.appendChild(style);
	}

	function buildParticles() {
		const layer = pageRoot.querySelector<HTMLElement>("#particle-layer");
		if (!layer) return;
		layer.replaceChildren();

		for (let index = 0; index < 26; index += 1) {
			const particle = document.createElement("div");
			const left = Math.random() * 100;
			const size = 4 + Math.random() * 9;
			const duration = 9 + Math.random() * 14;
			const delay = -Math.random() * duration;
			particle.style.position = "absolute";
			particle.style.left = `${left}%`;
			particle.style.pointerEvents = "none";
			particle.style.top = `${Math.random() * 100}%`;
			particle.style.color = Math.random() > 0.5 ? "#f5d98a" : "#ffffff";
			particle.style.fontSize = `${size + 4}px`;
			particle.style.textShadow = "0 0 8px rgba(245,217,138,.8)";
			particle.textContent = "✦";
			particle.style.animation = `twinkleP ${2 + Math.random() * 3}s ease-in-out ${delay}s infinite`;
			layer.appendChild(particle);
		}
	}

	function initReveal() {
		const elements = [
			...pageRoot.querySelectorAll<HTMLElement>("[data-reveal]"),
		];
		elements.forEach((element, index) => {
			element.style.opacity = "0";
			element.style.transform = "translateY(64px) scale(.94)";
			element.style.transition =
				"opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1)";
			element.dataset._d = String((index % 4) * 90);
		});

		const reveal = (element: HTMLElement) => {
			if (element.dataset._shown) return;
			element.dataset._shown = "1";
			setTimeout(
				() => {
					element.style.opacity = "1";
					element.style.transform = "";
				},
				Number(element.dataset._d || 0),
			);
		};

		const checkInView = () => {
			const height = window.innerHeight || 800;
			for (const element of elements) {
				const rect = element.getBoundingClientRect();
				if (rect.top < height * 0.88 && rect.bottom > 0) reveal(element);
			}
		};

		checkInView();
		let observer: IntersectionObserver | undefined;
		try {
			observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (!entry.isIntersecting) continue;
						reveal(entry.target as HTMLElement);
						observer?.unobserve(entry.target);
					}
				},
				{ threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
			);
			for (const element of elements) {
				if (!element.dataset._shown) observer.observe(element);
			}
		} catch {
			// 滚动监听仍会作为旧浏览器的兜底。
		}

		window.addEventListener("scroll", checkInView, { passive: true });
		cleanups.push(() => {
			window.removeEventListener("scroll", checkInView);
			observer?.disconnect();
		});
	}

	function initCardReveal() {
		const cards = [
			...pageRoot.querySelectorAll<HTMLElement>("[data-card], [data-card-fig]"),
		];
		if (!cards.length) return;

		const groups = new Map<Element | null, HTMLElement[]>();
		for (const card of cards) {
			const list = groups.get(card.parentElement) ?? [];
			list.push(card);
			groups.set(card.parentElement, list);
		}
		for (const list of groups.values()) {
			list.forEach((card, index) => {
				card.dataset._cidx = String(index);
			});
		}

		for (const card of cards) {
			const isFigure = card.hasAttribute("data-card-fig");
			card.style.opacity = "0";
			if (isFigure) {
				card.style.filter = "blur(14px)";
				card.style.transform = "translateY(70px) scale(.9)";
			} else {
				card.style.transform = "translateY(72px) scale(.92)";
				card.style.transition =
					"opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1), box-shadow .25s ease";
			}
		}

		const reveal = (card: HTMLElement) => {
			if (card.dataset._cshown) return;
			card.dataset._cshown = "1";
			const index = Number.parseInt(card.dataset._cidx || "0", 10);
			const isFigure = card.hasAttribute("data-card-fig");
			setTimeout(() => {
				card.style.opacity = "1";
				if (isFigure) card.style.filter = "none";
				card.style.transform = "";
			}, Math.min(index, 9) * 90);
		};

		const checkInView = () => {
			const height = window.innerHeight || 800;
			for (const card of cards) {
				if (card.dataset._cshown) continue;
				const rect = card.getBoundingClientRect();
				if (rect.top < height * 0.88 && rect.bottom > 0) reveal(card);
			}
		};

		checkInView();
		let observer: IntersectionObserver | undefined;
		try {
			observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (!entry.isIntersecting) continue;
						reveal(entry.target as HTMLElement);
						observer?.unobserve(entry.target);
					}
				},
				{ threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
			);
			for (const card of cards) {
				if (!card.dataset._cshown) observer.observe(card);
			}
		} catch {
			// 滚动监听仍会作为旧浏览器的兜底。
		}

		window.addEventListener("scroll", checkInView, { passive: true });
		cleanups.push(() => {
			window.removeEventListener("scroll", checkInView);
			observer?.disconnect();
		});
	}

	function initNav() {
		const nav = document.getElementById("rp-nav");
		if (!nav) return;
		const onScroll = () => {
			if (window.scrollY > 40) {
				nav.style.background = "rgba(255,255,255,.82)";
				nav.style.backdropFilter = "blur(12px)";
				nav.style.boxShadow = "0 6px 24px rgba(76,130,170,.12)";
				nav.style.padding = "10px clamp(20px,5vw,64px)";
			} else {
				nav.style.background = "transparent";
				nav.style.backdropFilter = "none";
				nav.style.boxShadow = "none";
				nav.style.padding = "16px clamp(20px,5vw,64px)";
			}
		};
		window.addEventListener("scroll", onScroll);
		onScroll();
		cleanups.push(() => window.removeEventListener("scroll", onScroll));
	}

	function initParallax() {
		const blobOne = document.getElementById("rp-blob1");
		const blobTwo = document.getElementById("rp-blob2");
		const onScroll = () => {
			const offset = window.scrollY;
			if (offset > window.innerHeight) return;
			if (blobOne) blobOne.style.marginTop = `${offset * 0.12}px`;
			if (blobTwo) blobTwo.style.marginTop = `${-offset * 0.06}px`;
		};
		window.addEventListener("scroll", onScroll);
		cleanups.push(() => window.removeEventListener("scroll", onScroll));
	}

	function initDialogs() {
		const lightbox = document.getElementById("rp-lightbox");
		const lightboxImage = document.getElementById(
			"rp-lightbox-img",
		) as HTMLImageElement | null;
		const lightboxCaption = document.getElementById("rp-lightbox-cap");
		const lightboxEnglish = document.getElementById("rp-lightbox-en");
		const qrDialog = document.getElementById("rp-qr-dialog");
		const qrImage = document.getElementById(
			"rp-qr-img",
		) as HTMLImageElement | null;
		const qrCaption = document.getElementById("rp-qr-name");

		const closeLightbox = (event?: Event) => {
			event?.stopPropagation();
			if (lightbox) lightbox.hidden = true;
			document.body.style.overflow = "";
		};
		const closeQr = (event?: Event) => {
			event?.preventDefault();
			event?.stopPropagation();
			if (qrDialog) qrDialog.hidden = true;
			document.body.style.overflow = "";
		};

		for (const figure of pageRoot.querySelectorAll<HTMLElement>(
			"figure[data-card-fig]",
		)) {
			figure.addEventListener("click", () => {
				if (!lightbox || !lightboxImage) return;
				const caption = figure.dataset.cap || "";
				const english = figure.dataset.en || "";
				lightboxImage.src = figure.dataset.src || "";
				lightboxImage.alt = caption;
				if (lightboxCaption) lightboxCaption.textContent = caption;
				if (lightboxEnglish) lightboxEnglish.textContent = english;
				lightbox.hidden = false;
				document.body.style.overflow = "hidden";
			});
		}

		for (const card of pageRoot.querySelectorAll<HTMLElement>(
			"[data-qr-src]",
		)) {
			card.addEventListener("click", (event) => {
				event.preventDefault();
				if (!qrDialog || !qrImage) return;
				const name = card.dataset.qrName || "";
				qrImage.src = card.dataset.qrSrc || "";
				qrImage.alt = name;
				if (qrCaption) qrCaption.textContent = `${name} · 长按识别二维码`;
				qrDialog.hidden = false;
				document.body.style.overflow = "hidden";
			});
		}

		lightbox?.addEventListener("click", closeLightbox);
		lightbox
			?.querySelector<HTMLElement>("[data-dialog-close]")
			?.addEventListener("click", closeLightbox);
		qrDialog?.addEventListener("click", closeQr);
		qrDialog
			?.querySelector<HTMLElement>("[data-dialog-panel]")
			?.addEventListener("click", (event) => event.stopPropagation());
		qrDialog
			?.querySelector<HTMLElement>("[data-dialog-close]")
			?.addEventListener("click", closeQr);

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			if (qrDialog && !qrDialog.hidden) closeQr();
			if (lightbox && !lightbox.hidden) closeLightbox();
		};
		window.addEventListener("keydown", onKeyDown);
		cleanups.push(() => window.removeEventListener("keydown", onKeyDown));
	}

	function initMessageForm() {
		const form = document.getElementById(
			"rp-message-form",
		) as HTMLFormElement | null;
		const success = document.getElementById("rp-message-sent");
		if (!form || !success) return;
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			success.hidden = false;
			form.reset();
			if (messageTimer) clearTimeout(messageTimer);
			messageTimer = setTimeout(() => {
				success.hidden = true;
			}, 4000);
		});
	}

	function initPointerTrail() {
		let previous = 0;
		const onPointerMove = (event: PointerEvent) => {
			const now = Date.now();
			if (now - previous < 55) return;
			previous = now;
			const sparkle = document.createElement("div");
			sparkle.textContent = Math.random() > 0.72 ? "✿" : "✦";
			sparkle.style.cssText = `position:fixed; left:${event.clientX}px; top:${event.clientY}px; z-index:300; pointer-events:none; transform:translate(-50%,-50%); font-size:${10 + Math.random() * 10}px; color:${Math.random() > 0.5 ? "#f5d98a" : "#7fc6f0"}; text-shadow:0 0 6px rgba(255,255,255,.7);`;
			sparkle.style.animation = "pawFade .9s ease-out forwards";
			document.body.appendChild(sparkle);
			setTimeout(() => sparkle.remove(), 900);
		};
		window.addEventListener("pointermove", onPointerMove, { passive: true });
		cleanups.push(() =>
			window.removeEventListener("pointermove", onPointerMove),
		);
	}

	function initImageProtection() {
		const onContextMenu = (event: MouseEvent) => {
			if (
				event.target instanceof Element &&
				event.target.closest("img, video, figure")
			) {
				event.preventDefault();
			}
		};
		const onDragStart = (event: DragEvent) => {
			if (
				event.target instanceof Element &&
				event.target.closest("img, video")
			) {
				event.preventDefault();
			}
		};
		document.addEventListener("contextmenu", onContextMenu);
		document.addEventListener("dragstart", onDragStart);
		cleanups.push(() => {
			document.removeEventListener("contextmenu", onContextMenu);
			document.removeEventListener("dragstart", onDragStart);
		});
	}
}
