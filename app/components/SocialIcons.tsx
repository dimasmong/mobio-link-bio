import React from "react";
import type { SocialLink, SocialPlatform, Language } from "../data/profile";
import {
	GithubIcon,
	LinkedinIcon,
	TwitterIcon,
	InstagramIcon,
	EmailIcon,
	GlobeIcon,
} from "./Icons";

interface SocialIconsProps {
	socials: SocialLink[];
	navLabel: string;
}

function getPlatformIcon(platform: SocialPlatform) {
	switch (platform) {
		case "github":
			return <GithubIcon className="w-5 h-5" />;
		case "linkedin":
			return <LinkedinIcon className="w-5 h-5" />;
		case "twitter":
			return <TwitterIcon className="w-4 h-4" />;
		case "instagram":
			return <InstagramIcon className="w-5 h-5" />;
		case "email":
			return <EmailIcon className="w-5 h-5" />;
		default:
			return <GlobeIcon className="w-5 h-5" />;
	}
}

function isValidUrl(url?: string): boolean {
	if (!url) return false;
	const trimmed = url.trim();
	return trimmed.length > 0 && trimmed !== "#";
}

export function SocialIcons({ socials, navLabel }: SocialIconsProps) {
	// Filter: only display active social profiles with valid URLs
	const activeSocials = (socials || []).filter((s) => isValidUrl(s.url));

	if (activeSocials.length === 0) return null;

	return (
		<nav
			aria-label={navLabel}
			className="w-full flex items-center justify-center my-6"
		>
			<ul className="flex items-center justify-center flex-wrap gap-2.5 sm:gap-3 px-4 py-2.5 rounded-full glass-panel shadow-xs border border-white/80">
				{activeSocials.map((social) => {
					const isEmail = social.platform === "email" || social.url.startsWith("mailto:");
					return (
						<li key={social.platform}>
							<a
								href={social.url}
								target={isEmail ? undefined : "_blank"}
								rel={isEmail ? undefined : "noopener noreferrer"}
								aria-label={social.label}
								title={social.label}
								className="social-pill w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-slate-600 hover:text-violet-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
							>
								{getPlatformIcon(social.platform)}
								<span className="sr-only">{social.label}</span>
							</a>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
