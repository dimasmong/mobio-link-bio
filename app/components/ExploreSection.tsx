import React, { useState, useEffect, useMemo, useRef } from "react";
import type { ExploreConfig, ExploreItem, Language, ExplorePhoto } from "../data/profile";
import {
	CodeIcon,
	MusicIcon,
	GamepadIcon,
	BookIcon,
	FilmIcon,
	ImageIcon,
	ExternalLinkIcon,
	CloseIcon,
	SparklesIcon,
	CompassIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "./Icons";

interface ExploreSectionProps {
	config: ExploreConfig;
	lang: Language;
}

export function ExploreImageThumbnail({
	src,
	alt,
	className = "w-full h-full object-cover",
	aspectRatioClass = "aspect-[4/3]",
}: {
	src: string;
	alt: string;
	className?: string;
	aspectRatioClass?: string;
}) {
	const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

	return (
		<div className={`relative ${aspectRatioClass} w-full overflow-hidden bg-slate-900/10 dark:bg-slate-900/40`}>
			{/* Skeleton Pulse Loading State */}
			{status === "loading" && (
				<div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200/50 via-slate-100/70 to-slate-200/50 dark:from-slate-800/60 dark:via-slate-700/50 dark:to-slate-800/60" />
			)}

			{/* Actual Image with smooth fade-in */}
			<img
				src={src}
				alt={alt}
				loading="lazy"
				onLoad={() => setStatus("loaded")}
				onError={() => setStatus("error")}
				className={`${className} transition-opacity duration-500 ${
					status === "loaded" ? "opacity-100" : "opacity-0"
				}`}
			/>

			{/* Graceful Liquid Glass Error Fallback (No permanent blank/broken grey box) */}
			{status === "error" && (
				<div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-violet-500/10 via-[var(--glass-surface-primary)] to-pink-500/10 backdrop-blur-md">
					<div className="w-10 h-10 rounded-full bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-specular)] flex items-center justify-center mb-2 text-theme-muted shadow-sm">
						<ImageIcon className="w-5 h-5 text-[var(--accent-color)]" />
					</div>
					<span className="text-xs font-semibold text-theme-secondary line-clamp-1">{alt}</span>
				</div>
			)}
		</div>
	);
}

function getExploreTypeIcon(type: string) {
	switch (type) {
		case "project":
			return <CodeIcon className="w-4 h-4 text-violet-600" />;
		case "gallery":
		case "image":
			return <ImageIcon className="w-4 h-4 text-pink-600" />;
		case "music":
			return <MusicIcon className="w-4 h-4 text-emerald-600" />;
		case "game":
			return <GamepadIcon className="w-4 h-4 text-amber-600" />;
		case "review":
		case "book":
			return <BookIcon className="w-4 h-4 text-sky-600" />;
		case "video":
			return <FilmIcon className="w-4 h-4 text-purple-600" />;
		case "link":
			return <ExternalLinkIcon className="w-4 h-4 text-blue-600" />;
		case "note":
		case "custom":
		default:
			return <SparklesIcon className="w-4 h-4 text-violet-600" />;
	}
}

function getCategoryLabel(catKey: string, lang: Language): string {
	if (catKey === "all") return lang === "id" ? "Semua" : "All";
	if (catKey === "work") return lang === "id" ? "Karya" : "Work";
	if (catKey === "creative") return lang === "id" ? "Kreatif" : "Creative";
	if (catKey === "personal") return lang === "id" ? "Pribadi" : "Personal";
	if (catKey === "tech") return lang === "id" ? "Teknologi" : "Tech";
	if (catKey === "photos") return lang === "id" ? "Foto" : "Photos";
	return catKey.charAt(0).toUpperCase() + catKey.slice(1);
}

export function ExploreSection({ config, lang }: ExploreSectionProps) {
	const [activeLightboxItem, setActiveLightboxItem] = useState<ExploreItem | null>(null);
	const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
	const touchStartX = useRef<number | null>(null);

	// Extract single-tier custom categories (No "Semua / All" filter)
	const displayCategories = useMemo(() => {
		const result: { id: string; name: { id: string; en: string }; icon?: string; color?: string }[] = [];

		if (config.categories && config.categories.length > 0) {
			config.categories
				.filter((c) => c.isEnabled !== false)
				.forEach((c) => {
					result.push({
						id: c.id,
						name: c.name,
						icon: c.icon,
						color: c.color,
					});
				});
		} else {
			// Fallback: extract unique categories from items (excluding 'all')
			const seen = new Set<string>();
			(config.items || []).forEach((item) => {
				const cat = item.category?.trim();
				if (cat && cat !== "all" && !seen.has(cat)) {
					seen.add(cat);
					result.push({
						id: cat,
						name: {
							id: getCategoryLabel(cat, "id"),
							en: getCategoryLabel(cat, "en"),
						},
					});
				}
			});
		}

		// Legacy item safety: Check if there are active items with category === "all" or uncategorized that don't match any category in `result`
		const resultIds = new Set(result.map((r) => r.id));
		const hasOrphanItems = (config.items || []).some(
			(item) => !item.category || item.category === "all" || !resultIds.has(item.category)
		);
		if (hasOrphanItems) {
			result.push({
				id: "uncategorized",
				name: {
					id: "Lainnya",
					en: "Other",
				},
				icon: "folder",
			});
		}

		return result;
	}, [config.categories, config.items]);

	// Default to the first available enabled category
	const [activeCategory, setActiveCategory] = useState<string>(() => {
		return displayCategories[0]?.id || "";
	});

	// If activeCategory is not in displayCategories or empty, automatically select the first enabled category
	useEffect(() => {
		if (displayCategories.length > 0 && !displayCategories.some((c) => c.id === activeCategory)) {
			setActiveCategory(displayCategories[0].id);
		}
	}, [displayCategories, activeCategory]);

	// Filter items strictly by activeCategory
	const filteredItems = useMemo(() => {
		if (!activeCategory) return [];
		return (config.items || []).filter((item) => {
			if (activeCategory === "uncategorized") {
				const knownCategoryIds = new Set(
					(config.categories || []).filter((c) => c.isEnabled !== false).map((c) => c.id)
				);
				return !item.category || item.category === "all" || !knownCategoryIds.has(item.category);
			}
			return (item.category || "") === activeCategory;
		});
	}, [config.items, activeCategory, config.categories]);

	// Slides for active lightbox item
	const slides: ExplorePhoto[] = useMemo(() => {
		if (!activeLightboxItem) return [];
		if (activeLightboxItem.metadata?.photos && activeLightboxItem.metadata.photos.length > 0) {
			return activeLightboxItem.metadata.photos;
		}
		if (activeLightboxItem.coverImage) {
			return [{ url: activeLightboxItem.coverImage, caption: activeLightboxItem.description?.[lang] || "" }];
		}
		return [];
	}, [activeLightboxItem, lang]);

	const goToPrevSlide = () => {
		if (slides.length <= 1) return;
		setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
	};

	const goToNextSlide = () => {
		if (slides.length <= 1) return;
		setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
	};

	// Keyboard accessibility: Escape to close, ArrowLeft / ArrowRight to navigate slides
	useEffect(() => {
		if (!activeLightboxItem) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setActiveLightboxItem(null);
			} else if (e.key === "ArrowLeft") {
				goToPrevSlide();
			} else if (e.key === "ArrowRight") {
				goToNextSlide();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activeLightboxItem, slides.length]);

	if (!config.enabled) {
		return null;
	}

	const hasItems = config.items && config.items.length > 0;

	return (
		<section
			id="explore"
			aria-labelledby="explore-heading"
			className="w-full my-4 sm:my-6"
		>
			{/* Section Header */}
			<div className="flex flex-col items-center text-center mb-5 px-2">
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-theme-accent-subtle border mb-2">
					<CompassIcon className="w-3.5 h-3.5" />
					<h2 id="explore-heading">{config.title[lang]}</h2>
				</div>
				{config.description &&
					config.description[lang]?.trim() &&
					!config.description[lang].toLowerCase().includes("kumpulan proyek terpilih") &&
					!config.description[lang].toLowerCase().includes("selected showcase of projects") && (
					<p className="text-xs sm:text-sm text-theme-muted max-w-md">
						{config.description[lang]}
					</p>
				)}
			</div>

			{/* Single-Tier Category Filter Pills (Phase 2) */}
			{hasItems && displayCategories.length > 1 && (
				<div className="mb-6 flex justify-center w-full">
					<div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 px-1 no-scrollbar scroll-smooth">
						{displayCategories.map((cat) => {
							const isCatActive = activeCategory === cat.id;
							return (
								<button
									key={cat.id}
									type="button"
									onClick={() => setActiveCategory(cat.id)}
									className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] ${
										isCatActive
											? "bg-[var(--accent-color)] text-[var(--accent-foreground)] shadow-sm font-bold scale-102"
											: "glass-liquid-secondary text-theme-secondary hover:text-theme-primary hover:bg-[var(--glass-surface-hover)]"
									}`}
								>
									{cat.color && (
										<span
											className="w-2 h-2 rounded-full shrink-0"
											style={{ backgroundColor: isCatActive ? "currentColor" : cat.color }}
										/>
									)}
									<span>{cat.name[lang]}</span>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{hasItems ? (
				filteredItems.length > 0 ? (
					/* Modular Content Grid */
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{filteredItems.map((item) => {
						const photosCount = item.metadata?.photos?.length || 1;
						const isMultiPhoto = item.type === "gallery" && photosCount > 1;

						// 1. Photo / Gallery / Artwork Card
						if ((item.type === "gallery" || item.type === "image") && item.coverImage) {
							return (
								<div
									key={item.id}
									onClick={() => {
										setActiveLightboxItem(item);
										setCurrentSlideIndex(0);
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											setActiveLightboxItem(item);
											setCurrentSlideIndex(0);
										}
									}}
									tabIndex={0}
									role="button"
									aria-label={`Lihat ${item.title[lang]}`}
									className="glass-liquid-card rounded-2xl overflow-hidden group cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] relative"
								>
									<div className="relative aspect-[4/3] w-full overflow-hidden">
										<ExploreImageThumbnail
											src={item.coverImage}
											alt={item.title[lang]}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

										{/* Top Badges */}
										<div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/90 text-slate-800 shadow-2xs backdrop-blur-md">
												{getExploreTypeIcon(item.type)}
												<span>{item.badge ? item.badge[lang] : (item.type === "gallery" ? "Gallery" : "Photo")}</span>
											</span>

											{/* Multi-Photo Indicator Badge */}
											{isMultiPhoto && (
												<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-950/75 text-white/95 border border-white/20 backdrop-blur-md shadow-md">
													<ImageIcon className="w-3.5 h-3.5 text-pink-400" />
													<span>{photosCount}</span>
												</span>
											)}
										</div>

										{/* Bottom Titles */}
										<div className="absolute bottom-3 left-3 right-3 text-white">
											<h3 className="text-sm sm:text-base font-bold leading-snug drop-shadow-xs">
												{item.title[lang]}
											</h3>
											{item.subtitle && (
												<p className="text-xs text-white/80 line-clamp-1 mt-0.5">
													{item.subtitle[lang]}
												</p>
											)}
										</div>
									</div>
								</div>
							);
						}

						// 2. Video Card
						if (item.type === "video") {
							return (
								<a
									key={item.id}
									href={item.url || "#"}
									target={item.url ? "_blank" : undefined}
									rel={item.url ? "noopener noreferrer" : undefined}
									className="glass-liquid-card rounded-2xl overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] text-left block"
								>
									{item.coverImage ? (
										<div className="relative aspect-video w-full overflow-hidden bg-slate-900">
											<ExploreImageThumbnail
												src={item.coverImage}
												alt={item.title[lang]}
												aspectRatioClass="aspect-video"
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
											<div className="absolute inset-0 flex items-center justify-center">
												<div className="w-12 h-12 rounded-full bg-white/90 text-purple-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
													<FilmIcon className="w-6 h-6 ml-0.5" />
												</div>
											</div>
											<div className="absolute top-3 left-3">
												<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/90 text-slate-800 shadow-2xs backdrop-blur-md">
													<FilmIcon className="w-3.5 h-3.5 text-purple-600" />
													<span>{item.badge ? item.badge[lang] : "Video"}</span>
												</span>
											</div>
										</div>
									) : (
										<div className="p-5 pb-3">
											<div className="flex items-center gap-1.5 mb-2">
												<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/80 text-purple-700 border border-purple-200/50">
													<FilmIcon className="w-3.5 h-3.5" />
													<span>{item.badge ? item.badge[lang] : "Video"}</span>
												</span>
											</div>
										</div>
									)}
									<div className="p-5 pt-3">
										<h3 className="text-base font-bold text-theme-primary group-hover:text-purple-700 transition-colors leading-snug mb-1">
											{item.title[lang]}
										</h3>
										{item.subtitle && (
											<p className="text-xs text-purple-600 font-medium mb-2">
												{item.subtitle[lang]}
											</p>
										)}
										{item.description && (
											<p className="text-xs sm:text-sm text-theme-secondary leading-relaxed font-normal">
												{item.description[lang]}
											</p>
										)}
									</div>
								</a>
							);
						}

						// 3. Game / Interactive Project Card
						if (item.type === "game") {
							return (
								<a
									key={item.id}
									href={item.url || "#"}
									target={item.url ? "_blank" : undefined}
									rel={item.url ? "noopener noreferrer" : undefined}
									className="glass-liquid-card rounded-2xl p-5 flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] text-left"
								>
									<div>
										<div className="flex items-center justify-between gap-2 mb-3">
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/80 text-amber-700 border border-amber-200/50">
												<GamepadIcon className="w-4 h-4 text-amber-600" />
												<span>{item.badge ? item.badge[lang] : "Game"}</span>
											</span>
											{item.metadata?.year && (
												<span className="text-[11px] font-medium text-slate-400">
													{item.metadata.year}
												</span>
											)}
										</div>
										<h3 className="text-base font-bold text-theme-primary group-hover:text-amber-700 transition-colors leading-snug mb-1">
											{item.title[lang]}
										</h3>
										{item.subtitle && (
											<p className="text-xs text-amber-600 font-medium mb-2">
												{item.subtitle[lang]}
											</p>
										)}
										{item.description && (
											<p className="text-xs sm:text-sm text-theme-secondary leading-relaxed font-normal mb-3">
												{item.description[lang]}
											</p>
										)}
									</div>

									<div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border-subtle)]">
										<div className="flex items-center gap-1.5 flex-wrap">
											{item.metadata?.tags?.map((tag: string) => (
												<span
													key={tag}
													className="text-[10px] font-medium text-theme-secondary bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-subtle)] px-2 py-0.5 rounded-md"
												>
													{tag}
												</span>
											))}
										</div>
										<div className="w-7 h-7 rounded-full bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-subtle)] flex items-center justify-center text-theme-muted group-hover:text-amber-600 group-hover:bg-amber-500/20 transition-colors">
											<ExternalLinkIcon className="w-3.5 h-3.5" />
										</div>
									</div>
								</a>
							);
						}

						// 4. Media Review / Book / Film Card
						if (item.type === "review" || item.type === "book") {
							return (
								<div
									key={item.id}
									className="glass-liquid-card rounded-2xl p-5 flex flex-col justify-between text-left"
								>
									<div>
										<div className="flex items-center justify-between gap-2 mb-3">
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100/80 text-sky-700 border border-sky-200/50">
												<BookIcon className="w-4 h-4 text-sky-600" />
												<span>{item.badge ? item.badge[lang] : "Review"}</span>
											</span>
											{item.metadata?.rating && (
												<span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
													★ {item.metadata.rating}
												</span>
											)}
										</div>
										<h3 className="text-base font-bold text-theme-primary leading-snug mb-1">
											{item.title[lang]}
										</h3>
										{item.subtitle && (
											<p className="text-xs text-sky-600 font-medium mb-2">
												{item.subtitle[lang]}
											</p>
										)}
										{item.description && (
											<p className="text-xs sm:text-sm text-theme-secondary leading-relaxed font-normal mb-3">
												{item.description[lang]}
											</p>
										)}
									</div>

									{item.url && (
										<div className="pt-3 border-t border-[var(--glass-border-subtle)] flex justify-end">
											<a
												href={item.url}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
											>
												<span>{lang === "id" ? "Baca Selengkapnya" : "Read More"}</span>
												<ExternalLinkIcon className="w-3.5 h-3.5" />
											</a>
										</div>
									)}
								</div>
							);
						}

						// 5. External Link Card
						if (item.type === "link") {
							return (
								<a
									key={item.id}
									href={item.url || "#"}
									target={item.url ? "_blank" : undefined}
									rel={item.url ? "noopener noreferrer" : undefined}
									className="glass-liquid-card rounded-2xl p-5 flex items-center justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] text-left"
								>
									<div className="min-w-0 flex-1 pr-3">
										<div className="flex items-center gap-1.5 mb-1.5">
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/80 text-blue-700 border border-blue-200/50">
												<ExternalLinkIcon className="w-3.5 h-3.5 text-blue-600" />
												<span>{item.badge ? item.badge[lang] : "Link"}</span>
											</span>
										</div>
										<h3 className="text-base font-bold text-theme-primary group-hover:text-blue-700 transition-colors leading-snug truncate">
											{item.title[lang]}
										</h3>
										{item.subtitle && (
											<p className="text-xs text-slate-500 truncate mt-0.5">
												{item.subtitle[lang]}
											</p>
										)}
										{item.description && (
											<p className="text-xs text-theme-secondary line-clamp-2 mt-1">
												{item.description[lang]}
											</p>
										)}
									</div>
									<div className="w-8 h-8 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0">
										<ExternalLinkIcon className="w-4 h-4" />
									</div>
								</a>
							);
						}

						// 6. Project Card
						if (item.type === "project") {
							return (
								<a
									key={item.id}
									href={item.url || "#"}
									target={item.url ? "_blank" : undefined}
									rel={item.url ? "noopener noreferrer" : undefined}
									className="glass-liquid-card rounded-2xl p-5 flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] text-left"
								>
									<div>
										<div className="flex items-center justify-between gap-2 mb-3">
											<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100/80 text-violet-700 border border-violet-200/50">
												{getExploreTypeIcon(item.type)}
												<span>{item.badge ? item.badge[lang] : "Project"}</span>
											</span>
											{item.metadata?.year && (
												<span className="text-[11px] font-medium text-slate-400">
													{item.metadata.year}
												</span>
											)}
										</div>
										<h3 className="text-base font-bold text-theme-primary group-hover:text-violet-700 transition-colors leading-snug mb-1">
											{item.title[lang]}
										</h3>
										{item.description && (
											<p className="text-xs sm:text-sm text-theme-secondary leading-relaxed font-normal mb-3">
												{item.description[lang]}
											</p>
										)}
									</div>

									<div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border-subtle)]">
										<div className="flex items-center gap-1.5 flex-wrap">
											{item.metadata?.tags?.map((tag: string) => (
												<span
													key={tag}
													className="text-[10px] font-medium text-theme-secondary bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-subtle)] px-2 py-0.5 rounded-md"
												>
													{tag}
												</span>
											))}
										</div>
										<div className="w-7 h-7 rounded-full bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-subtle)] flex items-center justify-center text-theme-muted group-hover:text-[var(--accent-color)] group-hover:bg-[var(--accent-subtle)] transition-colors">
											<ExternalLinkIcon className="w-3.5 h-3.5" />
										</div>
									</div>
								</a>
							);
						}

						// 7. Music / Playlist Card
						if (item.type === "music") {
							return (
								<a
									key={item.id}
									href={item.url || "#"}
									target={item.url ? "_blank" : undefined}
									rel={item.url ? "noopener noreferrer" : undefined}
									className="glass-liquid-card rounded-2xl p-5 flex items-center gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] text-left"
								>
									<div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/30 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-200/50 group-hover:scale-105 transition-transform">
										<MusicIcon className="w-6 h-6" />
									</div>
									<div className="min-w-0 flex-1">
										<span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block mb-0.5">
											{item.badge ? item.badge[lang] : "Music"}
										</span>
										<h3 className="text-sm sm:text-base font-bold text-theme-primary group-hover:text-emerald-700 transition-colors leading-snug truncate">
											{item.title[lang]}
										</h3>
										{item.subtitle && (
											<p className="text-xs text-slate-500 truncate mt-0.5">
												{item.subtitle[lang]}
											</p>
										)}
									</div>
									<div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">
										<ExternalLinkIcon className="w-3.5 h-3.5" />
									</div>
								</a>
							);
						}

						// 8. Note / Announcement / Custom Block (Spans 2 columns if on wide)
						return (
							<div
								key={item.id}
								className="glass-liquid-secondary rounded-2xl p-5 sm:col-span-2 text-left"
							>
								<div className="flex items-center gap-1.5 mb-2">
									<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/70">
										{getExploreTypeIcon(item.type)}
										<span>{item.badge ? item.badge[lang] : (item.type === "custom" ? "Custom" : "Note")}</span>
									</span>
									{item.subtitle && (
										<span className="text-xs font-medium text-slate-400">
											• {item.subtitle[lang]}
										</span>
									)}
								</div>
								<h3 className="text-sm sm:text-base font-bold text-theme-primary mb-1.5">
									{item.title[lang]}
								</h3>
								{item.description && (
									<p className="text-xs sm:text-sm text-theme-secondary leading-relaxed font-normal">
										{item.description[lang]}
									</p>
								)}
								{item.url && (
									<div className="mt-3 pt-3 border-t border-[var(--glass-border-subtle)] flex justify-end">
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
										>
											<span>{lang === "id" ? "Buka Tautan" : "Open Link"}</span>
											<ExternalLinkIcon className="w-3.5 h-3.5" />
										</a>
									</div>
								)}
							</div>
						);
					})}
				</div>
				) : (
					/* Filter Empty State */
					<div className="glass-liquid-secondary rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center">
						<div className="w-10 h-10 rounded-full bg-theme-accent-subtle text-theme-accent border flex items-center justify-center mb-3 shadow-2xs">
							<CompassIcon className="w-5 h-5" />
						</div>
						<h3 className="text-sm sm:text-base font-bold text-theme-primary mb-1">
							{lang === "id" ? "Belum ada konten pada kategori ini" : "No items in this category yet"}
						</h3>
						<p className="text-xs text-theme-muted max-w-sm">
							{lang === "id"
								? "Pilih kategori lain di atas untuk melihat konten yang tersedia."
								: "Select another category above to view available items."}
						</p>
					</div>
				)
			) : (
				/* Professional Liquid Glass Empty State */
				<div className="glass-liquid-secondary rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center">
					<div className="w-12 h-12 rounded-full bg-theme-accent-subtle text-theme-accent border flex items-center justify-center mb-4 shadow-2xs">
						<CompassIcon className="w-6 h-6" />
					</div>
					<h3 className="text-base sm:text-lg font-bold text-theme-primary mb-1.5">
						{lang === "id" ? "Eksplorasi Belum Dikonfigurasi" : "No Highlights Configured Yet"}
					</h3>
					<p className="text-xs sm:text-sm text-theme-muted max-w-md leading-relaxed">
						{lang === "id"
							? "Bagian ini dapat menampilkan proyek pilihan, galeri foto, playlist musik, atau catatan Anda."
							: "This section showcases your featured projects, photo gallery, music playlists, or notes."}
					</p>
				</div>
			)}

			{/* Accessible Liquid Glass Multi-Photo Lightbox / Slideshow Modal (Phase 3) */}
			{activeLightboxItem && slides.length > 0 && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xl transition-all duration-300"
					onClick={() => setActiveLightboxItem(null)}
					role="dialog"
					aria-modal="true"
					aria-label={activeLightboxItem.title[lang]}
				>
					<div
						className="relative max-w-3xl w-full glass-liquid-primary rounded-3xl overflow-hidden p-4 sm:p-6 shadow-2xl border border-[var(--glass-border-specular)] flex flex-col max-h-[92vh]"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Top Header: Title, Counter & Close Button */}
						<div className="flex items-center justify-between gap-3 mb-3 shrink-0">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<h3 className="text-base sm:text-lg font-bold text-theme-primary truncate">
										{activeLightboxItem.title[lang]}
									</h3>
									{slides.length > 1 && (
										<span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--accent-subtle)] text-[var(--accent-color)] border border-[var(--accent-border)] shrink-0">
											{currentSlideIndex + 1} / {slides.length}
										</span>
									)}
								</div>
								{activeLightboxItem.subtitle && (
									<p className="text-xs text-[var(--accent-color)] font-medium truncate mt-0.5">
										{activeLightboxItem.subtitle[lang]}
									</p>
								)}
							</div>

							<button
								type="button"
								onClick={() => setActiveLightboxItem(null)}
								aria-label="Tutup"
								className="w-9 h-9 rounded-full bg-[var(--glass-surface-primary)] border border-[var(--glass-border-specular)] text-theme-primary hover:bg-[var(--glass-surface-hover)] flex items-center justify-center shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] shrink-0 cursor-pointer"
							>
								<CloseIcon className="w-5 h-5" />
							</button>
						</div>

						{/* Slide Image Viewer with Touch Gestures and Prev/Next Controls */}
						<div
							className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center shrink-0 select-none group"
							onTouchStart={(e) => {
								touchStartX.current = e.touches[0].clientX;
							}}
							onTouchEnd={(e) => {
								if (touchStartX.current === null) return;
								const diff = touchStartX.current - e.changedTouches[0].clientX;
								if (Math.abs(diff) > 40) {
									if (diff > 0) goToNextSlide();
									else goToPrevSlide();
								}
								touchStartX.current = null;
							}}
						>
							<img
								key={slides[currentSlideIndex]?.url}
								src={slides[currentSlideIndex]?.url}
								alt={slides[currentSlideIndex]?.caption || activeLightboxItem.title[lang]}
								className="w-full h-full object-contain animate-in fade-in duration-200"
							/>

							{/* Previous Slide Button */}
							{slides.length > 1 && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										goToPrevSlide();
									}}
									aria-label="Foto Sebelumnya"
									className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950/85 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] opacity-80 group-hover:opacity-100"
								>
									<ChevronLeftIcon className="w-6 h-6 -ml-0.5" />
								</button>
							)}

							{/* Next Slide Button */}
							{slides.length > 1 && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										goToNextSlide();
									}}
									aria-label="Foto Selanjutnya"
									className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/60 hover:bg-slate-950/85 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all shadow-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] opacity-80 group-hover:opacity-100"
								>
									<ChevronRightIcon className="w-6 h-6 -mr-0.5" />
								</button>
							)}
						</div>

						{/* Slide Caption & Thumbnails Strip */}
						<div className="mt-3 flex flex-col gap-2 overflow-y-auto min-h-0">
							{slides[currentSlideIndex]?.caption ? (
								<p className="text-xs sm:text-sm text-theme-secondary leading-relaxed font-normal">
									{slides[currentSlideIndex].caption}
								</p>
							) : (
								activeLightboxItem.description && (
									<p className="text-xs sm:text-sm text-theme-secondary leading-relaxed font-normal">
										{activeLightboxItem.description[lang]}
									</p>
								)
							)}

							{/* Multi-Photo Thumbnail Strip */}
							{slides.length > 1 && (
								<div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
									{slides.map((slide, idx) => (
										<button
											key={idx}
											type="button"
											onClick={() => setCurrentSlideIndex(idx)}
											aria-label={`Lihat foto ${idx + 1}`}
											className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
												idx === currentSlideIndex
													? "border-[var(--accent-color)] ring-2 ring-[var(--accent-ring)] scale-105 opacity-100"
													: "border-white/20 opacity-55 hover:opacity-90"
											}`}
										>
											<img
												src={slide.url}
												alt={`Miniatur ${idx + 1}`}
												className="w-full h-full object-cover"
											/>
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
