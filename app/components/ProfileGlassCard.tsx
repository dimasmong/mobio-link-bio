import React, { useState } from "react";
import type { ProfileData, Language } from "../data/profile";
import { getLocalizedText, TRANSLATIONS } from "../lib/i18n";
import { GlobeIcon } from "./Icons";
import {
	getProfileCardStyle,
	getCardSizeConfig,
	type CardSize,
} from "../lib/profileCard";

interface ProfileGlassCardProps {
	profile: ProfileData;
	lang: Language;
	cardStyle?: string;
	cardSize?: CardSize;
}

function getInitials(name: string): string {
	if (!name) return "U";
	const cleaned = name.replace(/[\[\]\(\)]/g, "").trim();
	const parts = cleaned.split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "U";
	if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileGlassCard({
	profile,
	lang,
	cardStyle: rawStyleId,
	cardSize: rawSizeId,
}: ProfileGlassCardProps) {
	const [imageError, setImageError] = useState(false);
	const initials = getInitials(profile.name);
	const hasAvatar = Boolean(profile.avatarUrl && profile.avatarUrl.trim() !== "");
	const localizedLocation = getLocalizedText(profile.location, lang);
	const hasLocation = Boolean(localizedLocation);
	const localizedBio = getLocalizedText(profile.bio, lang);
	const hasBio = Boolean(localizedBio);
	const hasCover = Boolean(profile.cover?.enabled);
	const hasCustomCover = Boolean(profile.cover?.coverUrl && profile.cover.coverUrl.trim() !== "");

	const styleConfig = getProfileCardStyle(rawStyleId);
	const sizeConfig = getCardSizeConfig(rawSizeId);
	const styleId = styleConfig.id;

	// Avatar Element Renderer
	const renderAvatar = (customClasses = "") => (
		<div
			className={`rounded-full p-0.5 sm:p-1 bg-[var(--glass-surface-primary)] border border-[var(--glass-border-specular)] shadow-xl backdrop-blur-xl flex items-center justify-center transition-transform hover:scale-105 duration-300 shrink-0 ${sizeConfig.avatarSizeClass} ${customClasses}`}
		>
			<div className="w-full h-full rounded-full overflow-hidden ring-1 ring-white/50 dark:ring-white/20 shadow-inner flex items-center justify-center">
				{hasAvatar && !imageError ? (
					<img
						src={profile.avatarUrl}
						alt={profile.name}
						onError={() => setImageError(true)}
						className="w-full h-full object-cover bg-slate-100 dark:bg-slate-800"
						loading="eager"
					/>
				) : (
					<div
						className="w-full h-full flex items-center justify-center font-extrabold shadow-inner select-none text-base sm:text-xl"
						style={{ backgroundColor: "var(--accent-color)", color: "var(--accent-foreground)" }}
						aria-label={profile.name}
					>
						{initials}
					</div>
				)}
			</div>
		</div>
	);

	// Cover Image Background Renderer
	const renderCoverMedia = (extraClass = "", extraStyle?: React.CSSProperties) => {
		if (!hasCover) return null;
		return hasCustomCover ? (
			<img
				src={profile.cover?.coverUrl}
				alt={profile.cover?.alt ? getLocalizedText(profile.cover.alt, lang, TRANSLATIONS[lang].public.coverAlt) : TRANSLATIONS[lang].public.coverAlt}
				className={`w-full h-full object-cover ${extraClass}`}
				style={{ objectPosition: profile.cover?.focalPoint || "center", ...extraStyle }}
				loading="eager"
			/>
		) : (
			<div className={`w-full h-full relative overflow-hidden bg-gradient-to-tr from-violet-200/60 via-sky-100/50 to-pink-200/50 ${extraClass}`}>
				<div
					className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[var(--accent-subtle)] blur-2xl pointer-events-none opacity-60"
					aria-hidden="true"
				/>
				<div
					className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-sky-300/30 blur-2xl pointer-events-none"
					aria-hidden="true"
				/>
			</div>
		);
	};

	// Identity Block (Name, Handle, Location, Bio)
	const renderIdentity = (align: "center" | "start" = "center") => {
		const isStart = align === "start";
		return (
			<div className={`flex flex-col ${isStart ? "items-start text-left" : "items-center text-center"} w-full`}>
				<h1 className={`${sizeConfig.nameClass} tracking-tight text-theme-primary mb-1 drop-shadow-xs`}>
					{profile.name}
				</h1>
				<div className={`flex items-center flex-wrap gap-1.5 ${isStart ? "justify-start" : "justify-center"} ${hasBio ? "mb-2" : "mb-0"}`}>
					<span className="font-semibold px-2.5 py-0.5 rounded-full border border-[var(--glass-border-subtle)] bg-[var(--glass-surface-secondary)] text-theme-primary shadow-2xs inline-flex items-center gap-1.5 backdrop-blur-md text-xs">
						<span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]" aria-hidden="true" />
						{profile.handle}
					</span>
					{hasLocation && (
						<>
							<span className="opacity-30 text-xs">•</span>
							<span className="inline-flex items-center gap-1 font-medium text-theme-secondary px-2 py-0.5 rounded-full bg-[var(--glass-surface-secondary)]/60 border border-[var(--glass-border-subtle)]/50 text-xs">
								<GlobeIcon className="w-2.5 h-2.5 text-theme-muted" />
								{localizedLocation}
							</span>
						</>
					)}
				</div>
				{hasBio && (
					<p className={`${sizeConfig.bioClass} text-theme-secondary leading-relaxed font-normal mt-1`}>
						{localizedBio}
					</p>
				)}
			</div>
		);
	};

	return (
		<header className="w-full relative z-10 transition-all duration-300">
			<div className="glass-liquid-primary rounded-3xl sm:rounded-4xl relative overflow-hidden transition-all duration-300 shadow-2xl border border-[var(--glass-border-specular)]">
				{/* ------------------------------------------------------------------ */}
				{/* STYLE 01: IMMERSIVE FADE (Default)                                 */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "immersive-fade" && (
					<>
						{hasCover && (
							<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
								<div
									className="w-full h-full"
									style={{
										maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.50) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 95%)",
										WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.50) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0) 95%)",
									}}
								>
									{renderCoverMedia("scale-105 filter blur-xs opacity-50 dark:opacity-35")}
								</div>
							</div>
						)}
						{hasCover && (
							<div className={`w-full relative overflow-hidden z-1 ${styleConfig.coverHeightClass}`}>
								{renderCoverMedia()}
								<div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--glass-surface-primary)] via-[var(--glass-surface-primary)]/40 to-transparent pointer-events-none" />
							</div>
						)}
						<div className={`relative z-10 flex flex-col items-center text-center ${sizeConfig.paddingClass} ${hasCover ? "pt-0" : "pt-5"}`}>
							<div className={`relative ${hasCover ? "-mt-8 sm:-mt-10 mb-2" : "mb-3"} z-20`}>
								{renderAvatar()}
							</div>
							{renderIdentity("center")}
						</div>
					</>
				)}

				{/* ------------------------------------------------------------------ */}
				{/* STYLE 02: MINIMAL IDENTITY (Adjacent Avatar & Identity)             */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "minimal-identity" && (
					<div className="flex flex-col w-full">
						{hasCover && (
							<div className={`w-full relative overflow-hidden ${styleConfig.coverHeightClass}`}>
								{renderCoverMedia("opacity-80")}
								<div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent opacity-80" />
							</div>
						)}
						<div className={`p-4 sm:p-5 flex flex-col gap-2.5`}>
							<div className="flex items-center gap-3.5 w-full">
								{renderAvatar()}
								<div className="flex flex-col min-w-0 flex-1 text-left">
									<h1 className={`${sizeConfig.nameClass} tracking-tight text-theme-primary truncate drop-shadow-xs`}>
										{profile.name}
									</h1>
									<div className="flex items-center gap-1.5 flex-wrap text-xs text-theme-muted">
										<span className="font-semibold text-theme-accent">
											{profile.handle}
										</span>
										{hasLocation && (
											<>
												<span className="opacity-30">•</span>
												<span className="text-theme-secondary inline-flex items-center gap-1">
													<GlobeIcon className="w-2.5 h-2.5 text-theme-muted" />
													{localizedLocation}
												</span>
											</>
										)}
									</div>
								</div>
							</div>
							{hasBio && (
								<p className={`${sizeConfig.bioClass} text-theme-secondary leading-relaxed font-normal text-left pt-1 border-t border-[var(--glass-border-subtle)]`}>
									{localizedBio}
								</p>
							)}
						</div>
					</div>
				)}

				{/* ------------------------------------------------------------------ */}
				{/* STYLE 03: COMPACT BANNER                                           */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "compact-banner" && (
					<>
						{hasCover && (
							<div className={`w-full relative overflow-hidden ${styleConfig.coverHeightClass}`}>
								{renderCoverMedia()}
								<div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
							</div>
						)}
						<div className={`relative z-10 flex flex-col items-center text-center ${sizeConfig.paddingClass} ${hasCover ? "pt-0" : "pt-4"}`}>
							<div className={`relative ${hasCover ? "-mt-7 sm:-mt-8 mb-2" : "mb-2"} z-20`}>
								{renderAvatar()}
							</div>
							{renderIdentity("center")}
						</div>
					</>
				)}

				{/* ------------------------------------------------------------------ */}
				{/* STYLE 04: FLOATING AVATAR                                          */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "floating-avatar" && (
					<div className={`relative flex flex-col items-center text-center ${sizeConfig.paddingClass}`}>
						{hasCover && (
							<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none opacity-25 dark:opacity-20 filter blur-sm">
								{renderCoverMedia()}
							</div>
						)}
						<div className="relative z-10 mb-2.5">
							{renderAvatar("ring-2 ring-[var(--accent-subtle)] shadow-xl")}
						</div>
						<div className="relative z-10 w-full">
							{renderIdentity("center")}
						</div>
					</div>
				)}

				{/* ------------------------------------------------------------------ */}
				{/* STYLE 05: EDITORIAL PROFILE (Asymmetric Left-Aligned)              */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "editorial-profile" && (
					<div className="flex flex-col w-full text-left">
						{hasCover && (
							<div className={`w-full relative overflow-hidden ${styleConfig.coverHeightClass}`}>
								{renderCoverMedia()}
								<div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--accent-color)]" />
							</div>
						)}
						<div className={`p-4 sm:p-5 flex flex-col items-start ${hasCover ? "pt-3" : "pt-4"}`}>
							<div className="mb-2">
								{renderAvatar()}
							</div>
							{renderIdentity("start")}
						</div>
					</div>
				)}

				{/* ------------------------------------------------------------------ */}
				{/* STYLE 06: FROSTED PANEL                                            */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "frosted-panel" && (
					<div className="relative flex flex-col items-center w-full">
						{hasCover && (
							<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
								{renderCoverMedia("filter blur-md scale-110 opacity-35 dark:opacity-25")}
							</div>
						)}
						<div className={`relative z-10 flex flex-col items-center text-center w-full backdrop-blur-xl bg-[var(--glass-surface-primary)]/80 ${sizeConfig.paddingClass}`}>
							<div className="mb-2">
								{renderAvatar()}
							</div>
							{renderIdentity("center")}
						</div>
					</div>
				)}

				{/* ------------------------------------------------------------------ */}
				{/* STYLE 07: FRAMELESS COVER                                          */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "frameless-cover" && (
					<div className="relative flex flex-col w-full overflow-hidden">
						{hasCover && (
							<div className={`w-full relative ${styleConfig.coverHeightClass} overflow-hidden`}>
								{renderCoverMedia("scale-105")}
								<div className="absolute inset-0 bg-gradient-to-t from-[var(--glass-surface-primary)] via-transparent to-transparent" />
							</div>
						)}
						<div className={`relative z-10 flex flex-col items-center text-center p-4 sm:p-5 ${hasCover ? "-mt-8" : ""}`}>
							<div className="mb-2">
								{renderAvatar()}
							</div>
							<div className="bg-[var(--glass-surface-primary)]/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-lg border border-[var(--glass-border-specular)] w-full">
								{renderIdentity("center")}
							</div>
						</div>
					</div>
				)}

				{/* ------------------------------------------------------------------ */}
				{/* STYLE 08: SPLIT IDENTITY (Two-Zone Split)                          */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "split-identity" && (
					<div className="flex flex-col w-full">
						{hasCover && (
							<div className={`w-full relative overflow-hidden ${styleConfig.coverHeightClass}`}>
								{renderCoverMedia()}
								<div className="absolute inset-x-0 bottom-0 h-1 bg-[var(--glass-border-specular)]" />
							</div>
						)}
						<div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-3.5 w-full">
							<div className="flex flex-col items-center shrink-0">
								{renderAvatar()}
								<span className="mt-1.5 font-semibold text-theme-accent text-xs">
									{profile.handle}
								</span>
							</div>
							<div className="flex flex-col min-w-0 flex-1 text-center sm:text-left">
								<h1 className={`${sizeConfig.nameClass} tracking-tight text-theme-primary drop-shadow-xs mb-1`}>
									{profile.name}
								</h1>
								{hasLocation && (
									<div className="inline-flex items-center gap-1 font-medium text-theme-secondary text-xs mb-1.5 justify-center sm:justify-start">
										<GlobeIcon className="w-2.5 h-2.5 text-theme-muted" />
										{localizedLocation}
									</div>
								)}
								{hasBio && (
									<p className={`${sizeConfig.bioClass} text-theme-secondary leading-relaxed font-normal`}>
										{localizedBio}
									</p>
								)}
							</div>
						</div>
					</div>
				)}

				{/* ------------------------------------------------------------------ */}
				{/* STYLE 09: SOFT CAPSULE                                             */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "soft-capsule" && (
					<div className={`p-4 sm:p-5 flex flex-col items-center text-center`}>
						{hasCover && (
							<div className="w-full h-8 rounded-full overflow-hidden mb-3 relative opacity-80 border border-[var(--glass-border-specular)]">
								{renderCoverMedia()}
							</div>
						)}
						<div className="mb-2">
							{renderAvatar()}
						</div>
						{renderIdentity("center")}
					</div>
				)}

				{/* ------------------------------------------------------------------ */}
				{/* STYLE 10: CINEMATIC MINI                                           */}
				{/* ------------------------------------------------------------------ */}
				{styleId === "cinematic-mini" && (
					<div className="relative flex flex-col w-full overflow-hidden">
						{hasCover && (
							<div className={`w-full relative ${styleConfig.coverHeightClass} overflow-hidden`}>
								{renderCoverMedia("scale-105")}
								<div className="absolute inset-0 bg-gradient-to-t from-[var(--glass-surface-primary)] via-[var(--glass-surface-primary)]/70 to-black/30" />
							</div>
						)}
						<div className={`relative z-10 flex flex-col items-center text-center p-4 sm:p-5 ${hasCover ? "-mt-10" : ""}`}>
							<div className="mb-2">
								{renderAvatar("ring-2 ring-[var(--accent-color)] shadow-2xl")}
							</div>
							<div className="bg-[var(--glass-surface-primary)]/80 backdrop-blur-lg rounded-2xl p-3 sm:p-4 shadow-xl border border-[var(--glass-border-specular)] w-full">
								{renderIdentity("center")}
							</div>
						</div>
					</div>
				)}
			</div>
		</header>
	);
}
