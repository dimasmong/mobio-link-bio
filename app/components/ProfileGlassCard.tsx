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

function normalizeAspectRatio(ratio?: string): string {
	if (!ratio) return "aspect-[21/9] sm:aspect-[24/9]";
	if (ratio === "16:9") return "aspect-[16/9]";
	if (ratio === "21:9") return "aspect-[21/9] sm:aspect-[24/9]";
	if (ratio === "3:1") return "aspect-[3/1]";
	if (ratio.startsWith("aspect-")) return ratio;
	return `aspect-[${ratio}]`;
}

export function ProfileGlassCard({ profile, lang }: ProfileGlassCardProps) {
	const [imageError, setImageError] = useState(false);
	const initials = getInitials(profile.name);
	const hasAvatar = Boolean(profile.avatarUrl && profile.avatarUrl.trim() !== "");
	const hasLocation = Boolean(profile.location && profile.location[lang]?.trim());
	const hasBio = Boolean(profile.bio && profile.bio[lang]?.trim());
	const hasCover = Boolean(profile.cover?.enabled);
	const hasCustomCover = Boolean(profile.cover?.coverUrl && profile.cover.coverUrl.trim() !== "");
	const coverAspectRatio = normalizeAspectRatio(profile.cover?.aspectRatio);

	return (
		<header className="w-full relative z-10">
			<div className="glass-liquid-primary rounded-3xl sm:rounded-4xl relative overflow-hidden transition-all duration-300">
				{/* 1. Full Uninterrupted Cover Banner with Bottom Gradient Vignette */}
				{hasCover && (
					<div className={`w-full ${coverAspectRatio} relative overflow-hidden z-0`}>
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
								<div
									className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/10 pointer-events-none"
									aria-hidden="true"
								/>
							</div>
						)}
						{/* Refined cover-to-body vignette melt */}
						<div
							className="absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-[var(--glass-surface-primary)] via-[var(--glass-surface-primary)]/40 to-transparent pointer-events-none"
							aria-hidden="true"
						/>
					</div>
				)}

				{/* 2. Profile Card Body */}
				<div className={`relative flex flex-col items-center text-center p-6 sm:p-8 md:p-10 ${hasCover ? "pt-0" : ""}`}>
					{/* Optical refraction ambient highlights */}
					<div
						className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[var(--accent-subtle)] blur-3xl pointer-events-none opacity-60"
						aria-hidden="true"
					/>
					<div
						className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-[var(--accent-subtle)] blur-3xl pointer-events-none opacity-40"
						aria-hidden="true"
					/>

					{/* Sculpted Avatar Pedestal with Dual Specular Rings */}
					<div className={`relative ${hasCover ? "-mt-12 sm:-mt-14 md:-mt-16 mb-3 sm:mb-4" : "mb-4 sm:mb-5"} z-20`}>
						<div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full p-1.5 bg-[var(--glass-surface-primary)] border border-[var(--glass-border-specular)] shadow-2xl backdrop-blur-xl flex items-center justify-center transition-transform hover:scale-105 duration-300">
							<div className="w-full h-full rounded-full overflow-hidden ring-2 ring-white/50 dark:ring-white/10 shadow-inner flex items-center justify-center">
								{hasAvatar && !imageError ? (
									<img
										src={profile.avatarUrl}
										alt={profile.name}
										width={128}
										height={128}
										onError={() => setImageError(true)}
										className="w-full h-full object-cover bg-slate-100 dark:bg-slate-800"
										loading="eager"
									/>
								) : (
									<div
										className="w-full h-full flex items-center justify-center bg-theme-accent font-extrabold text-2xl sm:text-3xl md:text-4xl shadow-inner select-none"
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
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-theme-primary mb-2 drop-shadow-xs">
						{profile.name}
					</h1>

					{/* Username / Handle and Optional Location */}
					<div
						className={`flex items-center justify-center flex-wrap gap-2 text-xs sm:text-sm text-theme-muted ${
							hasBio ? "mb-4" : "mb-0"
						}`}
					>
						<span className="font-semibold px-3 py-1 rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-surface-secondary)] text-theme-primary shadow-xs inline-flex items-center gap-1.5 backdrop-blur-md">
							<span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]" aria-hidden="true" />
							{profile.handle}
						</span>
						{hasLocation && (
							<>
								<span className="opacity-40">•</span>
								<span className="inline-flex items-center gap-1 font-medium text-theme-secondary px-2.5 py-1 rounded-full bg-[var(--glass-surface-secondary)]/50 border border-[var(--glass-border-subtle)]/50">
									<GlobeIcon className="w-3.5 h-3.5 text-theme-muted" />
									{profile.location?.[lang]}
								</span>
							</>
						)}
					</div>

					{/* Biography (Rendered only if bio is non-empty) */}
					{hasBio && (
						<p className="text-sm sm:text-base text-theme-secondary leading-relaxed max-w-md sm:max-w-lg md:max-w-xl mx-auto font-normal">
							{profile.bio[lang]}
						</p>
					)}
				</div>
			</div>
		</header>
	);
}
