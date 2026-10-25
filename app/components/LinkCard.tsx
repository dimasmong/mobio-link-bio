import React from "react";
import type { BioLink, Language } from "../data/profile";
import {
	CodeIcon,
	BookIcon,
	MessageIcon,
	SparklesIcon,
	ExternalLinkIcon,
	GlobeIcon,
} from "./Icons";

interface LinkCardProps {
	link: BioLink;
	lang: Language;
}

function getLinkIcon(iconName?: string) {
	switch (iconName) {
		case "code":
			return <CodeIcon className="w-5 h-5 text-slate-700 group-hover:text-violet-600 transition-colors" />;
		case "book":
			return <BookIcon className="w-5 h-5 text-slate-700 group-hover:text-violet-600 transition-colors" />;
		case "message":
			return <MessageIcon className="w-5 h-5 text-slate-700 group-hover:text-violet-600 transition-colors" />;
		case "sparkles":
			return <SparklesIcon className="w-5 h-5 text-slate-700 group-hover:text-violet-600 transition-colors" />;
		default:
			return <GlobeIcon className="w-5 h-5 text-slate-700 group-hover:text-violet-600 transition-colors" />;
	}
}

function isValidUrl(url?: string): boolean {
	if (!url) return false;
	const trimmed = url.trim();
	return trimmed.length > 0 && trimmed !== "#";
}

export function LinkCard({ link, lang }: LinkCardProps) {
	const hasValidUrl = isValidUrl(link.url);
	const isEmail = link.url?.startsWith("mailto:");

	const content = (
		<div className="glass-card rounded-2xl p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 sm:gap-4 h-full transition-all">
			{/* Left: Icon & Text Body */}
			<div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
				<div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center justify-center shrink-0 self-start mt-0.5 sm:mt-0 group-hover:bg-violet-50 group-hover:border-violet-200 transition-colors">
					{getLinkIcon(link.icon)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 mb-1 flex-wrap">
						<h3 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-violet-700 transition-colors leading-snug break-words">
							{link.title[lang]}
						</h3>
						{link.category && (
							<span className="text-[11px] font-medium text-slate-600 px-2 py-0.5 rounded-md bg-slate-100/90 border border-slate-200/70 shrink-0">
								{link.category[lang]}
							</span>
						)}
					</div>
					{link.description && (
						<p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal break-words">
							{link.description[lang]}
						</p>
					)}
				</div>
			</div>

			{/* Right: Action or State Indicator */}
			<div className="shrink-0 self-start sm:self-center mt-1 sm:mt-0">
				{hasValidUrl ? (
					<div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-400 group-hover:text-violet-600 group-hover:bg-violet-50 group-hover:border-violet-200 group-hover:translate-x-0.5 transition-all">
						<ExternalLinkIcon className="w-4 h-4" />
					</div>
				) : (
					<span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
						{lang === "id" ? "Segera" : "Soon"}
					</span>
				)}
			</div>
		</div>
	);

	if (!hasValidUrl) {
		return (
			<div className="w-full opacity-65 cursor-not-allowed">
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
