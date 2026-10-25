import React, { useState } from "react";
import type { ProfileData, Language } from "../data/profile";
import { VerifiedIcon, GlobeIcon } from "./Icons";

interface FloatingGlassProfileProps {
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

export function FloatingGlassProfile({ profile, lang }: FloatingGlassProfileProps) {
	const [imageError, setImageError] = useState(false);
	const showVerified = Boolean(profile.showVerifiedBadge);
	const showStatus = Boolean(profile.showStatusBadge && profile.statusBadge);
	const hasLocation = Boolean(profile.location && profile.location[lang]?.trim());
	const initials = getInitials(profile.name);

	const hasAvatar = Boolean(profile.avatarUrl && profile.avatarUrl.trim() !== "");

	return (
		<header className="w-full">
			<div className="glass-panel rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden transition-all duration-300">
				{/* Subtle interior decorative radial glow (restrained violet & sky) */}
				<div
					className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-violet-200/35 blur-3xl pointer-events-none"
					aria-hidden="true"
				/>
				<div
					className="absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-indigo-100/35 blur-3xl pointer-events-none"
					aria-hidden="true"
				/>

				<div className="relative flex flex-col items-center text-center">
					{/* Avatar with frosted ring and initials fallback */}
					<div className="relative mb-5 group">
						<div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-violet-400/30 via-white to-purple-300/30 shadow-md flex items-center justify-center">
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
									className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-violet-600 to-indigo-500 text-white font-bold text-2xl sm:text-3xl md:text-4xl shadow-inner ring-2 ring-white/95 select-none"
									aria-label={profile.name}
								>
									{initials}
								</div>
							)}
						</div>

						{/* Optional Status Pulse Dot (Default OFF) */}
						{showStatus && profile.statusBadge && (
							<span
								className="absolute bottom-1 right-2 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white shadow-xs flex items-center justify-center"
								title={profile.statusBadge[lang]}
								aria-label={profile.statusBadge[lang]}
							>
								<span className="w-2 h-2 rounded-full bg-white animate-pulse" />
							</span>
						)}
					</div>

					{/* Optional Status Badge Pill (Default OFF) */}
					{showStatus && profile.statusBadge && (
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100 mb-3 shadow-2xs">
							<span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
							<span>{profile.statusBadge[lang]}</span>
						</div>
					)}

					{/* Name & Optional Verified Badge */}
					<div className="flex items-center justify-center gap-2 mb-1.5">
						<h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
							{profile.name}
						</h1>
						{showVerified && (
							<VerifiedIcon className="w-5 h-5 text-violet-600 inline-block" />
						)}
					</div>

					{/* Handle and Optional Location */}
					<div className="flex items-center justify-center flex-wrap gap-2 text-xs sm:text-sm text-slate-500 mb-4">
						<span className="font-semibold text-violet-600 bg-violet-50/80 px-2 py-0.5 rounded-md border border-violet-100/60">
							{profile.handle}
						</span>
						{hasLocation && (
							<>
								<span>•</span>
								<span className="inline-flex items-center gap-1 font-medium text-slate-600">
									<GlobeIcon className="w-3.5 h-3.5 text-slate-400" />
									{profile.location?.[lang]}
								</span>
							</>
						)}
					</div>

					{/* Bio Paragraph */}
					<p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md sm:max-w-lg md:max-w-xl mx-auto font-normal">
						{profile.bio[lang]}
					</p>
				</div>
			</div>
		</header>
	);
}
