import React from "react";
import type { CoverConfig, Language } from "../data/profile";

interface CoverBannerProps {
	config: CoverConfig;
	lang: Language;
}

export function CoverBanner({ config, lang }: CoverBannerProps) {
	if (!config.enabled) return null;

	const hasCustomMedia = Boolean(config.coverUrl && config.coverUrl.trim() !== "");
	const aspectRatio = config.aspectRatio || "aspect-[21/9] sm:aspect-[24/9]";

	return (
		<div className="w-full relative z-0">
			<div
				className={`w-full ${aspectRatio} rounded-3xl sm:rounded-4xl overflow-hidden glass-liquid-cover relative transition-all duration-300`}
			>
				{hasCustomMedia ? (
					<img
						src={config.coverUrl}
						alt={config.alt ? config.alt[lang] : "Cover banner"}
						className="w-full h-full object-cover"
						style={{ objectPosition: config.focalPoint || "center" }}
						loading="eager"
					/>
				) : (
					/* Liquid Aurora Specular Fallback Banner */
					<div className="w-full h-full relative overflow-hidden bg-gradient-to-tr from-violet-200/60 via-sky-100/50 to-pink-200/50">
						{/* Shimmering Refractive Elements */}
						<div
							className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-violet-400/25 blur-2xl pointer-events-none"
							aria-hidden="true"
						/>
						<div
							className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-sky-300/30 blur-2xl pointer-events-none"
							aria-hidden="true"
						/>
						<div
							className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-32 rounded-full bg-pink-300/20 blur-3xl pointer-events-none"
							aria-hidden="true"
						/>
						{/* Fine specular glass sheen line across the banner */}
						<div
							className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/10 pointer-events-none"
							aria-hidden="true"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
