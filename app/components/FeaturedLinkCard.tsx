import React from "react";
import type { BioLink, Language } from "../data/profile";
import {
	SparklesIcon,
	CodeIcon,
	BookIcon,
	MessageIcon,
	ExternalLinkIcon,
} from "./Icons";

interface FeaturedLinkCardProps {
	link: BioLink;
	lang: Language;
}

function getLinkIcon(iconName?: string) {
	switch (iconName) {
		case "sparkles":
			return <SparklesIcon className="w-5 h-5 text-violet-600" />;
		case "code":
			return <CodeIcon className="w-5 h-5 text-violet-600" />;
		case "book":
			return <BookIcon className="w-5 h-5 text-violet-600" />;
		case "message":
			return <MessageIcon className="w-5 h-5 text-violet-600" />;
		default:
			return <SparklesIcon className="w-5 h-5 text-violet-600" />;
	}
}

function isValidUrl(url?: string): boolean {
	if (!url) return false;
	const trimmed = url.trim();
	return trimmed.length > 0 && trimmed !== "#";
}

export function FeaturedLinkCard({ link, lang }: FeaturedLinkCardProps) {
	const hasValidUrl = isValidUrl(link.url);
	const isEmail = link.url?.startsWith("mailto:");

	const content = (
		<div className="glass-card-featured rounded-2xl p-5 sm:p-6 relative overflow-hidden">
			{/* Top bar: Icon, Badges, and Action indicator */}
			<div className="flex items-center justify-between mb-3.5 gap-2 flex-wrap">
				<div className="flex items-center gap-2.5 flex-wrap">
					<div className="w-10 h-10 rounded-xl bg-violet-100/90 flex items-center justify-center shadow-2xs group-hover:bg-violet-200 transition-colors shrink-0">
						{getLinkIcon(link.icon)}
					</div>
					{link.badge && (
						<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-600 text-white shadow-2xs">
							<SparklesIcon className="w-3 h-3 text-violet-200" />
							{link.badge[lang]}
						</span>
					)}
					{link.category && (
						<span className="text-xs font-medium text-slate-600 bg-white/80 px-2.5 py-0.5 rounded-md border border-slate-200/70">
							{link.category[lang]}
						</span>
					)}
				</div>

				{hasValidUrl ? (
					<div className="w-8 h-8 rounded-full bg-white/95 border border-violet-100 flex items-center justify-center text-violet-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shadow-2xs shrink-0">
						<ExternalLinkIcon className="w-4 h-4" />
					</div>
				) : (
					<span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
						{lang === "id" ? "Segera Hadir" : "Coming Soon"}
					</span>
				)}
			</div>

			{/* Title & Description with natural wrapping */}
			<h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 group-hover:text-violet-700 transition-colors mb-1.5 tracking-tight leading-snug break-words">
				{link.title[lang]}
			</h2>
			{link.description && (
				<p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal break-words">
					{link.description[lang]}
				</p>
			)}
		</div>
	);

	if (!hasValidUrl) {
		return (
			<div className="w-full opacity-70 cursor-not-allowed">
				{content}
			</div>
		);
	}

	return (
		<a
			href={link.url}
			target={isEmail ? undefined : "_blank"}
			rel={isEmail ? undefined : "noopener noreferrer"}
			className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-2xl"
		>
			{content}
		</a>
	);
}
