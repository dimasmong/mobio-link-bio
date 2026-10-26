import React from "react";
import type { VerticalLink, Language } from "../data/profile";
import { getLocalizedText, TRANSLATIONS } from "../lib/i18n";
import { ExternalLinkIcon, SparklesIcon } from "./Icons";
import { LinkIconRenderer } from "./IconLibrary";
import type { LinkArrangement } from "../lib/layouts";

interface VerticalLinkListProps {
	links: VerticalLink[];
	lang: Language;
	isPreview?: boolean;
	arrangement?: LinkArrangement;
}

function isValidUrl(url?: string): boolean {
	if (!url) return false;
	const trimmed = url.trim();
	return trimmed.length > 0 && trimmed !== "#";
}

export function VerticalLinkList({
	links,
	lang,
	isPreview = false,
	arrangement = "stack",
}: VerticalLinkListProps) {
	// Filter: only display active links with valid URLs
	const activeLinks = (links || []).filter(
		(l) => l.enabled !== false && isValidUrl(l.url)
	);

	if (activeLinks.length === 0) {
		return (
			<section
				aria-label={TRANSLATIONS[lang].public.linksStatusAria}
				className="w-full my-6 text-center"
			>
				<div className="glass-liquid-card rounded-2xl p-6 sm:p-8 flex flex-col items-center">
					<div className="w-10 h-10 rounded-full bg-theme-accent-subtle text-theme-accent flex items-center justify-center mb-3">
						<SparklesIcon className="w-5 h-5" />
					</div>
					<h2 className="text-sm sm:text-base font-semibold text-theme-primary mb-1">
						{TRANSLATIONS[lang].public.noLinksTitle}
					</h2>
					<p className="text-xs sm:text-sm text-theme-muted max-w-sm leading-relaxed">
						{TRANSLATIONS[lang].public.noLinksDesc}
					</p>
				</div>
			</section>
		);
	}

	// Determine container classes based on arrangement
	let containerClass = "w-full flex flex-col gap-3 sm:gap-3.5";
	if (arrangement === "grid-2") {
		containerClass = "w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5";
	} else if (arrangement === "dense-stack") {
		containerClass = "w-full flex flex-col gap-2";
	} else if (arrangement === "island-stack") {
		containerClass = "w-full flex flex-col gap-4";
	}

	return (
		<nav
			aria-label={TRANSLATIONS[lang].public.linksListAria}
			className="w-full my-6 sm:my-8"
		>
			<div className={containerClass}>
				{activeLinks.map((link) => {
					const isEmail = link.url.startsWith("mailto:");
					const href = (!isPreview && !isEmail && link.id && !link.id.startsWith("profile-") && !link.url.startsWith("#"))
						? `/go/${link.id}`
						: link.url;

					let cardStyleClass = "glass-liquid-card rounded-2xl px-5 py-4 sm:py-4.5";
					if (arrangement === "capsule-stack") {
						cardStyleClass = "glass-liquid-card rounded-full px-5 py-3.5";
					} else if (arrangement === "dense-stack") {
						cardStyleClass = "glass-liquid-card rounded-xl px-4 py-3";
					} else if (arrangement === "minimal-stack") {
						cardStyleClass = "border-0 bg-transparent hover:bg-[var(--glass-surface-hover)] border-b border-[var(--glass-border-subtle)] rounded-none px-3 py-3.5";
					} else if (arrangement === "island-stack") {
						cardStyleClass = "glass-liquid-card rounded-2xl px-5 py-4.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-transform";
					}

					const localizedTitle = getLocalizedText(link.title, lang, "Link");
					const localizedDesc = getLocalizedText(link.description, lang);

					return (
						<a
							key={link.id}
							href={href}
							target={isEmail ? undefined : "_blank"}
							rel={isEmail ? undefined : "noopener noreferrer"}
							className={`${cardStyleClass} flex items-center justify-between gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] transition-all`}
						>
							{/* Left: Platform / Category Icon */}
							<div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-specular)] shadow-2xs flex items-center justify-center shrink-0 group-hover:bg-[var(--glass-surface-hover)] group-hover:scale-105 transition-all overflow-hidden p-2">
								<LinkIconRenderer link={link} className="w-5 h-5" />
							</div>

							{/* Center: Title & Optional Description */}
							<div className="min-w-0 flex-1 text-left">
								<h2 className="text-sm sm:text-base font-semibold text-theme-primary group-hover:text-[var(--accent-color)] transition-colors leading-snug break-words">
									{localizedTitle}
								</h2>
								{localizedDesc && (
									<p className="text-xs sm:text-sm text-theme-secondary leading-relaxed font-normal mt-0.5 break-words">
										{localizedDesc}
									</p>
								)}
							</div>

							{/* Right: Refined External Link Indicator */}
							<div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--glass-surface-secondary)] border border-[var(--glass-border-subtle)] flex items-center justify-center text-theme-muted group-hover:text-[var(--accent-color)] group-hover:bg-[var(--accent-subtle)] group-hover:border-[var(--accent-border)] group-hover:translate-x-0.5 transition-all shrink-0">
								<ExternalLinkIcon className="w-3.5 h-3.5" />
							</div>
						</a>
					);
				})}
			</div>
		</nav>
	);
}
