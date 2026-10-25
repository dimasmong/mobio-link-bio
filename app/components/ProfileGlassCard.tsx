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

export function ProfileGlassCard({ profile, lang }: ProfileGlassCardProps) {
	const [imageError, setImageError] = useState(false);
	const initials = getInitials(profile.name);
	const hasAvatar = Boolean(profile.avatarUrl && profile.avatarUrl.trim() !== "");
	const hasLocation = Boolean(profile.location && profile.location[lang]?.trim());
	const hasBio = Boolean(profile.bio && profile.bio[lang]?.trim());

	return (
		<header className="w-full relative z-10">
			<div className="glass-liquid-primary rounded-3xl sm:rounded-4xl p-6 sm:p-8 md:p-10 relative overflow-hidden transition-all duration-300">
				{/* Optical refraction ambient highlights */}
				<div
					className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[var(--accent-subtle)] blur-3xl pointer-events-none opacity-60"
					aria-hidden="true"
				/>
				<div
					className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-[var(--accent-subtle)] blur-3xl pointer-events-none opacity-40"
					aria-hidden="true"
				/>

				<div className="relative flex flex-col items-center text-center">
					{/* Circular Avatar with Polished Liquid Glass Ring */}
					<div className="relative mb-4 sm:mb-5">
						<div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-white via-violet-200 to-white/80 shadow-md flex items-center justify-center">
							{hasAvatar && !imageError ? (
								<img
									src={profile.avatarUrl}
									alt={profile.name}
									width={128}
									height={128}
									onError={() => setImageError(true)}
									className="w-full h-full rounded-full object-cover ring-2 ring-white/95 bg-slate-100"
									loading="eager"
								/>
							) : (
								<div
									className="w-full h-full rounded-full flex items-center justify-center bg-theme-accent font-bold text-2xl sm:text-3xl md:text-4xl shadow-inner ring-2 ring-white/95 select-none"
									style={{ backgroundColor: "var(--accent-color)", color: "var(--accent-foreground)" }}
									aria-label={profile.name}
								>
									{initials}
								</div>
							)}
						</div>
					</div>

					{/* Display Name */}
					<h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-theme-primary mb-1.5">
						{profile.name}
					</h1>

					{/* Username / Handle and Optional Location */}
					<div
						className={`flex items-center justify-center flex-wrap gap-2 text-xs sm:text-sm text-theme-muted ${
							hasBio ? "mb-4" : "mb-0"
						}`}
					>
						<span className="font-semibold px-2.5 py-0.5 rounded-full border bg-theme-accent-subtle">
							{profile.handle}
						</span>
						{hasLocation && (
							<>
								<span className="opacity-40">•</span>
								<span className="inline-flex items-center gap-1 font-medium text-theme-secondary">
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
