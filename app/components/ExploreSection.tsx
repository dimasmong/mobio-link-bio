import React, { useState, useEffect } from "react";
import type { ExploreConfig, ExploreItem, Language } from "../data/profile";
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
} from "./Icons";

interface ExploreSectionProps {
	config: ExploreConfig;
	lang: Language;
}

function getExploreTypeIcon(type: string) {
	switch (type) {
		case "project":
			return <CodeIcon className="w-4 h-4 text-violet-600" />;
		case "gallery":
			return <ImageIcon className="w-4 h-4 text-pink-600" />;
		case "music":
			return <MusicIcon className="w-4 h-4 text-emerald-600" />;
		case "game":
			return <GamepadIcon className="w-4 h-4 text-amber-600" />;
		case "book":
			return <BookIcon className="w-4 h-4 text-sky-600" />;
		case "video":
			return <FilmIcon className="w-4 h-4 text-purple-600" />;
		default:
			return <SparklesIcon className="w-4 h-4 text-violet-600" />;
	}
}

export function ExploreSection({ config, lang }: ExploreSectionProps) {
	const [activeLightboxImage, setActiveLightboxImage] = useState<ExploreItem | null>(null);

	// Keyboard accessibility: Close lightbox on Escape key
	useEffect(() => {
		if (!activeLightboxImage) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setActiveLightboxImage(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activeLightboxImage]);

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
			<div className="flex flex-col items-center text-center mb-6 px-2">
				<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100/70 text-violet-700 border border-violet-200/60 mb-2">
					<CompassIcon className="w-3.5 h-3.5" />
					<h2 id="explore-heading">{config.title[lang]}</h2>
				</div>
				{config.description && config.description[lang]?.trim() && (
					<p className="text-xs sm:text-sm text-slate-500 max-w-md">
						{config.description[lang]}
					</p>
				)}
			</div>

			{hasItems ? (
				/* Modular Content Grid */
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{config.items.map((item) => {
					// 1. Photo / Gallery Card
					if (item.type === "gallery" && item.coverImage) {
						return (
							<div
								key={item.id}
								onClick={() => setActiveLightboxImage(item)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										setActiveLightboxImage(item);
									}
								}}
								tabIndex={0}
								role="button"
								aria-label={`Lihat gambar ${item.title[lang]}`}
								className="glass-liquid-card rounded-2xl overflow-hidden group cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
							>
								<div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
									<img
										src={item.coverImage}
										alt={item.title[lang]}
										className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
										loading="lazy"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
									<div className="absolute top-3 left-3">
										<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/90 text-slate-800 shadow-2xs backdrop-blur-md">
											{getExploreTypeIcon(item.type)}
											<span>{item.badge ? item.badge[lang] : "Photo"}</span>
										</span>
									</div>
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

					// 2. Project Card
					if (item.type === "project") {
						return (
							<a
								key={item.id}
								href={item.url || "#"}
								target={item.url ? "_blank" : undefined}
								rel={item.url ? "noopener noreferrer" : undefined}
								className="glass-liquid-card rounded-2xl p-5 flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 text-left"
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
									<h3 className="text-base font-bold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug mb-1">
										{item.title[lang]}
									</h3>
									{item.description && (
										<p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-3">
											{item.description[lang]}
										</p>
									)}
								</div>

								<div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
									<div className="flex items-center gap-1.5 flex-wrap">
										{item.metadata?.tags?.map((tag) => (
											<span
												key={tag}
												className="text-[10px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md"
											>
												{tag}
											</span>
										))}
									</div>
									<div className="w-7 h-7 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400 group-hover:text-violet-600 group-hover:bg-violet-50 transition-colors">
										<ExternalLinkIcon className="w-3.5 h-3.5" />
									</div>
								</div>
							</a>
						);
					}

					// 3. Music / Playlist Card
					if (item.type === "music") {
						return (
							<a
								key={item.id}
								href={item.url || "#"}
								target={item.url ? "_blank" : undefined}
								rel={item.url ? "noopener noreferrer" : undefined}
								className="glass-liquid-card rounded-2xl p-5 flex items-center gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 text-left"
							>
								<div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/30 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-200/50 group-hover:scale-105 transition-transform">
									<MusicIcon className="w-6 h-6" />
								</div>
								<div className="min-w-0 flex-1">
									<span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block mb-0.5">
										{item.badge ? item.badge[lang] : "Music"}
									</span>
									<h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug truncate">
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

					// 4. Note / Short Text Card (Spans 2 columns if on wide)
					return (
						<div
							key={item.id}
							className="glass-liquid-secondary rounded-2xl p-5 sm:col-span-2 text-left"
						>
							<div className="flex items-center gap-1.5 mb-2">
								<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/70">
									{getExploreTypeIcon(item.type)}
									<span>{item.badge ? item.badge[lang] : "Note"}</span>
								</span>
								{item.subtitle && (
									<span className="text-xs font-medium text-slate-400">
										• {item.subtitle[lang]}
									</span>
								)}
							</div>
							<h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">
								{item.title[lang]}
							</h3>
							{item.description && (
								<p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
									{item.description[lang]}
								</p>
							)}
						</div>
					);
				})}
			</div>
			) : (
				/* Professional Liquid Glass Empty State */
				<div className="glass-liquid-secondary rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center">
					<div className="w-12 h-12 rounded-full bg-violet-100/80 border border-violet-200/50 text-violet-600 flex items-center justify-center mb-4 shadow-2xs">
						<CompassIcon className="w-6 h-6" />
					</div>
					<h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
						{lang === "id" ? "Eksplorasi Belum Dikonfigurasi" : "No Highlights Configured Yet"}
					</h3>
					<p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
						{lang === "id"
							? "Bagian ini dapat menampilkan proyek pilihan, galeri foto, playlist musik, atau catatan Anda. Tambahkan item di file app/data/profile.ts."
							: "This section showcases your featured projects, photo gallery, music playlists, or notes. Add items in app/data/profile.ts."}
					</p>
				</div>
			)}

			{/* Accessible Liquid Glass Lightbox Modal */}
			{activeLightboxImage && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-300"
					onClick={() => setActiveLightboxImage(null)}
					role="dialog"
					aria-modal="true"
					aria-label={activeLightboxImage.title[lang]}
				>
					<div
						className="relative max-w-2xl w-full glass-liquid-primary rounded-3xl overflow-hidden p-4 sm:p-6"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							type="button"
							onClick={() => setActiveLightboxImage(null)}
							aria-label="Tutup"
							className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 text-slate-700 hover:text-slate-950 hover:bg-white flex items-center justify-center shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
						>
							<CloseIcon className="w-5 h-5" />
						</button>

						{activeLightboxImage.coverImage && (
							<div className="aspect-[4/3] w-full rounded-2xl overflow-hidden mb-4 bg-slate-100">
								<img
									src={activeLightboxImage.coverImage}
									alt={activeLightboxImage.title[lang]}
									className="w-full h-full object-cover"
								/>
							</div>
						)}

						<h3 className="text-lg font-bold text-slate-900 mb-1">
							{activeLightboxImage.title[lang]}
						</h3>
						{activeLightboxImage.subtitle && (
							<p className="text-xs sm:text-sm text-violet-600 font-medium mb-2">
								{activeLightboxImage.subtitle[lang]}
							</p>
						)}
						{activeLightboxImage.description && (
							<p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
								{activeLightboxImage.description[lang]}
							</p>
						)}
					</div>
				</div>
			)}
		</section>
	);
}
