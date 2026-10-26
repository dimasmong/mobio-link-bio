import React, { useState } from "react";
import type { ProfileData, Language } from "../data/profile";
import { GlobeIcon } from "./Icons";

interface ProfileGlassCardProps {
	profile: ProfileData;
	lang: Language;
}

function getInitials(name: string): string {
	if (!name) return "U";
	const cleaned = name.replace(/[\[\]\(\)]/g, "").trim();
	const parts = cleaned.split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "U";
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getCoverAspectRatioCSS(ratio?: string): string {
	if (!ratio) return "21 / 9";
	const clean = ratio.replace(/^aspect-/, "").replace(/\[|\]/g, "").trim();
	if (clean === "16:9" || clean === "16/9") return "16 / 9";
	if (clean === "21:9" || clean === "21/9" || clean.includes("21/9")) return "21 / 9";
	if (clean === "3:1" || clean === "3/1") return "3 / 1";
	if (clean.includes(":")) return clean.replace(":", " / ");
	if (clean.includes("/")) return clean;
	return "21 / 9";
}

export function ProfileGlassCard({ profile, lang }: ProfileGlassCardProps) {
	const [imageError, setImageError] = useState(false);
	const initials = getInitials(profile.name);
	const hasAvatar = Boolean(profile.avatarUrl && profile.avatarUrl.trim() !== "");
	const hasLocation = Boolean(profile.location && profile.location[lang]?.trim());
	const hasBio = Boolean(profile.bio && profile.bio[lang]?.trim());
	const hasCover = Boolean(profile.cover?.enabled);
	const hasCustomCover = Boolean(profile.cover?.coverUrl && profile.cover.coverUrl.trim() !== "");
	const coverAspectRatioCSS = getCoverAspectRatioCSS(profile.cover?.aspectRatio);

	return (
		<header className="w-full relative z-10">
			{/* Main Compact Immersive Card Container */}
			<div className="glass-liquid-primary rounded-3xl sm:rounded-4xl relative overflow-hidden transition-all duration-300 shadow-2xl border border-[var(--glass-border-specular)]">
				{/* =========================================================================
				    LAYERS 2 & 3: FULL-CARD PHOTOGRAPHIC BLEED & PROGRESSIVE GRADIENT MASK
				    Extends cover visual depth down behind the card, fading smoothly to bottom
				    ========================================================================= */}
				{hasCover && (
					<div
						className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none"
						aria-hidden="true"
					>
						{hasCustomCover ? (
							<div
								className="w-full h-full"
								style={{
									maskImage:
										"linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.50) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 95%)",
									WebkitMaskImage:
										"linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.50) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 95%)",
								}}
							>
								<img
									src={profile.cover.coverUrl}
									alt=""
									className="w-full h-full object-cover scale-105 filter blur-xs opacity-50 dark:opacity-35 transition-opacity"
									style={{ objectPosition: profile.cover.focalPoint || "center" }}
								/>
							</div>
						) : (
							/* Gradient Fallback Bleed */
							<div
								className="w-full h-full bg-gradient-to-b from-[var(--accent-subtle)] via-transparent to-transparent opacity-60"
								style={{
									maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 80%)",
									WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 80%)",
								}}
							/>
						)}
					</div>
				)}

				{/* =========================================================================
				    LAYER 1 & 2: TOP COVER BANNER WITH DEFINED ASPECT RATIO GEOMETRY
				    Vivid, crisp top region with smooth vignette melt at bottom boundary
				    ========================================================================= */}
				{hasCover && (
					<div
						className={`w-full relative overflow-hidden z-1 transition-all duration-300 ${
							profile.cover?.aspectRatio === "16:9"
								? "aspect-[16/9]"
								: profile.cover?.aspectRatio === "3:1"
								? "aspect-[3/1]"
								: "aspect-[21/9] sm:aspect-[24/9]"
						}`}
						style={{ aspectRatio: coverAspectRatioCSS }}
					>
						{hasCustomCover ? (
							<img
								src={profile.cover.coverUrl}
								alt={profile.cover.alt ? profile.cover.alt[lang] : "Cover banner"}
								className="w-full h-full object-cover"
								style={{ objectPosition: profile.cover.focalPoint || "center" }}
								loading="eager"
							/>
						) : (
							/* Liquid Aurora Specular Fallback Banner */
							<div className="w-full h-full relative overflow-hidden bg-gradient-to-tr from-violet-200/60 via-sky-100/50 to-pink-200/50">
								<div
									className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[var(--accent-subtle)] blur-2xl pointer-events-none opacity-60"
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
							</div>
						)}

						{/* Smooth progressive vignette melt bridging top cover into the body */}
						<div
							className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--glass-surface-primary)] via-[var(--glass-surface-primary)]/40 to-transparent pointer-events-none"
							aria-hidden="true"
						/>
					</div>
				)}

				{/* =========================================================================
				    LAYER 4 & 5: COMPACT PROFILE CARD BODY & CONTENT
				    Crisp typography, theme-aware readability, elegant avatar pedestal
				    ========================================================================= */}
				<div
					className={`relative z-10 flex flex-col items-center text-center px-5 sm:px-6 md:px-8 pb-5 sm:pb-6 ${
						hasCover ? "pt-0" : "pt-6 sm:pt-8"
					}`}
				>
					{/* Optical ambient highlights */}
					<div
						className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-[var(--accent-subtle)] blur-3xl pointer-events-none opacity-50"
						aria-hidden="true"
					/>
					<div
						className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-[var(--accent-subtle)] blur-3xl pointer-events-none opacity-30"
						aria-hidden="true"
					/>

					{/* Sculpted Avatar Pedestal with Dual Specular Rings */}
					<div
						className={`relative ${
							hasCover ? "-mt-10 sm:-mt-12 md:-mt-14 mb-2.5 sm:mb-3" : "mb-3 sm:mb-4"
						} z-20`}
					>
						<div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full p-1 sm:p-1.5 bg-[var(--glass-surface-primary)] border border-[var(--glass-border-specular)] shadow-2xl backdrop-blur-xl flex items-center justify-center transition-transform hover:scale-105 duration-300">
							<div className="w-full h-full rounded-full overflow-hidden ring-2 ring-white/60 dark:ring-white/10 shadow-inner flex items-center justify-center">
								{hasAvatar && !imageError ? (
									<img
										src={profile.avatarUrl}
										alt={profile.name}
										width={112}
										height={112}
										onError={() => setImageError(true)}
										className="w-full h-full object-cover bg-slate-100 dark:bg-slate-800"
										loading="eager"
									/>
								) : (
									<div
										className="w-full h-full flex items-center justify-center bg-theme-accent font-extrabold text-xl sm:text-2xl md:text-3xl shadow-inner select-none"
										style={{ backgroundColor: "var(--accent-color)", color: "var(--accent-foreground)" }}
										aria-label={profile.name}
									>
										{initials}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Display Name */}
					<h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-theme-primary mb-1.5 drop-shadow-xs">
						{profile.name}
					</h1>

					{/* Username / Handle and Optional Location */}
					<div
						className={`flex items-center justify-center flex-wrap gap-1.5 text-xs sm:text-sm text-theme-muted ${
							hasBio ? "mb-3" : "mb-0"
						}`}
					>
						<span className="font-semibold px-2.5 py-0.5 rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-surface-secondary)] text-theme-primary shadow-2xs inline-flex items-center gap-1.5 backdrop-blur-md">
							<span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]" aria-hidden="true" />
							{profile.handle}
						</span>
						{hasLocation && (
							<>
								<span className="opacity-30">•</span>
								<span className="inline-flex items-center gap-1 font-medium text-theme-secondary px-2 py-0.5 rounded-full bg-[var(--glass-surface-secondary)]/60 border border-[var(--glass-border-subtle)]/50">
									<GlobeIcon className="w-3 h-3 text-theme-muted" />
									{profile.location?.[lang]}
								</span>
							</>
						)}
					</div>

					{/* Biography (Rendered only if bio is non-empty) */}
					{hasBio && (
						<p className="text-xs sm:text-sm md:text-base text-theme-secondary leading-relaxed max-w-md sm:max-w-lg mx-auto font-normal">
							{profile.bio[lang]}
						</p>
					)}
				</div>
			</div>
		</header>
	);
}
