import React from "react";
import type { VerticalLink, Language } from "../data/profile";
import {
	GithubIcon,
	LinkedinIcon,
	TwitterIcon,
	InstagramIcon,
	EmailIcon,
	ExternalLinkIcon,
	CodeIcon,
	BookIcon,
	GlobeIcon,
	SparklesIcon,
	MessageIcon,
	YoutubeIcon,
} from "./Icons";

interface VerticalLinkListProps {
	links: VerticalLink[];
	lang: Language;
}

function getPlatformIcon(platform?: string, iconName?: string) {
	const key = (platform || iconName || "").toLowerCase();
	switch (key) {
		case "github":
			return <GithubIcon className="w-5 h-5 text-slate-800" />;
		case "linkedin":
			return <LinkedinIcon className="w-5 h-5 text-[#0a66c2]" />;
		case "twitter":
		case "x":
			return <TwitterIcon className="w-4 h-4 text-slate-900" />;
		case "instagram":
			return <InstagramIcon className="w-5 h-5 text-[#e4405f]" />;
		case "youtube":
			return <YoutubeIcon className="w-5 h-5 text-[#ff0000]" />;
		case "email":
			return <EmailIcon className="w-5 h-5 text-violet-600" />;
		case "code":
			return <CodeIcon className="w-5 h-5 text-violet-600" />;
		case "book":
			return <BookIcon className="w-5 h-5 text-violet-600" />;
		case "message":
			return <MessageIcon className="w-5 h-5 text-violet-600" />;
		case "sparkles":
			return <SparklesIcon className="w-5 h-5 text-violet-600" />;
		default:
			return <GlobeIcon className="w-5 h-5 text-slate-700" />;
	}
}

function isValidUrl(url?: string): boolean {
	if (!url) return false;
	const trimmed = url.trim();
	return trimmed.length > 0 && trimmed !== "#";
}

export function VerticalLinkList({ links, lang }: VerticalLinkListProps) {
	// Filter: only display active links with valid URLs (one link per row, single column)
	const activeLinks = (links || []).filter(
		(l) => l.enabled !== false && isValidUrl(l.url)
	);

	if (activeLinks.length === 0) {
		return (
			<section
				aria-label={lang === "id" ? "Status Tautan" : "Links Status"}
				className="w-full my-6 text-center"
			>
				<div className="glass-liquid-card rounded-2xl p-6 sm:p-8 flex flex-col items-center">
					<div className="w-10 h-10 rounded-full bg-violet-100/80 text-violet-600 flex items-center justify-center mb-3">
						<SparklesIcon className="w-5 h-5" />
					</div>
					<h2 className="text-sm sm:text-base font-semibold text-slate-800 mb-1">
						{lang === "id" ? "Tautan Belum Dikonfigurasi" : "No Links Configured Yet"}
					</h2>
					<p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
						{lang === "id"
							? "Tautan pribadi Anda akan muncul otomatis di sini setelah ditambahkan pada file app/data/profile.ts."
							: "Your personal links will appear automatically here once added to app/data/profile.ts."}
					</p>
				</div>
			</section>
		);
	}

	return (
		<nav
			aria-label={lang === "id" ? "Daftar Tautan" : "Links List"}
			className="w-full my-6 sm:my-8"
		>
			{/* Strict Single Vertical Column on all viewports */}
			<div className="w-full flex flex-col gap-3 sm:gap-3.5">
				{activeLinks.map((link) => {
					const isEmail = link.url.startsWith("mailto:");

					return (
						<a
							key={link.id}
							href={link.url}
							target={isEmail ? undefined : "_blank"}
							rel={isEmail ? undefined : "noopener noreferrer"}
							className="glass-liquid-card rounded-2xl sm:rounded-full px-5 py-4 sm:py-4.5 flex items-center justify-between gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
						>
							{/* Left: Platform / Category Icon */}
							<div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/80 border border-white/90 shadow-2xs flex items-center justify-center shrink-0 group-hover:bg-white group-hover:scale-105 transition-all">
								{getPlatformIcon(link.platform, link.icon)}
							</div>

							{/* Center: Title & Optional Description */}
							<div className="min-w-0 flex-1 text-left">
								<h2 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug break-words">
									{link.title[lang]}
								</h2>
								{link.description && link.description[lang]?.trim() && (
									<p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal mt-0.5 break-words">
										{link.description[lang]}
									</p>
								)}
							</div>

							{/* Right: Refined External Link Indicator */}
							<div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100/60 border border-slate-200/50 flex items-center justify-center text-slate-400 group-hover:text-violet-600 group-hover:bg-violet-50 group-hover:border-violet-200 group-hover:translate-x-0.5 transition-all shrink-0">
								<ExternalLinkIcon className="w-3.5 h-3.5" />
							</div>
						</a>
					);
				})}
			</div>
		</nav>
	);
}
